"use client";

import React from "react";
import { motion } from "framer-motion";

export default function AttachedImage({ message }) {
  if (!message.displayImage && (!message.image || !message.image.uri)) {
    return null;
  }

  // Handle display image (from displayImage field)
  if (message.displayImage) {
    return (
      <motion.div
        className="mb-6 flex justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <img
          src={message.displayImage}
          className="rounded-xl max-h-80 w-auto object-cover shadow-md"
          alt="AI generated image"
        />
      </motion.div>
    );
  }

  // Handle attached image (from image field)
  if (message.image && message.image.uri) {
    return (
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative">
          <img
            src={message.image.uri}
            className="rounded-xl max-h-80 w-auto object-cover shadow-md"
            alt={message.image.displayName || "Attached image"}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      </motion.div>
    );
  }

  return null;
} 