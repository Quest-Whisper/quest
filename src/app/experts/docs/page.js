"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ExpertsDocsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: "📋" },
    { id: "data", label: "Data Management", icon: "📊" },
    { id: "training", label: "Model Training", icon: "🧠" },
    { id: "deployment", label: "Deployment", icon: "🚀" },
    { id: "interaction", label: "Chat Interface", icon: "💬" },
    { id: "examples", label: "Use Cases", icon: "🏥" }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#181818]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 dark:bg-[#181818]/95 backdrop-blur-lg border-b border-gray-100 dark:border-[#3B3B3B] z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
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
              <div className="flex items-center space-x-1">
                <span className="text-xl font-semibold text-[#4f7269]">
                  Quest
                </span>
                <span className="text-xl font-semibold text-[#4f7269]">
                  Whisper
                </span>
                <span className="text-lg font-medium text-gray-500 ml-2">
                  / Documentation
                </span>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/experts" className="text-[#4f7269] hover:text-[#3f5a51] transition-colors font-medium">
                Back to Experts
              </Link>
              <Link href="/ml-studio">
                <button className="bg-[#4f7269] text-white px-6 py-2 rounded-full hover:bg-[#3f5a51] transition-colors font-medium">
                  Try ML Studio
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-bold text-slate-700 dark:text-slate-200 mb-6">
              ML Studio Documentation
            </h1>
            <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Complete guide to building, training, and deploying custom AI models for domain experts.
              No coding experience required.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-[#3B3B3B] sticky top-24">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
                  Documentation
                </h3>
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                        activeTab === tab.id
                          ? "bg-[#4f7269]/10 text-[#4f7269] border border-[#4f7269]/20"
                          : "text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-[#181818]/50"
                      }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-[#212124] rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-[#3B3B3B]"
              >
                {activeTab === "overview" && <OverviewContent />}
                {activeTab === "data" && <DataContent />}
                {activeTab === "training" && <TrainingContent />}
                {activeTab === "deployment" && <DeploymentContent />}
                {activeTab === "interaction" && <InteractionContent />}
                {activeTab === "examples" && <ExamplesContent />}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 dark:border-[#3B3B3B] dark:bg-[#181818] py-12 mt-20">
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
                © 2025 QuestWhisper. Empowering experts with AI.
              </span>
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy-policy" className="text-sm text-slate-600 dark:text-slate-300 hover:text-[#4f7269] transition-colors">
                Privacy
              </Link>
              <Link href="/terms-of-service" className="text-sm text-slate-600 dark:text-slate-300 hover:text-[#4f7269] transition-colors">
                Terms
              </Link>
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=support@iwhispered.com&su=QuestWhisper%20Documentation%20Support"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-600 dark:text-slate-300 hover:text-[#4f7269] transition-colors"
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

// Content Components
function OverviewContent() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-700 dark:text-slate-200 mb-4">
          Getting Started with ML Studio
        </h2>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
          QuestWhisper ML Studio empowers domain experts to create, train, and deploy custom AI models 
          without any coding experience. Our platform handles the technical complexity while you focus 
          on your expertise.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="text-3xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Purpose-Built for Experts
          </h3>
          <p className="text-gray-600 dark:text-slate-300">
            Designed specifically for professionals who want to leverage AI in their domain without 
            needing technical ML knowledge.
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <div className="text-3xl mb-4">⚡</div>
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
            No Code Required
          </h3>
          <p className="text-gray-600 dark:text-slate-300">
            Visual interface for model creation, drag-and-drop data upload, and intuitive training 
            monitoring.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-[#181818]/50 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
          Complete Workflow
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { step: "1", title: "Data Upload", desc: "Upload and organize your dataset" },
            { step: "2", title: "Model Config", desc: "Choose architecture and parameters" },
            { step: "3", title: "Training", desc: "Monitor real-time training progress" },
            { step: "4", title: "Chat & Deploy", desc: "Interact with your trained model" }
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-10 h-10 bg-[#4f7269] text-white rounded-full flex items-center justify-center font-bold mb-2 mx-auto">
                {item.step}
              </div>
              <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{item.title}</h4>
              <p className="text-sm text-gray-600 dark:text-slate-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DataContent() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-700 dark:text-slate-200 mb-4">
          Data Management & Organization
        </h2>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
          Learn how to efficiently organize, upload, and manage your training data for optimal model performance.
        </p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center">
          <span className="text-2xl mr-3">📋</span>
          Data Requirements
        </h3>
        <ul className="space-y-2 text-gray-600 dark:text-slate-300">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span><strong>Minimum 50 images per class</strong> for basic classification tasks</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span><strong>Supported formats:</strong> JPG, PNG, JPEG (max 10MB per image)</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span><strong>Balanced dataset:</strong> Similar number of images per class</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span><strong>High quality:</strong> Clear, well-lit images with good resolution</span>
          </li>
        </ul>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#181818]/50 rounded-xl p-6 border border-gray-200 dark:border-[#3B3B3B]">
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
            Upload Methods
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400">📁</span>
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Folder Upload</p>
                <p className="text-sm text-gray-600 dark:text-slate-300">Drag entire folders with pre-organized classes</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400">🖼️</span>
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Individual Images</p>
                <p className="text-sm text-gray-600 dark:text-slate-300">Upload and label images one by one</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400">🔗</span>
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">URL Import</p>
                <p className="text-sm text-gray-600 dark:text-slate-300">Import from cloud storage or web URLs</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#181818]/50 rounded-xl p-6 border border-gray-200 dark:border-[#3B3B3B]">
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
            Data Preprocessing
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400">📐</span>
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Auto Resize</p>
                <p className="text-sm text-gray-600 dark:text-slate-300">Images automatically resized to 224x224</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                <span className="text-teal-600 dark:text-teal-400">🎨</span>
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Data Augmentation</p>
                <p className="text-sm text-gray-600 dark:text-slate-300">Automatic rotation, flip, and color adjustments</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400">🔍</span>
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Quality Check</p>
                <p className="text-sm text-gray-600 dark:text-slate-300">Automatic detection of corrupted images</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrainingContent() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-700 dark:text-slate-200 mb-4">
          Model Training Process
        </h2>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
          Understanding the training process and how to monitor your model's performance in real-time.
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center">
          <span className="text-2xl mr-3">⚙️</span>
          Training Configuration
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Model Architecture</h4>
            <ul className="text-sm text-gray-600 dark:text-slate-300 space-y-1">
              <li>• ResNet50 (Recommended for most tasks)</li>
              <li>• EfficientNet (Faster training)</li>
              <li>• VGG16 (Simple architecture)</li>
              <li>• Custom architecture builder</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Training Parameters</h4>
            <ul className="text-sm text-gray-600 dark:text-slate-300 space-y-1">
              <li>• Epochs: 10-100 (auto-optimization)</li>
              <li>• Batch size: 16-128 (memory dependent)</li>
              <li>• Learning rate: Auto-adjusted</li>
              <li>• Transfer learning: Enabled by default</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Real-time Metrics
          </h3>
          <ul className="text-sm text-gray-600 dark:text-slate-300 space-y-1">
            <li>• Training accuracy</li>
            <li>• Validation loss</li>
            <li>• Epoch progress</li>
            <li>• Time remaining</li>
          </ul>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Performance Tracking
          </h3>
          <ul className="text-sm text-gray-600 dark:text-slate-300 space-y-1">
            <li>• Confusion matrix</li>
            <li>• Precision & recall</li>
            <li>• Class-wise accuracy</li>
            <li>• ROC curves</li>
          </ul>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
          <div className="text-3xl mb-3">🔄</div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Auto-Optimization
          </h3>
          <ul className="text-sm text-gray-600 dark:text-slate-300 space-y-1">
            <li>• Early stopping</li>
            <li>• Learning rate scheduling</li>
            <li>• Best model checkpointing</li>
            <li>• Hyperparameter tuning</li>
          </ul>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-[#181818]/50 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
          Training Timeline
        </h3>
        <div className="space-y-4">
          {[
            { phase: "Data Preparation", time: "2-5 minutes", desc: "Processing and validating uploaded images" },
            { phase: "Model Initialization", time: "1-2 minutes", desc: "Setting up neural network architecture" },
            { phase: "Training Process", time: "15-60 minutes", desc: "Learning from your dataset (depends on size)" },
            { phase: "Validation & Testing", time: "2-5 minutes", desc: "Evaluating model performance" },
            { phase: "Deployment", time: "1-2 minutes", desc: "Making model available for predictions" }
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-[#4f7269] text-white rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-200">{item.phase}</h4>
                  <span className="text-sm text-[#4f7269] font-medium">{item.time}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-300">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeploymentContent() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-700 dark:text-slate-200 mb-4">
          Model Deployment & Management
        </h2>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
          Once your model is trained, learn how to deploy it and make it accessible for predictions and analysis.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center">
            <span className="text-2xl mr-3">🚀</span>
            Instant Deployment
          </h3>
          <p className="text-gray-600 dark:text-slate-300 mb-4">
            Your trained model is automatically deployed and ready for use within minutes of training completion.
          </p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-300">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Automatic model optimization for faster inference</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Cloud-based deployment with 99.9% uptime</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Scalable infrastructure handles concurrent requests</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center">
            <span className="text-2xl mr-3">🔒</span>
            Security & Privacy
          </h3>
          <p className="text-gray-600 dark:text-slate-300 mb-4">
            Your models and data are protected with enterprise-grade security measures.
          </p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-300">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              <span>End-to-end encryption for all data transfers</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              <span>Private model hosting - only you can access</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              <span>HIPAA compliant for medical data</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-[#181818]/50 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
          Model Management Features
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📈</span>
            </div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Performance Monitoring</h4>
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Track prediction accuracy, response times, and usage analytics in real-time.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🔄</span>
            </div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Model Versioning</h4>
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Keep track of different model versions and easily roll back if needed.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">⚡</span>
            </div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Auto-Scaling</h4>
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Infrastructure automatically scales based on demand and usage patterns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InteractionContent() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-700 dark:text-slate-200 mb-4">
          Chat Interface & Interaction
        </h2>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
          Learn how to interact with your custom AI models through natural conversation and get meaningful insights.
        </p>
      </div>

      <div className="bg-gradient-to-r from-[#4f7269]/10 to-blue-500/10 rounded-xl p-6 border border-[#4f7269]/20">
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center">
          <span className="text-2xl mr-3">💬</span>
          Natural Language Interaction
        </h3>
        <p className="text-gray-600 dark:text-slate-300 mb-4">
          Your custom AI models integrate seamlessly with our chat interface, allowing you to ask questions, 
          upload images, and get expert-level analysis through natural conversation.
        </p>
        
        <div className="bg-white dark:bg-[#212124] rounded-lg p-4 border border-gray-200 dark:border-[#3B3B3B]">
          <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Example Conversation:</h4>
          <div className="space-y-3">
            <div className="flex justify-end">
              <div className="bg-[#4f7269] text-white rounded-2xl px-4 py-2 max-w-xs">
                <p className="text-sm">Can you analyze this skin lesion for me?</p>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-[#181818]/50 rounded-2xl px-4 py-2 max-w-sm">
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  I can see the lesion has irregular borders and asymmetrical shape. Based on my analysis, 
                  this shows characteristics consistent with melanoma. Confidence: 87%. 
                  I recommend immediate biopsy and specialist consultation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#181818]/50 rounded-xl p-6 border border-gray-200 dark:border-[#3B3B3B]">
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
            Input Methods
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mt-1">
                <span className="text-blue-600 dark:text-blue-400 text-lg">📸</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-200">Image Upload</h4>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  Drag and drop images directly into the chat for instant analysis
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mt-1">
                <span className="text-green-600 dark:text-green-400 text-lg">📹</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-200">Camera Capture</h4>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  Take photos directly through your device camera for real-time analysis
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mt-1">
                <span className="text-purple-600 dark:text-purple-400 text-lg">💬</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-200">Text Queries</h4>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  Ask questions about previous analyses or request specific insights
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#181818]/50 rounded-xl p-6 border border-gray-200 dark:border-[#3B3B3B]">
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
            AI Response Features
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mt-1">
                <span className="text-red-600 dark:text-red-400 text-lg">🎯</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-200">Confidence Scores</h4>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  Get percentage confidence levels for all predictions and classifications
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mt-1">
                <span className="text-yellow-600 dark:text-yellow-400 text-lg">📊</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-200">Detailed Analysis</h4>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  Receive comprehensive breakdowns of detected features and patterns
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center mt-1">
                <span className="text-teal-600 dark:text-teal-400 text-lg">💡</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-200">Expert Recommendations</h4>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  Get actionable insights and next steps based on AI analysis
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamplesContent() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-700 dark:text-slate-200 mb-4">
          Real-World Use Cases
        </h2>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
          Explore how experts across different domains are using QuestWhisper ML Studio to revolutionize their fields.
        </p>
      </div>

      <div className="grid gap-8">
        {[
          {
            domain: "Medical & Healthcare",
            icon: "🏥",
            color: "red",
            examples: [
              {
                title: "Dermatology AI Assistant",
                expert: "Dr. Sarah Chen, Dermatologist",
                description: "Built an AI system to detect skin cancer with 94% accuracy, helping with early diagnosis and reducing wait times for patients.",
                results: "50% faster diagnosis, 15% improvement in early detection rates"
              },
              {
                title: "Radiology Image Analysis",
                expert: "Dr. Michael Torres, Radiologist",
                description: "Created AI models to identify lung nodules in chest X-rays, assisting with screening and diagnosis workflows.",
                results: "30% reduction in missed nodules, 40% faster screening process"
              }
            ]
          },
          {
            domain: "Agriculture & Farming",
            icon: "🌾",
            color: "green",
            examples: [
              {
                title: "Crop Disease Detection",
                expert: "Dr. Emily Rodriguez, Agricultural Scientist",
                description: "Developed AI to identify plant diseases from smartphone photos, enabling farmers to take immediate action.",
                results: "60% faster disease identification, 25% reduction in crop loss"
              },
              {
                title: "Livestock Health Monitoring",
                expert: "James Wilson, Veterinarian",
                description: "Built AI system to monitor cattle health through visual analysis, detecting illness symptoms early.",
                results: "Early detection improved by 45%, reduced treatment costs by 30%"
              }
            ]
          },
          {
            domain: "Manufacturing & Quality Control",
            icon: "🏭",
            color: "blue",
            examples: [
              {
                title: "Defect Detection System",
                expert: "Lisa Chen, Quality Engineer",
                description: "Created AI to identify manufacturing defects in electronic components during production line inspection.",
                results: "99.2% defect detection accuracy, 70% reduction in manual inspection time"
              },
              {
                title: "Predictive Maintenance",
                expert: "Robert Martinez, Maintenance Manager",
                description: "Developed AI to predict equipment failures by analyzing machinery images and sensor data.",
                results: "40% reduction in unplanned downtime, 25% lower maintenance costs"
              }
            ]
          }
        ].map((domain, domainIndex) => (
          <div key={domainIndex} className="bg-white dark:bg-[#212124] rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-[#3B3B3B]">
            <div className="flex items-center space-x-4 mb-6">
              <div className={`w-12 h-12 bg-${domain.color}-100 dark:bg-${domain.color}-900/30 rounded-xl flex items-center justify-center text-2xl`}>
                {domain.icon}
              </div>
              <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                {domain.domain}
              </h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {domain.examples.map((example, exampleIndex) => (
                <div key={exampleIndex} className="bg-gray-50 dark:bg-[#181818]/50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
                    {example.title}
                  </h4>
                  <p className="text-sm text-[#4f7269] font-medium mb-3">
                    by {example.expert}
                  </p>
                  <p className="text-gray-600 dark:text-slate-300 mb-4 leading-relaxed">
                    {example.description}
                  </p>
                  <div className="bg-white dark:bg-[#212124] rounded-lg p-3 border border-gray-200 dark:border-[#3B3B3B]">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Results:</p>
                    <p className="text-sm text-green-600 dark:text-green-400">{example.results}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-[#4f7269]/10 to-blue-500/10 rounded-xl p-8 border border-[#4f7269]/20 text-center">
        <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-4">
          Ready to Create Your Success Story?
        </h3>
        <p className="text-lg text-gray-600 dark:text-slate-300 mb-6 max-w-2xl mx-auto">
          Join thousands of experts who are already transforming their industries with custom AI models.
          Start building your intelligent assistant today.
        </p>
        <Link href="/ml-studio">
          <button className="bg-[#4f7269] text-white px-8 py-4 rounded-full hover:bg-[#3f5a51] transition-all duration-300 font-semibold text-lg hover:shadow-lg transform hover:-translate-y-1">
            Start Your AI Project
          </button>
        </Link>
      </div>
    </div>
  );
} 