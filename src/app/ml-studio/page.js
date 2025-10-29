"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

export default function MLStudio() {
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
              <div className="flex items-center space-x-1">
                <span className="text-xl font-semibold text-[#4f7269]">
                  Quest
                </span>
                <span className="text-xl font-semibold text-[#4f7269]">
                  Whisper
                </span>
                <span className="text-xl font-semibold text-[#4f7269] ml-1">
                  ML Studio
                </span>
              </div>
            </div>
            <div className="flex space-x-4">
              <Link href="/chat">
                <button className="bg-transparent text-[#4f7269] px-4 py-2 rounded-full hover:bg-[#4f7269]/10 transition-colors font-medium">
                  Back to Chat
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-34 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-bold text-slate-700 dark:text-slate-200 mb-6">
              QuestWhisper <span className="text-[#4f7269]">ML Studio</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
              Create, train and deploy custom machine learning models with an intuitive, 
              visual interface. No coding required.
            </p>
          </motion.div>

          {/* Welcome Portal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link href="/ml-studio/create">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                whileHover={{ y: -5, boxShadow: "0 12px 24px rgba(79, 114, 105, 0.2)" }}
                className="bg-white dark:bg-[#212124] border border-gray-200 dark:border-[#3B3B3B] rounded-2xl p-8 hover:border-[#4f7269] transition-all duration-300 cursor-pointer"
              >
                <div className="w-12 h-12 bg-[#4f7269]/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl">🤖</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-3">
                  Create New Model
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  Start your AI journey here. Build custom models tailored to your specific needs.
                </p>
                <div className="flex justify-end">
                  <svg
                    className="w-6 h-6 text-[#4f7269]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              </motion.div>
            </Link>

            <Link href="/ml-studio/models">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                whileHover={{ y: -5, boxShadow: "0 12px 24px rgba(79, 114, 105, 0.2)" }}
                className="bg-white dark:bg-[#212124] border border-gray-200 dark:border-[#3B3B3B] rounded-2xl p-8 hover:border-[#4f7269] transition-all duration-300 cursor-pointer"
              >
                <div className="w-12 h-12 bg-[#4f7269]/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl">📚</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-3">
                  My Models
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  View and manage your existing projects. Check performance and make improvements.
                </p>
                <div className="flex justify-end">
                  <svg
                    className="w-6 h-6 text-[#4f7269]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              </motion.div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-[#181818]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-700 dark:text-slate-200 mb-4">
              Build AI Models with Ease
            </h2>
            <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
              Our intuitive visual interface makes creating and training machine learning 
              models accessible to everyone, regardless of technical background.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🎨",
                title: "Visual Model Creation",
                description:
                  "Drag-and-drop interface for building neural networks. Select from pre-configured architectures or customize your own.",
              },
              {
                icon: "📸",
                title: "Dataset Studio",
                description:
                  "Upload, label, and manage your training data with ease. Automatic data augmentation and preprocessing.",
              },
              {
                icon: "🔮",
                title: "Instant Predictions",
                description:
                  "Test your models in real-time with our prediction studio. Upload images or use your camera for instant results.",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-[#212124] rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-[#4f7269]/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Model Creation Process */}
      <section className="py-20 bg-white dark:bg-[#181818]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-700 dark:text-slate-200 mb-4">
              Your ML Journey
            </h2>
            <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
              Follow our simple step-by-step process to create powerful machine learning models
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Choose Category",
                description: "Select from medical, agriculture, technology or computer vision domains",
                icon: "🏥"
              },
              {
                step: "2",
                title: "Select Model Type",
                description: "Pick the right architecture for your specific use case",
                icon: "🧠"
              },
              {
                step: "3",
                title: "Upload Data",
                description: "Import and label your training data with our intuitive interface",
                icon: "📤"
              },
              {
                step: "4",
                title: "Train & Deploy",
                description: "Watch your model learn and deploy it with one click",
                icon: "🚀"
              }
            ].map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-white dark:bg-[#212124] border border-gray-200 dark:border-[#3B3B3B] rounded-2xl p-6 hover:border-[#4f7269]/30 transition-all duration-300">
                  <div className="w-12 h-12 bg-[#4f7269]/10 rounded-full flex items-center justify-center mb-6">
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-[#4f7269] rounded-full flex items-center justify-center text-white font-bold">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    {step.description}
                  </p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform translate-x-1/2 -translate-y-1/2">
                    <svg className="w-6 h-6 text-[#4f7269]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50 dark:bg-[#181818]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="bg-white border border-gray-200 dark:bg-[#212124] dark:border-[#3B3B3B] rounded-3xl py-16 px-8 lg:px-16">
              <div className="max-w-3xl mx-auto">
                <h3 className="text-4xl lg:text-5xl font-bold text-slate-700 dark:text-slate-200 mb-6">
                  Ready to build your AI?
                </h3>
                <p className="text-xl text-slate-600 dark:text-slate-300 mb-10 leading-relaxed">
                  Start creating custom machine learning models with no coding required.
                  <br />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Your AI journey begins here.
                  </span>
                </p>
                <Link href="/ml-studio/create">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-[#4f7269] text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-[#3f5a51] transition-colors duration-300 shadow-sm hover:shadow-md"
                  >
                    Create Your First Model
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

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