"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function DatasetStudioContent() {
  const [classes, setClasses] = useState([]);
  const [newClassName, setNewClassName] = useState("");
  const [showAddClass, setShowAddClass] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeClassId, setActiveClassId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [datasetName, setDatasetName] = useState("");
  const [modelData, setModelData] = useState(null);
  
  // Progress tracking states
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
    status: 'idle', // idle, uploading, completed, error
    currentFile: '',
    errors: [],
    percentage: 0
  });
  
  const inputRef = useRef(null);
  const progressIntervalRef = useRef(null);
  
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const modelId = searchParams.get('modelId');

  // Get model data from URL params and fetch from API
  useEffect(() => {
    if (modelId && session?.user) {
      fetchModelData(modelId);
    }
  }, [searchParams, session]);

  // Progress polling effect
  useEffect(() => {
    if (uploadProgress.status === 'uploading' && modelId) {
      progressIntervalRef.current = setInterval(() => {
        pollUploadProgress();
      }, 1000);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [uploadProgress.status, modelId]);

  const fetchModelData = async (modelId) => {
    try {
      const response = await fetch(`/api/ml-models/get-model?modelId=${modelId}`);
      if (response.ok) {
        const result = await response.json();
        setModelData(result.model);
        setDatasetName(result.model.name + " Dataset" || "My Dataset");
      } else {
        console.error("Failed to fetch model data");
      }
    } catch (error) {
      console.error("Error fetching model data:", error);
    }
  };

  const pollUploadProgress = async () => {
    try {
      const response = await fetch(`/api/ml-models/upload-progress?modelId=${modelId}`);
      if (response.ok) {
        const { progress } = await response.json();
        const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
        
        setUploadProgress(prev => ({
          ...prev,
          ...progress,
          percentage
        }));

        if (progress.status === 'completed' || progress.status === 'error') {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
        }
      }
    } catch (error) {
      console.error("Error polling progress:", error);
    }
  };

  // Save dataset to MongoDB with progress tracking
  const saveDataset = async () => {
    if (!session?.user) {
      alert("Please log in to save your dataset");
      return false;
    }

    if (!modelId) {
      alert("Model ID is required. Please create a model first.");
      return false;
    }

    if (classes.length < 2) {
      alert("Please add at least 2 classes before proceeding");
      return false;
    }

    // Check if each class has at least 5 images (reduced from 10 for better UX)
    const classesWithInsufficientImages = classes.filter(cls => cls.images.length < 5);
    if (classesWithInsufficientImages.length > 0) {
      const classNames = classesWithInsufficientImages.map(cls => cls.name).join(', ');
      alert(`Each class requires at least 5 images. The following classes need more images: ${classNames}`);
      return false;
    }

    if (getTotalImages() < 10) {
      alert("Please upload at least 10 total images before proceeding");
      return false;
    }

    setIsLoading(true);
    
    // Initialize progress
    const totalFiles = getTotalImages();
    setUploadProgress({
      current: 0,
      total: totalFiles,
      status: 'uploading',
      currentFile: 'Preparing upload...',
      errors: [],
      percentage: 0
    });
    
    try {
      // Prepare dataset metadata
      const datasetData = {
        modelId,
        name: datasetName || "My Dataset",
        description: `${modelData?.category || "Custom"} classification dataset`,
        category: modelData?.category || "custom",
        modelType: modelData?.modelType || "image-classification",
        classes: classes.map(cls => ({
          id: cls.id,
          name: cls.name,
          imageCount: cls.images.length
        }))
      };

      const formData = new FormData();
      formData.append('metadata', JSON.stringify(datasetData));

      // Append files with progress tracking
      let fileIndex = 0;
      classes.forEach((cls) => {
        cls.images.forEach((img) => {
          if (img.file) {
            formData.append(`files[${cls.id}][${img.id}]`, img.file);
            fileIndex++;
          }
        });
      });

      // Start upload
      setUploadProgress(prev => ({
        ...prev,
        currentFile: 'Starting upload...',
        percentage: 0
      }));

      const response = await fetch("/api/ml-models/save-dataset", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save dataset");
      }

      const result = await response.json();
      console.log("Dataset saved successfully:", result);
      
      // Update progress to completed
      setUploadProgress(prev => ({
        ...prev,
        status: 'completed',
        current: prev.total,
        percentage: 100,
        currentFile: 'Upload completed!'
      }));
      
      // Store dataset ID for the training page
      localStorage.setItem('currentDatasetId', result.dataset.id);
      
      return true;
    } catch (error) {
      console.error("Error saving dataset:", error);
      setUploadProgress(prev => ({
        ...prev,
        status: 'error',
        errors: [...prev.errors, error.message],
        currentFile: 'Upload failed'
      }));
      alert("Failed to save dataset: " + error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle start training with dataset save
  const handleUploadDataset = async () => {
    const saved = await saveDataset();
    if (saved) {
      // Small delay to show completion before navigation
      setTimeout(() => {
        router.push(`/ml-studio/training?modelId=${modelId}`);
      }, 1500);
    }
  };

  // Add a new class
  const addClass = () => {
    if (newClassName.trim()) {
      const newClass = {
        id: Date.now(),
        name: newClassName.trim(),
        images: []
      };
      setClasses([...classes, newClass]);
      setNewClassName("");
      setShowAddClass(false);
    }
  };

  // Delete a class
  const deleteClass = (classId) => {
    setClasses(classes.filter(cls => cls.id !== classId));
    if (activeClassId === classId) {
      setActiveClassId(null);
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e, classId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files, classId);
    }
  };

  const handleChange = (e, classId) => {
    e.preventDefault();
    if (isLoading) return;
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files, classId);
    }
  };

  const handleFiles = (files, classId) => {
    const newImages = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      file: file,
      url: URL.createObjectURL(file),
      name: file.name
    }));

    setClasses(classes.map(cls => 
      cls.id === classId 
        ? { ...cls, images: [...cls.images, ...newImages] }
        : cls
    ));
  };

  // Remove image from class
  const removeImage = (classId, imageId) => {
    setClasses(classes.map(cls =>
      cls.id === classId
        ? { ...cls, images: cls.images.filter(img => img.id !== imageId) }
        : cls
    ));
  };

  // Get total image count
  const getTotalImages = () => {
    return classes.reduce((total, cls) => total + cls.images.length, 0);
  };

  // Check if all classes meet minimum requirement
  const allClassesMeetMinimum = () => {
    return classes.every(cls => cls.images.length >= 5);
  };

  const onButtonClick = (classId) => {
    setActiveClassId(classId);
    inputRef.current.click();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#181818]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#4f7269]/10 backdrop-blur-lg border-b border-gray-100 dark:border-[#3B3B3B] z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="relative w-[34px] h-[34px]">
                <Image
                  src="/whisper_logo.png"
                  alt="QuestWhisper"
                  fill
                  className="object-contain dark:collapse"
                />
                <Image
                  src="/whisper_logo_dark.png"
                  alt="QuestWhisper"
                  fill
                  className="object-contain collapse dark:visible"
                />
              </div>
              <Link href="/ml-studio" className="flex items-center space-x-1">
                <span className="text-xl font-semibold text-[#4f7269]">
                  Quest
                </span>
                <span className="text-xl font-semibold text-[#4f7269]">
                  Whisper
                </span>
                <span className="text-xl font-semibold text-[#4f7269] ml-1">
                  ML Studio
                </span>
              </Link>
            </div>
            <div className="flex space-x-4">
              <Link href="/ml-studio/create">
                <button className="bg-transparent text-[#4f7269] px-4 py-2 rounded-full hover:bg-[#4f7269]/10 transition-colors font-medium">
                  Back to Model Setup
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Upload Progress Modal */}
      <AnimatePresence>
        {uploadProgress.status === 'uploading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#2a2a2a] rounded-2xl p-8 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Uploading Dataset
              </h3>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>{uploadProgress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-[#4f7269] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.percentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {uploadProgress.current} of {uploadProgress.total} files uploaded
              </div>

              <div className="text-sm text-gray-800 dark:text-gray-200 truncate">
                {uploadProgress.currentFile}
              </div>

              {uploadProgress.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-sm text-red-600 dark:text-red-400">
                    {uploadProgress.errors[uploadProgress.errors.length - 1]}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {uploadProgress.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#2a2a2a] rounded-2xl p-8 max-w-md w-full mx-4 text-center"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Upload Complete!
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your dataset has been successfully uploaded and processed.
              </p>

              <div className="text-sm text-gray-500 dark:text-gray-500">
                Redirecting to training...
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8" style={{marginTop: '80px'}}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <h1 className="text-4xl font-bold text-slate-700 dark:text-slate-200 mb-6">
              Dataset <span className="text-[#4f7269]">Studio</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl">
              Create classes and upload training images for each class. Organize your data to build powerful classification models.
            </p>

            {/* Progress Summary */}
            {getTotalImages() > 0 && (
              <div className="mt-6 p-4 bg-[#4f7269]/5 rounded-lg border border-[#4f7269]/20">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total Images: {getTotalImages()} | Classes: {classes.length}
                    </span>
                    {allClassesMeetMinimum() && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        Ready for Training
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Dataset Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-[#212124] rounded-2xl p-8 shadow-sm mb-8"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1 mr-6">
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-4">
                  Dataset Overview
                </h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Dataset Name
                  </label>
                  <input
                    type="text"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    placeholder="Enter dataset name (e.g., 'My Pet Classifier')"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-[#3B3B3B] bg-white dark:bg-[#181818] text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4f7269] focus:border-transparent"
                  />
                </div>
                <p className="text-gray-600 dark:text-slate-300">
                  {classes.length} classes • {getTotalImages()} total images
                  {classes.length > 0 && (
                    <span className={`ml-2 text-sm ${
                      allClassesMeetMinimum() 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-orange-600 dark:text-orange-400"
                    }`}>
                      {allClassesMeetMinimum() ? "✓ All classes meet minimum" : "⚠ Some classes need more images"}
                    </span>
                  )}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                onClick={() => !isLoading && setShowAddClass(true)}
                disabled={isLoading}
                className={`${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                } bg-[#4f7269] text-white px-6 py-3 rounded-full font-medium hover:bg-[#3f5a51] transition-colors duration-300 flex items-center space-x-2`}
              >
                <span>+</span>
                <span>Add Class</span>
              </motion.button>
            </div>

            {/* Add Class Modal */}
            <AnimatePresence>
              {showAddClass && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                  onClick={() => setShowAddClass(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-[#212124] rounded-2xl p-8 max-w-md w-full"
                  >
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">
                      Add New Class
                    </h3>
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="Enter class name (e.g., 'cat', 'dog', 'flower')"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-[#3B3B3B] bg-white dark:bg-[#181818] text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4f7269] focus:border-transparent mb-6"
                      onKeyPress={(e) => e.key === 'Enter' && addClass()}
                      autoFocus
                    />
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowAddClass(false)}
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-[#3B3B3B] text-gray-600 dark:text-slate-300 hover:border-[#4f7269] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addClass}
                        disabled={!newClassName.trim()}
                        className="flex-1 px-4 py-3 rounded-lg bg-[#4f7269] text-white hover:bg-[#3f5a51] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Add Class
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Classes Grid */}
          {classes.length > 0 ? (
            <div className="space-y-8">
              {classes.map((classItem, index) => (
                <motion.div
                  key={classItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white dark:bg-[#212124] rounded-2xl p-8 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 capitalize">
                        {classItem.name}
                      </h3>
                      <p className={`text-sm ${
                        classItem.images.length >= 5 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-orange-600 dark:text-orange-400"
                      }`}>
                        {classItem.images.length} images {classItem.images.length < 5 && `(minimum 5 required)`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => !isLoading && onButtonClick(classItem.id)}
                        disabled={isLoading}
                        className={`${
                          isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        } bg-[#4f7269] text-white px-4 py-2 rounded-lg hover:bg-[#3f5a51] transition-colors font-medium`}
                      >
                        Upload Images
                      </button>
                      <button
                        onClick={() => !isLoading && deleteClass(classItem.id)}
                        disabled={isLoading}
                        className={`${
                          isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        } text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Upload Area */}
                  <div
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl transition-all duration-300 mb-6 ${
                      isLoading ? 'opacity-50 cursor-not-allowed' :
                      dragActive && activeClassId === classItem.id
                        ? "border-[#4f7269] bg-[#4f7269]/5"
                        : "border-gray-300 dark:border-[#3B3B3B] hover:border-[#4f7269]/50 bg-gray-50 dark:bg-[#181818]/50"
                    }`}
                    onDragEnter={!isLoading ? handleDrag : undefined}
                    onDragLeave={!isLoading ? handleDrag : undefined}
                    onDragOver={!isLoading ? handleDrag : undefined}
                    onDrop={!isLoading ? (e) => handleDrop(e, classItem.id) : undefined}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <svg
                        className={`w-8 h-8 mb-2 transition-colors duration-300 ${
                          dragActive && activeClassId === classItem.id ? "text-[#4f7269]" : "text-gray-400 dark:text-gray-500"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        ></path>
                      </svg>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Drag and drop images for <span className="font-semibold capitalize">{classItem.name}</span>
                        <br />
                        <span className="text-xs text-orange-600 dark:text-orange-400">
                          Minimum 5 images required per class
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Images Grid */}
                  {classItem.images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {classItem.images.map((image) => (
                        <motion.div
                          key={image.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative group"
                        >
                          <div className="relative h-24 w-full bg-gray-100 dark:bg-[#181818] rounded-lg overflow-hidden">
                            <Image
                              src={image.url}
                              alt={`${classItem.name} image`}
                              fill
                              className="object-cover"
                            />
                            <button
                              onClick={() => !isLoading && removeImage(classItem.id, image.id)}
                              disabled={isLoading}
                              className={`absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center ${
                                isLoading ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                              } transition-opacity text-xs hover:bg-red-600`}
                            >
                              ×
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {image.name}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No images uploaded for this class yet
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white dark:bg-[#212124] rounded-2xl p-16 shadow-sm text-center"
            >
              <div className="w-20 h-20 bg-[#4f7269]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📁</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">
                No Classes Created Yet
              </h3>
              <p className="text-gray-600 dark:text-slate-300 mb-8 max-w-md mx-auto">
                Start by creating your first class. For example, if you're building a pet classifier, you might create "cat" and "dog" classes.
              </p>
              <button
                onClick={() => setShowAddClass(true)}
                className="bg-[#4f7269] text-white px-8 py-3 rounded-full font-medium hover:bg-[#3f5a51] transition-colors duration-300"
              >
                Create Your First Class
              </button>
            </motion.div>
          )}

          {/* Hidden file input */}
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={(e) => handleChange(e, activeClassId)}
            accept="image/*"
            className="hidden"
          />

          {/* Actions */}
          <div className="flex justify-between items-center mt-12">
            <Link href="/ml-studio/create">
              <motion.button
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                disabled={isLoading}
                className={`px-8 py-3 rounded-full font-medium border border-gray-200 dark:border-[#3B3B3B] text-gray-600 dark:text-slate-300 hover:border-[#4f7269] hover:text-[#4f7269] transition-colors duration-300 ${
                  isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                }`}
              >
                Back
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUploadDataset}
              disabled={classes.length < 2 || getTotalImages() < 10 || classes.some(cls => cls.images.length < 5) || isLoading}
              className={`px-8 py-3 rounded-full font-medium ${
                classes.length >= 2 && getTotalImages() >= 10 && classes.every(cls => cls.images.length >= 5) && !isLoading
                  ? "bg-[#4f7269] text-white hover:bg-[#3f5a51]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              } transition-colors duration-300 flex items-center space-x-2`}
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>
                {isLoading ? "Saving Dataset..." : "Upload Dataset"}
                {!isLoading && classes.length < 2 && ` (Need ${2 - classes.length} more classes)`}
                {!isLoading && classes.length >= 2 && classes.some(cls => cls.images.length < 5) && ` (Each class needs 5+ images)`}
                {!isLoading && classes.length >= 2 && classes.every(cls => cls.images.length >= 5) && getTotalImages() < 10 && ` (Need ${10 - getTotalImages()} more total images)`}
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 dark:border-[#3B3B3B] dark:bg-[#181818] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="relative w-[24px] h-[24px]">
                <Image
                  src="/whisper_logo.png"
                  alt="QuestWhisper"
                  fill
                  className="object-contain dark:collapse"
                />
                <Image
                  src="/whisper_logo_dark.png"
                  alt="QuestWhisper"
                  fill
                  className="object-contain collapse dark:visible"
                />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-300">
                © 2025 QuestWhisper ML Studio. All rights reserved.
              </span>
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy-policy" className="text-sm text-slate-600 dark:text-slate-300 hover:text-[#4f7269] hover:font-bold transition-colors">
                Privacy
              </Link>
              <Link href="/terms-of-service" className="text-sm text-slate-600 dark:text-slate-300 hover:text-[#4f7269] hover:font-bold transition-colors">
                Terms
              </Link>
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=support@iwhispered.com&su=QuestWhisper%20ML%20Studio%20Support"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-600 dark:text-slate-300 hover:text-[#4f7269] hover:font-bold transition-colors"
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function DatasetStudio() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DatasetStudioContent />
    </Suspense>
  );
} 