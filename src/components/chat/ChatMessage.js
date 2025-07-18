"use client";

import { motion } from "framer-motion";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import React from "react";

// Import utilities and components
import {
  getSources,
  removeSources,
  getImages,
  getMessageTypeFlags,
} from "../../utils/messageUtils";
import { markdownComponents } from "../../utils/markdownComponents";
import { useAudio } from "../../hooks/useAudio";
import { useImageGeneration } from "../../hooks/useImageGeneration";
import ShareModal from "./ShareModal";
import GeneratedImage from "./GeneratedImage";
import AttachedImage from "./AttachedImage";
import UserAttachments from "./UserAttachments";
import ActionButtons from "./ActionButtons";
import Sources from "./Sources";
import ImageSlideshow from "./ImageSlideshow";

// New SearchResultImages component
const SearchResultImages = ({ images }) => {
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });

  if (!images || images.length === 0) return null;

  const handleImageClick = (index, event) => {
    const rect = event.target.getBoundingClientRect();
    setClickPosition({
      x: rect.left + rect.width / 2 - window.innerWidth / 2,
      y: rect.top + rect.height / 2 - window.innerHeight / 2,
    });
    setSelectedImageIndex(index);
    setSlideshowOpen(true);
  };

  return (
    <>
      <div className="flex flex-row md:grid md:grid-cols-4 md:items-center overflow-x-scroll gap-4 mb-4 w-full">
        {images.map((image, index) => (
          <div key={index} className="flex-shrink-0">
            <button
              onClick={(e) => handleImageClick(index, e)}
              className="block overflow-hidden rounded-lg border-gray-400 bg-gray-100 w-[150px] md:w-[100%] cursor-pointer hover:opacity-90 transition-opacity"
            >
              <img
                src={image.url}
                alt={image.title}
                className="w-[100%] h-[120px] object-cover"
                loading="lazy"
              />
            </button>
          </div>
        ))}
      </div>

      <ImageSlideshow
        images={images}
        startIndex={selectedImageIndex}
        isOpen={slideshowOpen}
        onClose={() => setSlideshowOpen(false)}
        clickPosition={clickPosition}
      />
    </>
  );
};

