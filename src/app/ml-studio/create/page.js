"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function CreateModel() {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedModelType, setSelectedModelType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { data: session } = useSession();
  const router = useRouter();

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    datasetRequirements: '',
    targetAccuracy: 0.85,
    modelType: 'transfer-learning',
    category: 'medical',
    modelId: '', // Will be generated as username_randomgenerated6digitnumber
    teamMembers: [],
    teamId: '',
    input_shape: [224, 224, 3], // Standard for image models
    epochs: 10,
    batchSize: 32,
    dataAugmentation: true,
    transferLearning: true,
    config: {
      base_model: 'resnet50',
      use_attention: false,
      use_data_augmentation: true,
      dropout_rate: 0.5,
      fine_tune_layers: 10,
      learning_rate: 0.001
    }
  });

  // Generate model ID when user and form data are available
  const generateModelId = () => {
    if (session?.user?.name && formData.name) {
      const username = session.user.name.toLowerCase().replace(/\s+/g, '');
      const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6-digit number
      return `${username}_${randomNumber}`;
    }
    return '';
  };

  // Update form data
  const updateFormData = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Generate modelId only once when name is first entered and modelId is empty
      if (field === 'name' && value.trim() && !prev.modelId && session?.user?.name) {
        const username = session.user.name.toLowerCase().replace(/\s+/g, '');
        const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6-digit number
        newData.modelId = `${username}_${randomNumber}`;
      }
      
      return newData;
    });
  };

  // Update form config
  const updateFormConfig = (field, value) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [field]: value
      }
    }));
  };

  const categories = [
    { id: "medical", name: "Medical", icon: "🏥", description: "Models for healthcare and medical applications" },
    { id: "agriculture", name: "Agriculture", icon: "🌾", description: "Models for farming and agricultural use cases" },
    { id: "technology", name: "Technology", icon: "💻", description: "Models for tech and software applications" },
    { id: "vision", name: "Computer Vision", icon: "👁️", description: "Models for image recognition and processing" }
  ];

  const modelTypes = [
    { id: "classification", name: "Image Classification", description: "Classify images into different categories using transfer learning" },
    { id: "detection", name: "Object Detection", description: "Identify and locate objects within images" },
    { id: "segmentation", name: "Segmentation", description: "Pixel-level classification of image regions" },
    { id: "custom", name: "Custom Architecture", description: "Design your own model architecture" }
  ];

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    updateFormData('category', category.id);
    setStep(2);
  };

  const handleModelTypeSelect = (modelType) => {
    setSelectedModelType(modelType);
    // Save as 'transfer-learning' in database when user selects 'classification'
    const modelTypeForDB = modelType.id === 'classification' ? 'transfer-learning' : modelType.id;
    updateFormData('modelType', modelTypeForDB);
    setStep(3);
  };

  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    setIsSubmitting(true);
    setError("");

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error("Model name is required");
      }

      if (!session?.user?.id) {
        throw new Error("User session not found");
      }

      // Prepare the final form data
      const submitData = {
        ...formData,
        modelId: formData.modelId || generateModelId(), // Use stored modelId or generate if empty
        teamMembers: [session.user.id],
        teamId: session.user.id,
        config: {
          ...formData.config,
          use_data_augmentation: formData.dataAugmentation,
        }
      };

      // Note: Since there's no external baseURL in the current codebase,
      // we'll create an internal API route for model creation
      const response = await fetch("/api/ml-models/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create model");
      }

      const result = await response.json();

      if(!result){
        toast.error("Failed to save model")
      }else{
         // Redirect to dataset collection
      router.push(`/ml-studio/dataset?modelId=${result.modelId}`);
      }
      
     
    } catch (error) {
      console.error("Error creating model:", error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
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
              <Link href="/ml-studio">
                <button className="bg-transparent text-[#4f7269] px-4 py-2 rounded-full hover:bg-[#4f7269]/10 transition-colors font-medium">
                  Back to Studio
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
              Create Your <span className="text-[#4f7269]">ML Model</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl">
              Follow our step-by-step process to create a custom machine learning model tailored to your needs.
            </p>
          </motion.div>

          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex justify-between items-center max-w-3xl mx-auto">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      stepNumber === step
                        ? "bg-[#4f7269] text-white"
                        : stepNumber < step
                        ? "bg-[#4f7269]/50 text-[#4f7269]"
                        : "bg-gray-300 dark:bg-[#3B3B3B] text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {stepNumber}
                  </div>
                  <div className="mt-2 text-sm font-medium text-gray-600 dark:text-slate-300">
                    {stepNumber === 1 && "Category"}
                    {stepNumber === 2 && "Model Type"}
                    {stepNumber === 3 && "Configuration"}
                  </div>
                </div>
              ))}
            </div>
            <div className="relative max-w-3xl mx-auto mt-4">
              <div className="absolute top-0 left-[10%] right-[10%] h-1 bg-gray-200 dark:bg-[#3B3B3B]"></div>
              <div
                className="absolute top-0 left-[10%] h-1 bg-[#4f7269] transition-all duration-300"
                style={{ width: `${(step - 1) * 40}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          <div className="max-w-5xl mx-auto">
            {/* Step 1: Category Selection */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-[#212124] rounded-2xl p-8 shadow-sm"
              >
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-6">
                  Select a Category
                </h2>
                <p className="text-gray-600 dark:text-slate-300 mb-8">
                  Choose the domain that best fits your use case. This helps us optimize your model for specific tasks.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categories.map((category) => (
                    <motion.div
                      key={category.id}
                      whileHover={{ y: -5, boxShadow: "0 12px 24px rgba(79, 114, 105, 0.2)" }}
                      className={`border rounded-xl p-6 m-[10px] cursor-pointer transition-all duration-300 ${
                        selectedCategory?.id === category.id
                          ? "border-[#4f7269] bg-[#4f7269]/5"
                          : "border-gray-200 dark:border-[#3B3B3B] hover:border-[#4f7269]/50"
                      }`}
                      onClick={() => handleCategorySelect(category)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-[#4f7269]/10 rounded-full flex items-center justify-center text-2xl">
                          {category.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
                            {category.name}
                          </h3>
                          <p className="text-gray-600 dark:text-slate-300 text-sm">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-10 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNextStep}
                    disabled={!selectedCategory}
                    className={`px-8 py-3 rounded-full font-medium ${
                      selectedCategory
                        ? "bg-[#4f7269] text-white hover:bg-[#3f5a51]"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    } transition-colors duration-300`}
                  >
                    Continue
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Model Type Selection */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-[#212124] rounded-2xl p-8 shadow-sm"
              >
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-6">
                  Select Model Type
                </h2>
                <p className="text-gray-600 dark:text-slate-300 mb-8">
                  Choose the type of machine learning model that best suits your task.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {modelTypes.map((modelType) => (
                    <motion.div
                      key={modelType.id}
                      whileHover={{ y: -5, boxShadow: "0 12px 24px rgba(79, 114, 105, 0.2)" }}
                      className={`border rounded-xl p-6 m-[10px] cursor-pointer transition-all duration-300 ${
                        selectedModelType?.id === modelType.id
                          ? "border-[#4f7269] bg-[#4f7269]/5"
                          : "border-gray-200 dark:border-[#3B3B3B] hover:border-[#4f7269]/50"
                      }`}
                      onClick={() => handleModelTypeSelect(modelType)}
                    >
                      <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
                        {modelType.name}
                      </h3>
                      <p className="text-gray-600 dark:text-slate-300 text-sm">
                        {modelType.description}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-10 flex justify-between">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePreviousStep}
                    className="px-8 py-3 rounded-full font-medium border border-gray-200 dark:border-[#3B3B3B] text-gray-600 dark:text-slate-300 hover:border-[#4f7269] hover:text-[#4f7269] transition-colors duration-300"
                  >
                    Back
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNextStep}
                    disabled={!selectedModelType}
                    className={`px-8 py-3 rounded-full font-medium ${
                      selectedModelType
                        ? "bg-[#4f7269] text-white hover:bg-[#3f5a51]"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    } transition-colors duration-300`}
                  >
                    Continue
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Configuration */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-[#212124] rounded-2xl p-8 shadow-sm"
              >
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-6">
                  Configure Your Model
                </h2>
                <p className="text-gray-600 dark:text-slate-300 mb-8">
                  Fine-tune your model settings and parameters.
                </p>

                {/* Error Display */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Model Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-[#3B3B3B] bg-white dark:bg-[#212124] text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4f7269] focus:border-transparent"
                      placeholder="Enter a name for your model"
                      required
                    />
                    {formData.name && formData.modelId && (
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        Model ID: {formData.modelId}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-[#3B3B3B] bg-white dark:bg-[#212124] text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4f7269] focus:border-transparent"
                      placeholder="Describe what your model does"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Dataset Requirements (optional)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.datasetRequirements}
                      onChange={(e) => updateFormData('datasetRequirements', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-[#3B3B3B] bg-white dark:bg-[#212124] text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4f7269] focus:border-transparent"
                      placeholder="e.g., Skin disease images with 22 classes from Kaggle dataset"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Target Accuracy
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={formData.targetAccuracy}
                        onChange={(e) => updateFormData('targetAccuracy', parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                      <span className="text-lg font-semibold text-[#4f7269] min-w-[60px]">
                        {(formData.targetAccuracy * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      Set your desired accuracy target for the model
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Training Epochs
                      </label>
                      <select 
                        value={formData.epochs}
                        onChange={(e) => updateFormData('epochs', parseInt(e.target.value))}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-[#3B3B3B] bg-white dark:bg-[#212124] text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4f7269] focus:border-transparent"
                      >
                        <option value="10">10 epochs</option>
                        <option value="20">20 epochs</option>
                        <option value="50">50 epochs</option>
                        <option value="100">100 epochs</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Batch Size
                      </label>
                      <select 
                        value={formData.batchSize}
                        onChange={(e) => updateFormData('batchSize', parseInt(e.target.value))}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-[#3B3B3B] bg-white dark:bg-[#212124] text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4f7269] focus:border-transparent"
                      >
                        <option value="16">16</option>
                        <option value="32">32</option>
                        <option value="64">64</option>
                        <option value="128">128</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Advanced Settings
                    </label>
                    <div className="border border-gray-200 dark:border-[#3B3B3B] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-700 dark:text-slate-300">Enable Data Augmentation</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.dataAugmentation}
                            onChange={(e) => updateFormData('dataAugmentation', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4f7269]/20 dark:peer-focus:ring-[#4f7269]/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#4f7269]"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-slate-300">Enable Transfer Learning</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.transferLearning}
                            onChange={(e) => updateFormData('transferLearning', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4f7269]/20 dark:peer-focus:ring-[#4f7269]/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#4f7269]"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 flex justify-between">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePreviousStep}
                      className="px-8 py-3 rounded-full font-medium border border-gray-200 dark:border-[#3B3B3B] text-gray-600 dark:text-slate-300 hover:border-[#4f7269] hover:text-[#4f7269] transition-colors duration-300"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      onClick={()=>handleSubmit()}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isSubmitting || !formData.name.trim()}
                      className={`px-8 py-3 rounded-full font-medium ${
                        isSubmitting || !formData.name.trim()
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-[#4f7269] text-white hover:bg-[#3f5a51]"
                      } transition-colors duration-300`}
                    >
                      {isSubmitting ? "Creating Model..." : "Create Model"}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
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