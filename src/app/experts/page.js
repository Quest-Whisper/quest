"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Link from "next/link";

export default function ExpertsPage() {
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Transform values for different sections
  const heroY = useTransform(smoothProgress, [0, 0.2], [0, -100]);
  const step1Y = useTransform(smoothProgress, [0.1, 0.3], [100, 0]);
  const step2Y = useTransform(smoothProgress, [0.25, 0.45], [100, 0]);
  const step3Y = useTransform(smoothProgress, [0.4, 0.6], [100, 0]);
  const step4Y = useTransform(smoothProgress, [0.55, 0.75], [100, 0]);
  const ctaY = useTransform(smoothProgress, [0.7, 0.9], [100, 0]);

  useEffect(() => {
    const updateScrollY = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", updateScrollY);
    return () => window.removeEventListener("scroll", updateScrollY);
  }, []);

  const sections = [
    {
      title: "Meet Dr. Sarah Chen",
      subtitle: "Dermatologist transforming skin cancer diagnosis",
      content: "Traditional diagnosis methods require extensive experience and time. Dr. Chen wanted to create an AI system that could assist medical professionals in early detection of skin conditions.",
      icon: "👩‍⚕️",
      gradient: "from-blue-500 to-teal-500"
    },
    {
      title: "Collecting Medical Data",
      subtitle: "Building a comprehensive dataset",
      content: "Dr. Chen uploads thousands of dermatological images, each carefully labeled with diagnosis and patient information. Our ML Studio automatically organizes and prepares the data for training.",
      icon: "📊",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: "Training the AI Model",
      subtitle: "Teaching the machine to see like an expert",
      content: "The AI learns from Dr. Chen's expertise, studying patterns in skin lesions, color variations, and diagnostic markers. Real-time metrics show the model's improving accuracy.",
      icon: "🧠",
      gradient: "from-green-500 to-blue-500"
    },
    {
      title: "Interactive Diagnosis",
      subtitle: "Chat with your specialized AI",
      content: "Now Dr. Chen can upload patient images and chat with her AI assistant. The system provides instant analysis, confidence scores, and recommendations - all through natural conversation.",
      icon: "💬",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-white dark:bg-[#181818] overflow-x-hidden">
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
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/ml-studio" className="text-[#4f7269] hover:text-[#3f5a51] transition-colors font-medium">
                ML Studio
              </Link>
              <Link href="/chat">
                <button className="bg-[#4f7269] text-white px-6 py-2 rounded-full hover:bg-[#3f5a51] transition-colors font-medium">
                  Start Building
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section 
        style={{ y: heroY }}
        className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#4f7269]/10 via-transparent to-blue-500/5"></div>
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#4f7269]/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-2xl"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center mb-16"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-6xl lg:text-7xl font-bold text-slate-700 dark:text-slate-200 leading-tight mb-8"
            >
              How Experts Build{" "}
              <span className="bg-gradient-to-r from-[#4f7269] to-blue-500 bg-clip-text text-transparent">
                Intelligent AI
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-2xl text-gray-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed mb-8"
            >
              From data collection to intelligent conversation - see how medical professionals 
              are revolutionizing diagnosis with custom AI models.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="inline-block"
            >
              <div className="bg-white dark:bg-[#212124] rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-[#3B3B3B] max-w-md">
                <div className="text-6xl mb-4">🏥</div>
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Medical AI in Action
                </h3>
                <p className="text-gray-600 dark:text-slate-300">
                  Follow Dr. Chen's journey as she builds an AI dermatologist
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex flex-col items-center"
          >
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">Scroll to explore</p>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-6 h-10 border-2 border-gray-300 dark:border-slate-500 rounded-full flex justify-center"
            >
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1 h-3 bg-gray-400 dark:bg-slate-400 rounded-full mt-2"
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Step-by-Step Journey */}
      <div className="relative">
        {/* Progress Bar */}
        <div className="fixed left-8 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block">
          <div className="w-1 h-64 bg-gray-200 dark:bg-[#3B3B3B] rounded-full overflow-hidden">
            <motion.div
              style={{ scaleY: smoothProgress }}
              className="w-full bg-gradient-to-b from-[#4f7269] to-blue-500 origin-top rounded-full"
            />
          </div>
        </div>

        {sections.map((section, index) => {
          const yTransform = [step1Y, step2Y, step3Y, step4Y][index];
          
          return (
            <motion.section
              key={index}
              style={{ y: yTransform }}
              className="min-h-screen flex items-center py-20 px-4 sm:px-6 lg:px-8 relative"
            >
              <div className="max-w-7xl mx-auto w-full">
                <div className={`grid lg:grid-cols-2 gap-16 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
                  
                  {/* Content Side */}
                  <motion.div 
                    className={`space-y-8 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true, margin: "-100px" }}
                  >
                    <div className="flex items-center space-x-4 mb-6">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${section.gradient} flex items-center justify-center text-2xl`}>
                        {section.icon}
                      </div>
                      <div className="text-sm font-medium text-[#4f7269] bg-[#4f7269]/10 px-3 py-1 rounded-full">
                        Step {index + 1}
                      </div>
                    </div>
                    
                    <h2 className="text-4xl lg:text-5xl font-bold text-slate-700 dark:text-slate-200 leading-tight">
                      {section.title}
                    </h2>
                    
                    <h3 className="text-xl text-[#4f7269] font-semibold">
                      {section.subtitle}
                    </h3>
                    
                    <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed">
                      {section.content}
                    </p>

                    {index === sections.length - 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        viewport={{ once: true }}
                      >
                        <Link href="/ml-studio">
                          <button className="bg-[#4f7269] text-white px-8 py-4 rounded-full hover:bg-[#3f5a51] transition-all duration-300 font-semibold text-lg hover:shadow-lg transform hover:-translate-y-1">
                            Start Your AI Journey
                          </button>
                        </Link>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Visual Side */}
                  <motion.div 
                    className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    viewport={{ once: true, margin: "-100px" }}
                  >
                    {index === 0 && <ExpertVisual />}
                    {index === 1 && <DataCollectionVisual />}
                    {index === 2 && <TrainingVisual />}
                    {index === 3 && <ChatVisual />}
                  </motion.div>
                </div>
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* CTA Section */}
      <motion.section 
        style={{ y: ctaY }}
        className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#4f7269]/5 to-blue-500/5"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl lg:text-6xl font-bold text-slate-700 dark:text-slate-200 mb-8">
              Ready to Build Your{" "}
              <span className="bg-gradient-to-r from-[#4f7269] to-blue-500 bg-clip-text text-transparent">
                Expert AI?
              </span>
            </h2>
            
            <p className="text-xl text-gray-600 dark:text-slate-300 mb-12 leading-relaxed">
              Join thousands of experts who are already transforming their fields with custom AI models. 
              No coding required - just your expertise and our platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/ml-studio">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#4f7269] text-white px-10 py-5 rounded-full hover:bg-[#3f5a51] transition-all duration-300 font-semibold text-lg shadow-lg"
                >
                  Start Building Now
                </motion.button>
              </Link>
              
              <Link href="/chat">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-2 border-[#4f7269] text-[#4f7269] px-10 py-5 rounded-full hover:bg-[#4f7269] hover:text-white transition-all duration-300 font-semibold text-lg"
                >
                  Try General AI Chat
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 dark:border-[#3B3B3B] dark:bg-[#181818] py-12">
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
                href="https://mail.google.com/mail/?view=cm&fs=1&to=support@iwhispered.com&su=QuestWhisper%20Expert%20Support"
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

// Visual Components
function ExpertVisual() {
  return (
    <div className="relative">
      <div className="bg-white dark:bg-[#212124] rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-[#3B3B3B]">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center text-2xl">
            👩‍⚕️
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Dr. Sarah Chen</h3>
            <p className="text-gray-600 dark:text-slate-300">Board-Certified Dermatologist</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-[#181818]/50 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">Specialization</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200">Skin Cancer Detection & Dermatology</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-[#181818]/50 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">Goal</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200">Build AI to assist in early cancer detection</p>
          </div>
        </div>
        
        {/* Floating medical icons */}
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -top-4 -right-4 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-xl"
        >
          🔬
        </motion.div>
      </div>
    </div>
  );
}

function DataCollectionVisual() {
  return (
    <div className="relative">
      <div className="bg-white dark:bg-[#212124] rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-[#3B3B3B]">
        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-6">Dataset Organization</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {["Melanoma", "Benign Mole", "Actinic Keratosis", "Seborrheic Keratosis"].map((label, i) => (
            <div key={label} className="bg-gray-50 dark:bg-[#181818]/50 rounded-lg p-3">
              <div className="w-full h-20 bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-800 dark:to-purple-800 rounded mb-2 flex items-center justify-center">
                <span className="text-2xl">🖼️</span>
              </div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{label}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{250 + i * 50} images</p>
            </div>
          ))}
        </div>
        
        <div className="bg-[#4f7269]/10 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Upload Progress</span>
            <span className="text-sm text-[#4f7269] font-bold">1,200 / 1,200</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-[#3B3B3B] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, delay: 0.5 }}
              className="h-full bg-[#4f7269] rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TrainingVisual() {
  return (
    <div className="relative">
      <div className="bg-white dark:bg-[#212124] rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-[#3B3B3B]">
        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-6">AI Training in Progress</h3>
        
        {/* Neural Network Visualization */}
        <div className="relative h-32 mb-6 bg-gray-50 dark:bg-[#181818]/50 rounded-lg flex items-center justify-center overflow-hidden">
          <div className="grid grid-cols-4 gap-8 items-center">
            {/* Input layer */}
            <div className="flex flex-col space-y-2">
              {[1,2,3].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, delay: i * 0.1, repeat: Infinity }}
                  className="w-3 h-3 bg-blue-400 rounded-full"
                />
              ))}
            </div>
            
            {/* Hidden layers */}
            {[1,2].map(layer => (
              <div key={layer} className="flex flex-col space-y-1">
                {[1,2,3,4,5].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, delay: (layer * 0.3) + (i * 0.05), repeat: Infinity }}
                    className="w-2 h-2 bg-[#4f7269] rounded-full"
                  />
                ))}
              </div>
            ))}
            
            {/* Output layer */}
            <div className="flex flex-col space-y-2">
              {[1,2].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, delay: 1 + i * 0.1, repeat: Infinity }}
                  className="w-3 h-3 bg-green-400 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Training Metrics */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Accuracy</span>
            <span className="text-sm font-bold text-green-600">94.7%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-[#3B3B3B] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "94.7%" }}
              transition={{ duration: 3, delay: 1 }}
              className="h-full bg-green-500 rounded-full"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Epoch</span>
            <span className="text-sm font-bold text-[#4f7269]">47 / 50</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-[#3B3B3B] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "94%" }}
              transition={{ duration: 2.5, delay: 1.5 }}
              className="h-full bg-[#4f7269] rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatVisual() {
  const [messages, setMessages] = useState([
    { role: "user", content: "Can you analyze this skin lesion?", time: "2:34 PM" },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages(prev => [...prev, 
        { role: "ai", content: "I can see this lesion has irregular borders and varied coloration. Based on my analysis, this shows characteristics consistent with melanoma. Confidence: 87%", time: "2:34 PM" },
        { role: "ai", content: "I recommend immediate biopsy and specialist consultation.", time: "2:35 PM" }
      ]);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      <div className="bg-white dark:bg-[#212124] rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-[#3B3B3B]">
        {/* Chat Header */}
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100 dark:border-[#3B3B3B]">
          <div className="w-10 h-10 bg-gradient-to-r from-[#4f7269] to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Dr. Chen's Dermatology AI</h3>
            <p className="text-xs text-green-500">● Online and Ready</p>
          </div>
        </div>
        
        {/* Chat Messages */}
        <div className="space-y-4 mb-4">
          {messages.map((message, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.5 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs rounded-2xl px-4 py-3 ${
                message.role === 'user' 
                  ? 'bg-[#4f7269] text-white' 
                  : 'bg-gray-100 dark:bg-[#181818]/50 text-slate-700 dark:text-slate-200'
              }`}>
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">{message.time}</p>
              </div>
            </motion.div>
          ))}
          
          {messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 dark:bg-[#181818]/50 rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Sample Image */}
        {messages.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 3 }}
            className="bg-gray-50 dark:bg-[#181818]/50 rounded-lg p-4 mb-4"
          >
            <div className="w-full h-24 bg-gradient-to-br from-pink-200 to-red-200 dark:from-pink-800 dark:to-red-800 rounded-lg flex items-center justify-center mb-2">
              <span className="text-3xl">🔍</span>
            </div>
            <p className="text-xs text-center text-slate-600 dark:text-slate-300">Skin lesion analysis complete</p>
          </motion.div>
        )}
      </div>
    </div>
  );
} 