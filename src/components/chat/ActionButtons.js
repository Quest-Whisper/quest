"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShareIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { copyToClipboard } from "../../utils/shareUtils";

export default function ActionButtons({ 
  message,
  isUser,
  isStreaming,
  isRetryable,
  isLoading,
  isPlaying,
  wavUrl,
  onRetry,
  onAudioToggle,
  onShare
}) {
  // Don't show action buttons for streaming messages
  if (isStreaming) {
    return null;
  }

  const handleCopy = () => {
    copyToClipboard(message.content || "");
  };

  return (
    <motion.div
      className="flex items-center gap-1 mt-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {/* Copy button - available for all messages */}
      <motion.button 
        onClick={handleCopy} 
        className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Image
          src="/icons/copy_icon.png"
          alt="Copy content"
          width={20}
          height={20}
        />
      </motion.button>

      {/* AI message specific actions */}
      {!isUser && (
        <>
          {/* Retry button */}
          {isRetryable && (
            <motion.button
              onClick={onRetry}
              className="px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 flex items-center gap-1.5 border border-blue-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Retry this message"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="text-sm font-medium">Retry</span>
            </motion.button>
          )}

          {/* Audio play/stop button */}
          <motion.button
            onClick={onAudioToggle}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isPlaying ? "Stop audio" : "Play audio"}
          >
            {isLoading ? (
              // Loading spinner
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              </div>
            ) : isPlaying ? (
              // Stop button
              <div className="w-6 h-6 bg-[#66757F] hover:bg-[#292F33] rounded-md flex items-center justify-center transition-colors duration-200">
                <div className="w-3 h-3 bg-white rounded-sm"></div>
              </div>
            ) : (
              // Play button
              <Image
                src="/icons/volume_icon.png"
                alt="Play audio"
                width={24}
                height={24}
              />
            )}
          </motion.button>

          {/* Share button */}
          <motion.button
            onClick={onShare}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Share response"
          >
            <ShareIcon className="w-5 h-5" />
          </motion.button>
        </>
      )}

      {/* Audio element for wav playback */}
      {wavUrl && (
        <motion.audio
          src={wavUrl}
          className="ml-2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        />
      )}
    </motion.div>
  );
} 