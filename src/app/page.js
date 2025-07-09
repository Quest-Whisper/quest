"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleGetStarted = () => {
    if (session) {
      router.push("/chat");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Image
                src="/whisper_logo.png"
                alt="QuestWhisper Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <div className="flex items-center space-x-1">
                <span className="text-xl font-semibold text-[#4f7269]">
                  Quest
                </span>
                <span className="text-xl font-semibold text-[#4f7269]">
                  Whisper
                </span>
              </div>
            </div>
            <button
              onClick={handleGetStarted}
              className="bg-[#4f7269] text-white px-6 py-2 rounded-full hover:bg-[#3f5a51] transition-colors font-medium"
            >
              {session ? "Go to Chat" : "Get Started"}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
                >
                  Your AI companion for{" "}
                  <span className="text-[#4f7269] relative">
                    everything
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.8, delay: 1 }}
                      className="absolute bottom-0 left-0 h-1 bg-[#4f7269]/30 rounded"
                    />
                  </span>
                </motion.h1>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-xl text-gray-600 leading-relaxed"
              >
                Experience the future of productivity. QuestWhisper seamlessly integrates with your digital world - from Gmail and Google Workspace to web research and image generation - all through natural conversation with a truly intelligent AI.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <button
                  onClick={handleGetStarted}
                  className="bg-[#4f7269] text-white px-8 py-4 rounded-full hover:bg-[#3f5a51] transition-all duration-300 font-semibold text-lg hover:shadow-lg transform hover:-translate-y-1"
                >
                  Start Talking Now
                </button>
                <button className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-full hover:border-[#4f7269] hover:text-[#4f7269] transition-colors font-semibold text-lg">
                  Watch Demo
                </button>
              </motion.div>

              {/* Features Pills */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="flex flex-wrap gap-3"
              >
                {[
                  "Voice Chat",
                  "Google Workspace",
                  "Web Search",
                  "Smart Memory",
                ].map((feature, index) => (
                  <div
                    key={feature}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium"
                  >
                    {feature}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Column - Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-[#4f7269]/10 to-[#4f7269]/5 rounded-3xl p-8 lg:p-12">
                {/* Chat Interface Preview */}
                <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#4f7269] rounded-full flex items-center justify-center">
                      <Image
                        src="/icons/microphone_icon.png"
                        alt="Microphone"
                        width={16}
                        height={16}
                        className="filter brightness-0 invert"
                      />
                    </div>
                    <div className="text-sm text-gray-500">QuestWhisper AI</div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-gray-100 rounded-2xl p-4 max-w-xs">
                      <p className="text-sm">
                        Hey! What would you like to explore today?
                      </p>
                    </div>
                    <div className="bg-[#4f7269] text-white rounded-2xl p-4 max-w-xs ml-auto">
                      <p className="text-sm">
                        Tell me about the latest in AI technology
                      </p>
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-4 max-w-sm">
                      <p className="text-sm">
                        I'd love to help! Let me search for the latest AI
                        developments...
                      </p>
                      <div className="flex space-x-1 mt-2">
                        <div className="w-2 h-2 bg-[#4f7269] rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-[#4f7269] rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-[#4f7269] rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Voice Indicator */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                  className="absolute -top-4 -right-4 bg-[#4f7269] rounded-full p-4 shadow-lg"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Image
                      src="/icons/volume_icon.png"
                      alt="Voice"
                      width={24}
                      height={24}
                      className="filter brightness-0 invert"
                    />
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powered by cutting-edge AI
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The most comprehensive AI assistant ever built. From managing your
              Gmail and creating presentations to accessing your entire Google
              Workspace and searching the web - all through natural
              conversation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "/icons/microphone_icon.png",
                title: "Google Workspace Integration",
                description:
                  "Manage Gmail, create Google Docs & Slides, analyze Sheets, schedule Calendar events, and build Forms - all through voice commands.",
              },
              {
                icon: "/globe.svg",
                title: "Web Intelligence",
                description:
                  "Search the web, extract content from any webpage, find images on Unsplash, and get real-time information instantly.",
              },
              {
                icon: "/icons/volume_icon.png",
                title: "Voice Commands & TTS",
                description:
                  "Natural speech recognition with lifelike AI responses. Hear your results, dictate commands, and have natural conversations with your AI assistant.",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-[#4f7269]/10 rounded-xl flex items-center justify-center mb-6">
                  <Image
                    src={feature.icon}
                    alt={feature.title}
                    width={24}
                    height={24}
                    className="filter"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What Can QuestWhisper Do - Creative Showcase */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#4f7269]/5 to-transparent"></div>
        <div className="absolute top-20 right-20 w-64 h-64 bg-[#4f7269]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-[#4f7269]/5 rounded-full blur-2xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-block"
            >
              <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                What can QuestWhisper
                <br />
                <span className="bg-gradient-to-r from-[#4f7269] to-[#3f5a51] bg-clip-text text-transparent">
                  do for you?
                </span>
              </h2>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
            >
              Imagine having a super-intelligent assistant who speaks your
              language, understands your needs, and can instantly work with all
              your digital tools. That's QuestWhisper.
            </motion.p>
          </motion.div>

          {/* Interactive Command Examples - Minimal Design */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Express your needs, watch AI magic unfold
              </h3>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                From complex research to creative tasks, see how QuestWhisper transforms your requests into powerful actions
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {[
                {
                  voice: "Research AI trends and create a presentation for the team",
                  steps: [
                    "Search web sources",
                    "Extract key insights",
                    "Create Slides deck",
                    "Add Unsplash visuals",
                  ],
                  time: "~4 min",
                },
                {
                  voice: "Find and analyze recent tech industry news",
                  steps: [
                    "Search news sources",
                    "Extract insights",
                    "Create summary doc",
                    "Add key trends",
                  ],
                  time: "~3 min",
                },
                {
                  voice: "Create a data report with charts from our Q3 spreadsheet",
                  steps: [
                    "Access Sheets data",
                    "Generate analysis",
                    "Create visualizations",
                    "Build summary doc",
                  ],
                  time: "~4 min",
                },
                {
                  voice: "Design a product mockup and collect team feedback",
                  steps: [
                    "Generate AI image",
                    "Create Forms survey",
                    "Share with team",
                    "Compile responses",
                  ],
                  time: "~5 min",
                },
              ].map((example, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-[#4f7269]/30 hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Voice Command */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <div className="w-2 h-2 bg-[#4f7269] rounded-full mr-3"></div>
                      <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                        You say
                      </span>
                    </div>
                    <p className="text-gray-900 text-lg font-medium leading-relaxed">
                      "{example.voice}"
                    </p>
                  </div>

                  {/* Steps */}
                  <div className="mb-4">
                    <div className="flex items-center mb-3">
                      <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                      <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                        QuestWhisper does
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {example.steps.map((step, stepIndex) => (
                        <span
                          key={stepIndex}
                          className="bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {step}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Time indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-500 text-sm">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{example.time}</span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg
                        className="w-5 h-5 text-[#4f7269]"
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
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bento Grid Layout - Minimal Black & White */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {/* Gmail & Email - Large card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="lg:col-span-2 lg:row-span-2 bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg hover:border-gray-300 transition-all duration-300 group cursor-pointer"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Gmail Integration
                </h3>
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  Manage your entire email workflow through voice commands.
                  Read, send, search, and organize emails effortlessly.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="text-sm text-gray-600">
                    • Send emails with just one prompt
                  </div>
                </div>
                <div className="text-sm text-gray-500">Used by 15k people</div>
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </motion.div>

            {/* Voice Commands - Medium card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300 group cursor-pointer"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Voice Commands
              </h3>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Natural speech recognition with lifelike AI responses.
              </p>
              <div className="text-sm text-gray-500">Used by 8.9k people</div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </motion.div>

            {/* Web Intelligence - Medium card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300 group cursor-pointer"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Web Intelligence
              </h3>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Real-time web search and content extraction from any website.
              </p>
              <div className="text-sm text-gray-500">Used by 12k people</div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </motion.div>

            {/* Google Docs - Small card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300 group cursor-pointer relative"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Google Docs
              </h3>
              <div className="text-sm text-gray-500">Used by 5.2k people</div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </motion.div>

            {/* Google Slides - Small card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300 group cursor-pointer relative"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Presentations
              </h3>
              <div className="text-sm text-gray-500">Used by 3.8k people</div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </motion.div>

            {/* Google Workspace Access - Wide card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              className="lg:col-span-2 bg-gray-900 text-white rounded-2xl p-8 hover:shadow-lg hover:bg-gray-800 transition-all duration-300 group cursor-pointer relative"
            >
              <h3 className="text-2xl font-bold text-white mb-4">
                Full Google Workspace Access
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Complete integration with your Google ecosystem. Access Drive
                files, create documents, analyze sheets, schedule meetings - all
                through natural conversation.
              </p>
              <div className="text-sm text-gray-400">Used by 12.5k people</div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </motion.div>

            {/* Calendar - Medium card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300 group cursor-pointer"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Smart Calendar
              </h3>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Schedule meetings, find available times, and manage your
                calendar through voice.
              </p>
              <div className="text-sm text-gray-500">Used by 7.4k people</div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </motion.div>

            {/* Google Sheets - Medium card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              viewport={{ once: true }}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300 group cursor-pointer"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Spreadsheet Analysis
              </h3>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Analyze data, create charts, and extract insights from your
                spreadsheets.
              </p>
              <div className="text-sm text-gray-500">Used by 4.3k people</div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Minimal CTA Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="bg-gray-50 border border-gray-200 rounded-3xl py-16 px-8 lg:px-16">
              <div className="max-w-3xl mx-auto">
                <h3 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                  Ready to experience the future?
                </h3>
                <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                  Stop switching between apps. Stop manual tasks. Stop waiting
                  for answers.
                  <br />
                  <span className="font-semibold text-gray-900">
                    Start talking to your digital world.
                  </span>
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGetStarted}
                  className="bg-[#4f7269] text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-[#3f5a51] transition-colors duration-300 shadow-sm hover:shadow-md"
                >
                  Try QuestWhisper Now
                </motion.button>

                <div className="mt-8 flex items-center justify-center space-x-8 text-sm text-gray-500">
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Free to start
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    No setup required
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Works instantly
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Image
                src="/whisper_logo.png"
                alt="QuestWhisper Logo"
                width={24}
                height={24}
                className="rounded"
              />
              <span className="text-sm text-gray-600">
                © 2025 QuestWhisper. All rights reserved.
              </span>
            </div>
            <div className="flex space-x-6">
              <a
                href="/privacy-policy"
                className="text-sm text-gray-600 hover:text-[#4f7269] transition-colors"
              >
                Privacy
              </a>
              <a
                href="/terms-of-service"
                className="text-sm text-gray-600 hover:text-[#4f7269] transition-colors"
              >
                Terms
              </a>
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=support@iwhispered.com&su=QuestWhisper%20Support%20Request"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-[#4f7269] transition-colors"
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
