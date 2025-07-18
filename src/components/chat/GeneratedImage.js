"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownTrayIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { downloadImage } from "../../utils/shareUtils";
import GeneratedImageDisplay from "./GeneratedImageDisplay";
import { MdDownload } from "react-icons/md";

export default function GeneratedImage({
  message,
  isGeneratingImage,
  generatedImageUrl,
}) {
  const [slideshowOpen, setSlideshowOpen] = useState(false);

  const handleDownload = () => {
    const imageUrl = message.attachments?.[0]?.url || generatedImageUrl;
    const prompt = message.attachments?.[0]?.prompt || message.imageDescription;
    downloadImage(imageUrl, prompt);
  };

  return (
    <div className="mb-6">
      {isGeneratingImage ? (
        <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-600">Generating your image...</p>
          </div>
        </div>
      ) : message.attachments?.[0]?.url || generatedImageUrl ? (
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex relative h-[500px] w-[500px]">
            <img
              onClick={() => setSlideshowOpen(true)}
              src={message.attachments?.[0]?.url || generatedImageUrl}
              alt={
                message.imageDescription ||
                message.attachments?.[0]?.prompt ||
                "Generated image"
              }
              className="rounded-xl h-full w-full object-contain cursor-pointer bg-slate-300 dark:bg-slate-600"
              onError={(e) => {
                console.error("Image load error:", e);
                // If the permanent URL fails, fallback to the temporary URL
                if (e.target.src !== generatedImageUrl && generatedImageUrl) {
                  console.log("Falling back to temporary URL");
                  e.target.src = generatedImageUrl;
                }
              }}
            />

           <button
              onClick={handleDownload}
              className="absolute m-[10px] bottom-0 right-0 inline-flex items-center gap-1 p-2 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <MdDownload className="w-5 h-5" />
            </button>
          </div>

          {/* Image description */}
          {(message.imageDescription || message.attachments?.[0]?.prompt) && (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 italic">
              {message.imageDescription ||
                `Generated from: "${message.attachments?.[0]?.prompt}"`}
            </p>
          )}

          {/* Generated image badge and download button */}
          {message.attachments?.[0]?.isGenerated && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                  <SparklesIcon className="w-4 h-4 text-blue-600" />
                  AI Generated
                </span>
              </div>
            </div>
          )}

          <GeneratedImageDisplay
            imageUrl={message.attachments?.[0]?.url || generatedImageUrl}
            imageDescription={message.imageDescription}
            startIndex={0}
            isOpen={slideshowOpen}
            onClose={() => setSlideshowOpen(false)}
          />
        </motion.div>
      ) : null}
    </div>
  );
}
