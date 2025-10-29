"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import LoadingAnimation from '../../../components/LoadingAnimation';
import { uploadToFirebase } from '../../../lib/firebase';

function PredictionStudioInner() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("upload"); // upload, camera, url
  const [error, setError] = useState(null);
  const [modelId, setModelId] = useState(null);
  const fileInputRef = useRef(null);
  const urlInputRef = useRef(null);

  const { data: session } = useSession();
  const searchParams = useSearchParams();

  // Get modelId from URL params
  useEffect(() => {
    const modelIdFromParams = searchParams.get('modelId');
    if (modelIdFromParams) {
      setModelId(modelIdFromParams);
    }
  }, [searchParams]);

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedImage(URL.createObjectURL(file));
      setError(null);
      await predictImage(file);
    }
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    const url = urlInputRef.current.value;
    if (url) {
      setSelectedImage(url);
      setSelectedFile(null);
      setError(null);
      await predictImageFromUrl(url);
    }
  };

  const uploadImageToFirebase = async (file) => {
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const timestamp = Date.now();
    const fileName = `${file.name.replace(/\.[^/.]+$/, "")}_${timestamp}`;
    const fileExtension = file.name.split('.').pop();
    const firebasePath = `predictions/${session.user.id}/${fileName}.${fileExtension}`;

    const result = await uploadToFirebase(file, firebasePath);
    
    if (!result.success) {
      throw new Error(`Failed to upload image: ${result.error}`);
    }

    return result.url;
  };

  const predictImage = async (file) => {
    if (!modelId) {
      setError("No model ID found. Please select a model first.");
      return;
    }

    setIsLoading(true);
    setPredictions(null);
    setError(null);

    try {
      // Upload image to Firebase
      const imageUrl = await uploadImageToFirebase(file);

      // Call our API endpoint which handles JWT authentication
      const response = await fetch('/api/ml-models/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: modelId,
          image_url: imageUrl,
          preprocess: true,
          return_confidence: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get prediction');
      }

      const result = await response.json();
      
      // Transform the response to match our UI format
      if (result.predictions && Array.isArray(result.predictions)) {
        // Get the class names from model metadata
        const classNames = result.model_metadata?.dataset?.classes || [];
        
        // Create predictions array with class names and confidence scores
        const formattedPredictions = result.predictions[0].map((confidence, index) => {
          const className = classNames[index]?.name || `Class ${index}`;
          return {
            class: className,
            confidence: confidence
          };
        });
        
        // Sort by confidence (highest first)
        formattedPredictions.sort((a, b) => b.confidence - a.confidence);
        
        setPredictions(formattedPredictions);
      } else {
        throw new Error('Invalid prediction response format');
      }

    } catch (error) {
      console.error('Prediction error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const predictImageFromUrl = async (imageUrl) => {
    if (!modelId) {
      setError("No model ID found. Please select a model first.");
      return;
    }

    setIsLoading(true);
    setPredictions(null);
    setError(null);

    try {
      // Call our API endpoint which handles JWT authentication
      const response = await fetch('/api/ml-models/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: modelId,
          image_url: imageUrl,
          preprocess: true,
          return_confidence: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get prediction');
      }

      const result = await response.json();
      
      // Transform the response to match our UI format
      if (result.predictions && Array.isArray(result.predictions)) {
        // Get the class names from model metadata
        const classNames = result.model_metadata?.dataset?.classes || [];
        
        // Create predictions array with class names and confidence scores
        const formattedPredictions = result.predictions[0].map((confidence, index) => {
          const className = classNames[index]?.name || `Class ${index}`;
          return {
            class: className,
            confidence: confidence
          };
        });
        
        // Sort by confidence (highest first)
        formattedPredictions.sort((a, b) => b.confidence - a.confidence);
        
        setPredictions(formattedPredictions);
      } else {
        throw new Error('Invalid prediction response format');
      }

    } catch (error) {
      console.error('Prediction error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setSelectedImage(URL.createObjectURL(file));
      setError(null);
      await predictImage(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Check if user is authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#181818] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-slate-300 mb-6">
            Please log in to use the prediction studio.
          </p>
          <Link href="/login">
            <button className="bg-[#4f7269] text-white px-6 py-3 rounded-full font-medium hover:bg-[#3f5a51] transition-colors">
              Go to Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

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
              <Link href="/ml-studio/training">
                <button className="bg-transparent text-[#4f7269] px-4 py-2 rounded-full hover:bg-[#4f7269]/10 transition-colors font-medium">
                  Back to Training
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

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
              Prediction <span className="text-[#4f7269]">Studio</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl">
              Test your trained model with new images. Upload an image or provide a URL to see how your model performs.
            </p>
            
            {/* Model ID Display */}
            {modelId && (
              <div className="mt-4 p-3 bg-[#4f7269]/10 rounded-lg border border-[#4f7269]/20">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Model ID: <span className="text-[#4f7269] font-mono">{modelId}</span>
                </span>
              </div>
            )}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Image Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-[#212124] rounded-2xl p-8 shadow-sm"
            >
              <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-6">
                Test Image
              </h2>

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
                  </div>
                </div>
              )}

              {/* Input Tabs */}
              <div className="flex border-b border-gray-200 dark:border-[#3B3B3B] mb-6">
                <button
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === "upload"
                      ? "text-[#4f7269] border-b-2 border-[#4f7269]"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                  onClick={() => setActiveTab("upload")}
                >
                  Upload
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === "camera"
                      ? "text-[#4f7269] border-b-2 border-[#4f7269]"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                  onClick={() => setActiveTab("camera")}
                >
                  Camera
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === "url"
                      ? "text-[#4f7269] border-b-2 border-[#4f7269]"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                  onClick={() => setActiveTab("url")}
                >
                  URL
                </button>
              </div>

              {/* Upload Tab */}
              {activeTab === "upload" && (
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-[#3B3B3B] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#4f7269]/50 transition-colors"
                  onClick={() => fileInputRef.current.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <svg
                    className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG or JPEG
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              )}

              {/* Camera Tab */}
              {activeTab === "camera" && (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-[#3B3B3B] rounded-xl">
                  <svg
                    className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Camera access is not available in this demo
                  </p>
                  <button className="px-4 py-2 bg-[#4f7269] text-white rounded-lg font-medium hover:bg-[#3f5a51] transition-colors">
                    Enable Camera
                  </button>
                </div>
              )}

              {/* URL Tab */}
              {activeTab === "url" && (
                <form onSubmit={handleUrlSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Image URL
                    </label>
                    <input
                      ref={urlInputRef}
                      type="url"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-[#3B3B3B] bg-white dark:bg-[#212124] text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4f7269] focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#4f7269] text-white rounded-lg font-medium hover:bg-[#3f5a51] transition-colors"
                    >
                      Load Image
                    </button>
                  </div>
                </form>
              )}

              {/* Preview */}
              {selectedImage && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
                    Preview
                  </h3>
                  <div className="relative w-full h-64 bg-gray-100 dark:bg-[#181818]/50 rounded-xl overflow-hidden">
                    <Image
                      src={selectedImage}
                      alt="Selected image"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Right Column - Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white dark:bg-[#212124] rounded-2xl p-8 shadow-sm"
            >
              <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-6">
                Prediction Results
              </h2>

              {isLoading ? (
                <LoadingAnimation 
                  text="Analyzing image..."
                  size="medium"
                  inline={true}
                />
              ) : predictions ? (
                <div>
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
                      Confidence Scores
                    </h3>
                    <div className="space-y-4">
                      {predictions.map((prediction, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300 capitalize">
                              {prediction.class}
                            </span>
                            <span className="text-sm font-medium text-[#4f7269]">
                              {(prediction.confidence * 100).toFixed(2)}%
                            </span>
                          </div>
                          <div className="w-full h-3 bg-gray-200 dark:bg-[#3B3B3B] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: "0%" }}
                              animate={{ width: `${prediction.confidence * 100}%` }}
                              transition={{ duration: 1, delay: index * 0.2 }}
                              className="h-full bg-[#4f7269] rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
                      Final Prediction
                    </h3>
                    <div className="bg-[#4f7269]/10 rounded-xl p-6 text-center">
                      <p className="text-2xl font-bold text-[#4f7269] capitalize mb-2">
                        {predictions[0].class}
                      </p>
                      <p className="text-gray-600 dark:text-slate-300">
                        with {(predictions[0].confidence * 100).toFixed(2)}% confidence
                      </p>
                    </div>
                  </div>

                  {/* Share Results */}
                  <div className="mt-8 flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center px-6 py-3 bg-[#4f7269] text-white rounded-full font-medium hover:bg-[#3f5a51] transition-colors"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                      Share Results
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg
                    className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    No predictions yet
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
                    Upload or select an image to see how your model performs
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Actions */}
          <div className="mt-12 flex justify-between items-center">
            <Link href="/ml-studio/training">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 rounded-full font-medium border border-gray-200 dark:border-[#3B3B3B] text-gray-600 dark:text-slate-300 hover:border-[#4f7269] hover:text-[#4f7269] transition-colors duration-300"
              >
                Back to Training
              </motion.button>
            </Link>
            <Link href="/ml-studio">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 rounded-full font-medium bg-[#4f7269] text-white hover:bg-[#3f5a51] transition-colors duration-300"
              >
                Finish & Return to Studio
              </motion.button>
            </Link>
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

export default function PredictionStudio() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-[#181818] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f7269]"></div>
            <p className="text-slate-700 dark:text-slate-200 text-sm">Loading prediction studio…</p>
          </div>
        </div>
      }
    >
      <PredictionStudioInner />
    </Suspense>
  );
}