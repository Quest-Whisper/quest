"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import LoadingAnimation from '../../../components/LoadingAnimation';

function TrainingExperienceInner() {
  const searchParams = useSearchParams();
  const modelId = searchParams.get('modelId');

  const [trainingStatus, setTrainingStatus] = useState("preparing");
  const [progress, setProgress] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [loss, setLoss] = useState(1);
  const [epoch, setEpoch] = useState(0);
  const [logs, setLogs] = useState([]);

  // Fetcher function for SWR
  const fetcher = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch model');
    const data = await res.json();
    return data.model;
  };

  // Use SWR for data fetching with conditional polling
  const { data: model, error, isLoading, mutate } = useSWR(
    modelId ? `/api/ml-models/get-model?modelId=${modelId}` : null,
    fetcher,
    {
      refreshInterval: (data) => {
        // Poll every 5 seconds if training, otherwise don't poll
        return data?.status === 'training' ? 5000 : 0;
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Prevent duplicate requests within 2 seconds
    }
  );

  useEffect(() => {
    if (model) {
      const statusMap = {
        created: 'preparing',
        training: 'training',
        completed: 'completed',
        failed: 'failed'
      };
      setTrainingStatus(statusMap[model.status] || model.status);
      setEpoch(model.training.currentEpoch || 0);
      setProgress(((model.training.currentEpoch || 0) / (model.training.totalEpochs || 1)) * 100);
      const logsArray = model.training.logs || [];
      if (logsArray.length > 0) {
        const lastLog = logsArray[logsArray.length - 1];
        setAccuracy(lastLog.accuracy || 0);
        setLoss(lastLog.loss || 1);
      }
      setLogs(logsArray.map(log => ({
        id: new Date(log.timestamp).getTime(),
        message: `Epoch ${log.epoch}: Accuracy ${log.accuracy?.toFixed(4) || 'N/A'}, Loss ${log.loss?.toFixed(4) || 'N/A'}`
      })));
    }
  }, [model]);

  const startTraining = async () => {
    if (!modelId) return;
    try {
      const res = await fetch('/api/ml-models/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId })
      });
      if (!res.ok) throw new Error('Failed to start training');
      // Trigger a revalidation to fetch the updated model
      mutate();
    } catch (err) {
      console.error('Failed to start training:', err);
    }
  };

  if (isLoading) {
    return (
      <LoadingAnimation 
        text="Loading ML Training Studio"
        subtitle="Preparing your training environment..."
      />
    );
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">
      {!modelId ? 'No model ID provided' : error.message || 'Failed to fetch model'}
    </div>;
  }

  if (!model) {
    return <div className="min-h-screen flex items-center justify-center">No model found</div>;
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
              <Link href="/ml-studio/dataset">
                <button className="bg-transparent text-[#4f7269] px-4 py-2 rounded-full hover:bg-[#4f7269]/10 transition-colors font-medium">
                  Back to Dataset
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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-slate-700 dark:text-slate-200 mb-6">
                  Training <span className="text-[#4f7269]">Experience</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl">
                  Watch your model learn in real-time. Monitor training progress, metrics, and performance.
                </p>
              </div>
              <div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  trainingStatus === "preparing" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                  trainingStatus === "training" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                  trainingStatus === "completed" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                  trainingStatus === "failed" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                  "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                }`}>
                  {trainingStatus.charAt(0).toUpperCase() + trainingStatus.slice(1)}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Training Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Neural Network Visualization */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-[#212124] rounded-2xl p-8 shadow-sm lg:col-span-1"
            >
              <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-6">
                Model Architecture
              </h2>
              
              {/* Neural Network Visualization */}
              <div className="relative h-[400px] w-full bg-gray-50 dark:bg-[#181818]/50 rounded-xl overflow-hidden">
                <div className="absolute inset-0 flex flex-col justify-center items-center">
                  {/* Input Layer */}
                  <div className="flex space-x-2 mb-8">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={`input-${i}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="w-4 h-4 rounded-full bg-[#4f7269]"
                      />
                    ))}
                  </div>
                  
                  {/* Hidden Layer 1 */}
                  <div className="flex space-x-2 mb-8">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <motion.div
                        key={`hidden1-${i}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                        className="w-4 h-4 rounded-full bg-[#4f7269]"
                      />
                    ))}
                  </div>
                  
                  {/* Hidden Layer 2 */}
                  <div className="flex space-x-2 mb-8">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={`hidden2-${i}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 1.2 + i * 0.1 }}
                        className="w-4 h-4 rounded-full bg-[#4f7269]"
                      />
                    ))}
                  </div>
                  
                  {/* Output Layer */}
                  <div className="flex space-x-2">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={`output-${i}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 1.7 + i * 0.1 }}
                        className="w-4 h-4 rounded-full bg-[#4f7269]"
                      />
                    ))}
                  </div>
                  
                  {/* Animated Pulses */}
                  {trainingStatus === "training" && (
                    <>
                      <motion.div
                        animate={{
                          y: [-50, 50],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "loop",
                        }}
                        className="absolute w-2 h-2 rounded-full bg-[#4f7269]"
                        style={{ left: "30%", top: "40%" }}
                      />
                      <motion.div
                        animate={{
                          y: [50, -50],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          repeatType: "loop",
                          delay: 0.5,
                        }}
                        className="absolute w-2 h-2 rounded-full bg-[#4f7269]"
                        style={{ left: "60%", top: "60%" }}
                      />
                    </>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Model Summary
                </h3>
                <div className="text-sm text-gray-600 dark:text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium">Classification</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Layers:</span>
                    <span className="font-medium">4</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parameters:</span>
                    <span className="font-medium">1.2M</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Input Shape:</span>
                    <span className="font-medium">224 x 224 x 3</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Middle Column - Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white dark:bg-[#212124] rounded-2xl p-8 shadow-sm"
            >
              <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-6">
                Training Metrics
              </h2>
              
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    Overall Progress
                  </span>
                  <span className="text-sm font-medium text-[#4f7269]">
                    {progress}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-[#3B3B3B] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-[#4f7269] rounded-full"
                  />
                </div>
              </div>
              
              {/* Epoch Counter */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    Current Epoch
                  </span>
                  <span className="text-sm font-medium text-[#4f7269]">
                    {epoch} / {model?.training?.totalEpochs || model?.epochs || 10}
                  </span>
                </div>
                <div className={`grid gap-1 ${model?.training?.totalEpochs || model?.epochs || 10 <= 10 ? 'grid-cols-10' : 'grid-cols-20'}`}>
                  {Array.from({ length: model?.training?.totalEpochs || model?.epochs || 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 rounded-full ${
                        i < epoch ? "bg-[#4f7269]" : "bg-gray-200 dark:bg-[#3B3B3B]"
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Accuracy Chart */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    Accuracy
                  </span>
                  <span className="text-sm font-medium text-[#4f7269]">
                    {(accuracy * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="w-full h-24 bg-gray-50 dark:bg-[#181818]/50 rounded-lg overflow-hidden relative">
                  <div className="absolute bottom-0 left-0 w-full h-full">
                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path
                        d={`M0,100 L0,${100 - accuracy * 100} L100,${100 - accuracy * 100} L100,100 Z`}
                        fill="rgba(79, 114, 105, 0.2)"
                      />
                      <path
                        d={`M0,${100 - accuracy * 100} L100,${100 - accuracy * 100}`}
                        stroke="#4f7269"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Loss Chart */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    Loss
                  </span>
                  <span className="text-sm font-medium text-[#4f7269]">
                    {loss.toFixed(4)}
                  </span>
                </div>
                <div className="w-full h-24 bg-gray-50 dark:bg-[#181818]/50 rounded-lg overflow-hidden relative">
                  <div className="absolute bottom-0 left-0 w-full h-full">
                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path
                        d={`M0,0 L0,${loss * 100} L100,${loss * 100} L100,0 Z`}
                        fill="rgba(79, 114, 105, 0.2)"
                      />
                      <path
                        d={`M0,${loss * 100} L100,${loss * 100}`}
                        stroke="#4f7269"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Training Log */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-white dark:bg-[#212124] rounded-2xl p-8 shadow-sm"
            >
              <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-6">
                Training Log
              </h2>
              
              <div className="bg-gray-900 rounded-lg h-[400px] p-4 overflow-y-auto font-mono text-sm">
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-2"
                  >
                    <span className="text-green-400">[{new Date(log.id).toLocaleTimeString()}]</span>{" "}
                    <span className="text-gray-200">{log.message}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Actions */}
          <div className="mt-12 flex justify-between items-center">
            <Link href={`/ml-studio/dataset?modelId=${model.modelId}`}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 rounded-full font-medium border border-gray-200 dark:border-[#3B3B3B] text-gray-600 dark:text-slate-300 hover:border-[#4f7269] hover:text-[#4f7269] transition-colors duration-300"
              >
                Back
              </motion.button>
            </Link>
            {model.status === 'created' ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startTraining}
                className="px-8 py-3 rounded-full font-medium bg-[#4f7269] text-white hover:bg-[#3f5a51] transition-colors duration-300"
              >
                Start Training
              </motion.button>
            ) : model.status === 'failed' ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startTraining}
                className="px-8 py-3 rounded-full font-medium bg-[#4f7269] text-white hover:bg-[#3f5a51] transition-colors duration-300"
              >
                Retry Training
              </motion.button>
            ) : (
              <Link href={`/ml-studio/prediction?modelId=${model.modelId}`}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-8 py-3 rounded-full font-medium ${
                    model.status === "completed"
                      ? "bg-[#4f7269] text-white hover:bg-[#3f5a51]"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  } transition-colors duration-300`}
                  disabled={model.status !== "completed"}
                >
                  Test Model
                </motion.button>
              </Link>
            )}
          </div>

          {/* Celebration Animation */}
          {model.status === "completed" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="fixed inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
              <div className="bg-white dark:bg-[#212124] rounded-2xl p-8 shadow-lg z-10 max-w-md text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-4">
                  Training Complete!
                </h3>
                <p className="text-gray-600 dark:text-slate-300 mb-6">
                  Your model has been successfully trained with {(accuracy * 100).toFixed(2)}% accuracy.
                  You can now test it with new data.
                </p>
                <Link href={`/ml-studio/prediction?modelId=${model.modelId}`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-3 rounded-full font-medium bg-[#4f7269] text-white hover:bg-[#3f5a51] transition-colors duration-300 pointer-events-auto"
                  >
                    Test Your Model
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          )}
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

export default function TrainingExperience() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-[#181818] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f7269]"></div>
            <p className="text-slate-700 dark:text-slate-200 text-sm">Loading training studio…</p>
          </div>
        </div>
      }
    >
      <TrainingExperienceInner />
    </Suspense>
  );
}