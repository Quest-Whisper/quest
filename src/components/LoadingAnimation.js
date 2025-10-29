"use client";

import { motion } from "framer-motion";

export default function LoadingAnimation({ 
  text = "Loading...", 
  subtitle = null,
  className = "",
  size = "large",
  inline = false 
}) {
  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-20 h-20", 
    large: "w-24 h-24"
  };

  const dotSizes = {
    small: "w-2 h-2",
    medium: "w-2.5 h-2.5",
    large: "w-3 h-3"
  };

  const coreSizes = {
    small: "w-6 h-6",
    medium: "w-7 h-7",
    large: "w-8 h-8"
  };

  if (inline) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          {/* Compact loading animation for inline use */}
          <div className="relative mb-4">
            <motion.div
              className={`${sizeClasses[size]} border-4 border-purple-200 rounded-full mx-auto`}
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <motion.div
              className={`absolute inset-0 ${coreSizes[size]} bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto my-auto`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          <motion.p
            className="text-gray-600 dark:text-slate-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {text}
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-white dark:bg-[#181818] ${className}`}>
      <div className="text-center">
        {/* Main loading animation */}
        <div className="relative mb-8">
          {/* Outer rotating ring */}
          <motion.div
            className={`${sizeClasses[size]} border-4 border-purple-200 rounded-full mx-auto`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          
          {/* Inner spinning dots */}
          <motion.div
            className={`absolute inset-0 ${sizeClasses[size]} mx-auto`}
            animate={{ rotate: -360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <div className="relative w-full h-full">
              <div className={`absolute top-0 left-1/2 ${dotSizes[size]} bg-purple-500 rounded-full transform -translate-x-1/2 -translate-y-1`}></div>
              <div className={`absolute bottom-0 left-1/2 ${dotSizes[size]} bg-blue-500 rounded-full transform -translate-x-1/2 translate-y-1`}></div>
              <div className={`absolute left-0 top-1/2 ${dotSizes[size]} bg-indigo-500 rounded-full transform -translate-y-1/2 -translate-x-1`}></div>
              <div className={`absolute right-0 top-1/2 ${dotSizes[size]} bg-cyan-500 rounded-full transform -translate-y-1/2 translate-x-1`}></div>
            </div>
          </motion.div>
          
          {/* Center pulsing core */}
          <motion.div
            className={`absolute inset-0 ${coreSizes[size]} bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto my-auto`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        
        {/* Loading text with typewriter effect */}
        <motion.div
          className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.span
            animate={{
              opacity: [1, 0.5, 1]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {text}
          </motion.span>
        </motion.div>
        
        {/* Optional subtitle */}
        {subtitle && (
          <motion.div
            className="text-sm text-gray-600 dark:text-slate-400 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {subtitle}
          </motion.div>
        )}
        
        {/* Animated dots */}
        <div className="flex justify-center space-x-1 mt-10">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-purple-400 rounded-full"
              animate={{
                y: [0, -10, 0],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-300 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.8,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 