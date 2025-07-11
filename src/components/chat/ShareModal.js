"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  shareToSocialMedia, 
  shareViaEmail, 
  createShareableLink, 
  downloadAsTextFile, 
  getSharePlatforms 
} from "../../utils/shareUtils";

export default function ShareModal({ 
  message, 
  isOpen, 
  onClose 
}) {
  if (!isOpen) return null;

  const platforms = getSharePlatforms();

  const handlePlatformShare = (platformKey) => {
    shareToSocialMedia(platformKey, message.content, onClose);
  };

  const handleEmailShare = () => {
    shareViaEmail(message.content, onClose);
  };

  const handleCreateLink = () => {
    createShareableLink(message, onClose);
  };

  const handleDownload = () => {
    downloadAsTextFile(message, onClose);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-[#181818] rounded-2xl shadow-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200  mb-2">
            Share Response
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Choose how you'd like to share this AI response
          </p>
        </div>

        <div className="space-y-4">
          {/* Direct Actions */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
              Options
            </h4>
            <div className="space-y-2">
              <motion.button
                onClick={handleCreateLink}
                className="w-full cursor-pointer flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-[#3B3B3B] hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-[#3B3B3B]/50 dark:hover:border-0"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-8 h-8 bg-gray-100 dark:bg-[#3B3B3B] rounded-lg flex items-center justify-center">
                  🔗
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Create Share Link
                </span>
              </motion.button>

              <motion.button
                onClick={handleDownload}
                className="w-full cursor-pointer flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-[#3B3B3B] hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-[#3B3B3B]/50 dark:hover:border-0"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-8 h-8 bg-gray-100 dark:bg-[#3B3B3B] rounded-lg flex items-center justify-center">
                  💾
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Download as File
                </span>
              </motion.button>
            </div>
          </div>
        </div>

        <motion.button
          onClick={onClose}
          className="w-full cursor-pointer mt-6 p-3 bg-gray-100 dark:bg-[#3B3B3B] hover:bg-gray-200 dark:hover:bg-[#3B3B3B]/50 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Cancel
        </motion.button>
      </motion.div>
    </motion.div>
  );
} 