export default function ChatMessage({
  message,
  isUser,
  onRetry,
  onResendLastMessage,
  onChatUpdate,
}) {
  const [parsedSources, setParsedSources] = useState([]);
  const [parsedImages, setParsedImages] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  // Use custom hooks
  const audio = useAudio();

  // Get message type flags
  const messageFlags = getMessageTypeFlags(message, isUser);
  const {
    isError,
    isStreaming,
    isRetryableError,
    isRetryable,
    isImageGeneration,
    hasUserAttachments,
    hasDisplayImage,
    hasAttachedImage,
  } = messageFlags;

  // Use image generation hook
  const { isGeneratingImage, generatedImageUrl } = useImageGeneration(
    message,
    isImageGeneration,
    onChatUpdate
  );

  // Determine sources and images
  const sources = message.sources?.length ? message.sources : parsedSources;
  const images = message.images?.length ? message.images : parsedImages;
  const hasSources =
    !isUser && sources.length > 0 && (!isStreaming || showMetadata);
  const hasImages =
    !isUser && images.length > 0 && (!isStreaming || showMetadata);

  // Parse sources and images from message content
  useEffect(() => {
    if (message.content) {
      // Check if this is a metadata update
      if (message.isMetadata) {
        setShowMetadata(true);
      }
      setParsedSources(getSources(message.content));
      setParsedImages(getImages(message.content));
    }
  }, [message.content, message.isMetadata]);

  // Reset metadata flag when streaming starts
  useEffect(() => {
    if (isStreaming) {
      setShowMetadata(false);
    }
  }, [isStreaming]);

  // Handle retry for the specific error message
  const handleRetry = useCallback(() => {
    if (onRetry) {
      // Use the provided onRetry function if available
      onRetry();
    } else if (isRetryableError && onResendLastMessage) {
      // For the specific error message, resend the last user message
      onResendLastMessage();
    }
  }, [onRetry, isRetryableError, onResendLastMessage]);

  // Memoize hover handlers to prevent unnecessary re-renders
  const handleHoverStart = useCallback(() => {
    if (!isStreaming) {
      setIsHovered(true);
    }
  }, [isStreaming]);

  const handleHoverEnd = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Audio toggle handler
  const handleAudioToggle = useCallback(() => {
    audio.playAudio(message.content);
  }, [audio.playAudio, message.content]);

  // Share modal handlers
  const handleShare = useCallback(() => {
    setShowShareModal(true);
  }, []);

  const handleCloseShare = useCallback(() => {
    setShowShareModal(false);
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full group"
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
        layout={!isStreaming} // Disable layout animation during streaming
      >
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div
            className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
          >
            {/* Display user-uploaded attachments */}
            {isUser && <UserAttachments attachments={message.attachments} />}
            <motion.div
              className={`${
                isUser
                  ? "bg-slate-100 dark:bg-[#3B3B3B] rounded-3xl px-4 pt-[12px] max-w-[70%] flex items-center"
                  : isError && !isRetryableError
                  ? "bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3"
                  : "w-full"
              }`}
              whileHover={
                isUser && !isStreaming
                  ? {
                      transition: { duration: 0.2 },
                    }
                  : !isError && !isStreaming
                  ? {
                      transition: { duration: 0.2 },
                    }
                  : {}
              }
              transition={{ duration: 0.2 }}
              layout={!isStreaming} // Disable layout animation during streaming
            >
              {/* Display search result images */}
              {hasImages && !isImageGeneration && <SearchResultImages images={images} />}

              {/* Display generated image */}
              {isImageGeneration && (
                <GeneratedImage
                  message={message}
                  isGeneratingImage={isGeneratingImage}
                  generatedImageUrl={generatedImageUrl}
                />
              )}

              {/* Display attached images */}
              <AttachedImage message={message} />

              {/* Error indicator */}
              {isError && !isRetryableError && (
                <motion.div
                  className="flex items-center gap-2 mb-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  <span className="font-semibold text-red-700">
                    Something went wrong
                  </span>
                </motion.div>
              )}

              {/* Message content */}
              {!isUser ? (
                <motion.article
                  className="text-[16px] leading-relaxed text-slate-800 dark:text-slate-200 dark:text-slate-200"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: isStreaming ? 0 : 0.1 }}
                  layout={!isStreaming}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {removeSources(message.content)}
                  </ReactMarkdown>

                  {/* Streaming indicator */}
                  {isStreaming && (
                    <motion.div
                      className="flex items-center gap-2 mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="flex space-x-1">
                        <motion.div
                          className="w-2 h-2 bg-blue-400 rounded-full"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: 0,
                          }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-blue-400 rounded-full"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: 0.2,
                          }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-blue-400 rounded-full"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: 0.4,
                          }}
                        />
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        generating...
                      </span>
                    </motion.div>
                  )}
                </motion.article>
              ) : (
                <div className="flex flex-col">
                  <span className="mb-[12px] dark:text-slate-200">
                    {message.content}
                  </span>
                </div>
              )}

              {/* Sources */}
              <Sources sources={sources} isStreaming={isStreaming} />
            </motion.div>

            {/* Action buttons */}
            <ActionButtons
              message={message}
              isUser={isUser}
              isStreaming={isStreaming}
              isRetryable={isRetryable}
              isLoading={audio.isLoading}
              isPlaying={audio.isPlaying}
              wavUrl={audio.wavUrl}
              onRetry={handleRetry}
              onAudioToggle={handleAudioToggle}
              onShare={handleShare}
            />
          </div>
        </div>
      </motion.div>

      {/* Share Modal */}
      <ShareModal
        message={message}
        isOpen={showShareModal}
        onClose={handleCloseShare}
      />
    </>
  );
}
