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
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Share Response
          </h3>
          <p className="text-sm text-gray-600">
            Choose how you'd like to share this AI response
          </p>
        </div>

        <div className="space-y-4">
          {/* Social Media Sharing */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Social Media
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {platforms.map((platform) => (
                <motion.button
                  key={platform.key}
                  onClick={() => handlePlatformShare(platform.key)}
                  className={`${platform.color} text-white p-3 rounded-xl text-xs font-medium transition-colors`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {platform.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Direct Actions */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Direct Actions
            </h4>
            <div className="space-y-2">
              <motion.button
                onClick={handleEmailShare}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  📧
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Share via Email
                </span>
              </motion.button>

              <motion.button
                onClick={handleCreateLink}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  🔗
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Create Share Link
                </span>
              </motion.button>

              <motion.button
                onClick={handleDownload}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  💾
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Download as File
                </span>
              </motion.button>
            </div>
          </div>
        </div>

        <motion.button
          onClick={onClose}
          className="w-full mt-6 p-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Cancel
        </motion.button>
      </motion.div>
    </motion.div>
  );
} 