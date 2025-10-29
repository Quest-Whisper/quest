"use client";
import { useState, useRef, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  XMarkIcon,
  DocumentIcon,
  PaperClipIcon,
  SpeakerWaveIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/solid";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { uploadMultipleFilesToFirebase, validateFileType, validateFileSize, getFileCategory, needsGeminiUpload } from "@/lib/firebase";

export default function ChatInput({ onSend, isLoading, onVoiceMode }) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const { data: session } = useSession();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((message.trim() || selectedFiles.length > 0) && !isLoading && !isUploadingFiles) {
      let messageData = {
        text: message,
        attachments: selectedFiles.length > 0 ? selectedFiles : null
      };
      
      onSend(messageData);
      setMessage("");
      setSelectedFiles([]);
      setFilePreviews([]);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((message.trim() || selectedFiles.length > 0) && !isLoading && !isUploadingFiles) {
        handleSubmit(e);
      }
    }
  };

  const handleVoiceMode = () => {
    onVoiceMode();
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const createFilePreview = (file) => {
    return new Promise((resolve) => {
      const category = getFileCategory(file);
      
      if (category === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: `${Date.now()}_${Math.random()}`,
            file,
            category,
            previewUrl: e.target.result,
            displayName: file.name,
            size: file.size,
            type: file.type
          });
        };
        reader.readAsDataURL(file);
      } else {
        resolve({
          id: `${Date.now()}_${Math.random()}`,
          file,
          category,
          previewUrl: null,
          displayName: file.name,
          size: file.size,
          type: file.type
        });
      }
    });
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate files
    const validFiles = [];
    const invalidFiles = [];

    for (const file of files) {
      if (!validateFileType(file)) {
        invalidFiles.push(`${file.name}: Invalid file type`);
        continue;
      }
      
      if (!validateFileSize(file, 20)) {
        invalidFiles.push(`${file.name}: File too large (max 20MB)`);
        continue;
      }
      
      validFiles.push(file);
    }

    if (invalidFiles.length > 0) {
      alert(`Some files were rejected:\n${invalidFiles.join('\n')}`);
    }

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    // Create previews for valid files
    const previews = await Promise.all(validFiles.map(createFilePreview));
    setFilePreviews(prev => [...prev, ...previews]);

    // Upload files (Firebase for storage + Gemini for AI processing)
    setIsUploadingFiles(true);
    setUploadProgress({ current: 0, total: validFiles.length });

    try {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      // First upload to Firebase for storage
      const firebaseResult = await uploadMultipleFilesToFirebase(
        validFiles, 
        session.user.id,
        (current, total, fileResult) => {
          setUploadProgress({ current: current * 0.5, total }); // First 50% of progress
        }
      );
      
      if (!firebaseResult.success) {
        throw new Error(firebaseResult.error);
      }

      // Then upload non-image files to Gemini for AI processing
      const uploadedFiles = [];
      
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const firebaseFile = firebaseResult.files[i];
        
        let geminiFile = null;
        
        if (needsGeminiUpload(file)) {
          try {
            // Upload to Gemini File API
            const formData = new FormData();
            formData.append('file', file);
            
            const geminiResponse = await fetch('/api/upload-gemini', {
              method: 'POST',
              body: formData,
            });
            
            const geminiResult = await geminiResponse.json();
            
            if (geminiResult.success) {
              geminiFile = geminiResult.geminiFile;
            } else {
              console.warn(`Failed to upload ${file.name} to Gemini:`, geminiResult.error);
            }
          } catch (geminiError) {
            console.warn(`Failed to upload ${file.name} to Gemini:`, geminiError);
          }
        }
        
        uploadedFiles.push({
          url: firebaseFile.url,
          type: firebaseFile.type,
          displayName: firebaseFile.displayName,
          size: firebaseFile.size,
          category: getFileCategory(file),
          geminiFile: geminiFile // Include Gemini file info if available
        });
        
        // Update progress
        setUploadProgress({ 
          current: validFiles.length * 0.5 + (i + 1) * 0.5, 
          total: validFiles.length 
        });
      }
      
      setSelectedFiles(prev => [...prev, ...uploadedFiles]);
      
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload some files. Please try again.');
      // Remove failed uploads from previews
      setFilePreviews(prev => prev.filter(preview => 
        !validFiles.some(file => file === preview.file)
      ));
    } finally {
      setIsUploadingFiles(false);
      setUploadProgress({ current: 0, total: 0 });
    }

    // Reset file input
    e.target.value = '';
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (category) => {
    switch (category) {
      case 'image':
        return <PhotoIcon className="w-4 h-4" />;
      case 'pdf':
        return <DocumentIcon className="w-4 h-4" />;
      case 'document':
        return <DocumentIcon className="w-4 h-4" />;
      case 'spreadsheet':
        return <DocumentIcon className="w-4 h-4" />;
      case 'presentation':
        return <DocumentIcon className="w-4 h-4" />;
      case 'audio':
        return <SpeakerWaveIcon className="w-4 h-4" />;
      case 'video':
        return <VideoCameraIcon className="w-4 h-4" />;
      case 'text':
        return <DocumentIcon className="w-4 h-4" />;
      default:
        return <PaperClipIcon className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Focus the textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative rounded-[30px] dark:bg-[#212124]">
        {/* File Previews */}
        <AnimatePresence>
          {filePreviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-3 mb-2 p-3 rounded-lg border-b-[1px] border-gray-200  dark:border-[#3B3B3B] max-h-40 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700  dark:text-slate-200">
                  {filePreviews.length} file{filePreviews.length > 1 ? 's' : ''} selected
                </span>
                {isUploadingFiles && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-gray-500 dark:text-slate-200">
                      Uploading {uploadProgress.current}/{uploadProgress.total}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {filePreviews.map((preview, index) => (
                  <motion.div
                    key={preview.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 p-2 bg-white dark:bg-[#3B3B3B] rounded-lg border-[1px] dark:border-0 border-gray-300"
                  >
                    <div className="flex-shrink-0">
                      {preview.category === 'image' && preview.previewUrl ? (
                        <img
                          src={preview.previewUrl}
                          alt="Preview"
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          {getFileIcon(preview.category)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900  dark:text-slate-200 truncate">
                        {preview.displayName}
                      </p>
                      <p className="text-xs text-gray-500  dark:text-slate-200">
                        {formatFileSize(preview.size)}
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      disabled={isUploadingFiles}
                      className="p-1 text-gray-400 hover:bg-[#212124] hover:text-[#E1E8ED] bg-[#E1E8ED] dark:bg-[#212124] dark:hover:bg-[#E1E8ED] dark:hover:text-[#212124] rounded-full transition-colors disabled:opacity-50"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div
          className={`
          flex flex-col gap-1 
          ${isMobile ? "pb-3 pt-1 px-3" : "pb-3 pt-2 px-3"}
        `}
        >
          <div className="flex-1 relative">
            <TextareaAutosize
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask me anything..."
              maxRows={isMobile ? 6 : 8}
              minRows={1}
              className={`
                w-full resize-none bg-transparent
                ${isMobile ? "px-4 py-4 pr-4" : "px-4 py-3 pr-4"}
                text-slate-800 dark:text-[#E1E8ED] placeholder-slate-400
                focus:outline-none
                ${isMobile ? "text-base" : "text-sm"} leading-relaxed
                transition-all duration-200
                ${isFocused ? "placeholder-slate-300" : "placeholder-slate-400"}
              `}
              disabled={isLoading || isUploadingFiles}
              style={{
                fontSize: isMobile ? "16px" : "15px", // Prevent zoom on iOS
                lineHeight: "1.5",
              }}
            />
          </div>

          <div className="w-full flex">
            <div className="flex justify-start w-full gap-2">
              {/* File Attachment Button */}
              <motion.button 
                type="button"
                onClick={handleFileSelect}
                disabled={isLoading || isUploadingFiles}
                className="relative group cursor-pointer"
              >
                <div className="group flex h-[32px] w-[32px] border border-[#CCD6DD] dark:border-0 p-[6px] rounded-full bg-[#E1E8ED] dark:bg-[#212124] hover:bg-[#3B3B3B] justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                <Image
                    src="/icons/clip_icon.png"
                    alt="attachments icon"
                    className="dark:invert group-hover:invert"
                    width={16}
                    height={16}
                  />
                </div>
                {filePreviews.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    {filePreviews.length}
                  </div>
                )}
              </motion.button>
              {/* Hint: Only PDF, TXT, images, audio, and video supported */}
              
              {/* Voice Chat Button */}
              <motion.button 
                type="button"
                onClick={handleVoiceMode} 
                className="relative group cursor-pointer"
              >
                <div className="group flex h-[32px] w-[32px] border border-[#CCD6DD] dark:border-0 p-[6px] rounded-full bg-[#E1E8ED] dark:bg-[#212124] hover:bg-[#3B3B3B] justify-center">
                  <Image
                    src="/icons/waveform_icon.png"
                    alt="waveform icon"
                    className="dark:invert group-hover:invert"
                    width={16}
                    height={16}
                  />
                </div>
              </motion.button>
            </div>

            <div className="flex justify-end w-full">
              {/* Send Button */}
              <motion.button
                type="submit"
                disabled={isLoading || isUploadingFiles || (!message.trim() && selectedFiles.length === 0)}
                className="relative group absolute justify-end item-end"
                whileHover={!isLoading && !isUploadingFiles && (message.trim() || selectedFiles.length > 0) ? "hover" : ""}
                whileTap={!isLoading && !isUploadingFiles && (message.trim() || selectedFiles.length > 0) ? "tap" : ""}
                variants={{
                  hover: {
                    scale: 1.05,
                    transition: { duration: 0.2, ease: "easeOut" },
                  },
                  tap: {
                    scale: 0.95,
                    transition: { duration: 0.1, ease: "easeInOut" },
                  },
                }}
              >
                {/* Button Background with Gradient Ring */}
                <motion.div
                  className={`
                relative flex items-center justify-center
                ${isMobile ? "w-12 h-12" : "w-10 h-10"} rounded-full
                transition-all duration-300 ease-out
                ${
                  isLoading || isUploadingFiles || (!message.trim() && selectedFiles.length === 0)
                    ? "bg-[#E1E8ED] dark:bg-[#3B3B3B] cursor-not-allowed"
                    : "bg-[#3B3B3B] dark:bg-[#3B3B3B] border-2 border-slate-200 shadow-sm group-hover:shadow-md group-hover:border-slate-300"
                }
              `}
                  whileHover={
                    !isLoading && !isUploadingFiles && (message.trim() || selectedFiles.length > 0)
                      ? {
                          boxShadow:
                            "0 8px 25px -8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                          transition: { duration: 0.2 },
                        }
                      : {}
                  }
                >
                  {/* Active State Indicator */}
                  {!isLoading && !isUploadingFiles && (message.trim() || selectedFiles.length > 0) && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}

                  {/* Icon Container */}
                  <div className="relative z-10">
                    <AnimatePresence mode="wait">
                      {isLoading || isUploadingFiles ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0, rotate: -90 }}
                          animate={{ opacity: 1, rotate: 0 }}
                          exit={{ opacity: 0, rotate: 90 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-center"
                        >
                          <motion.div
                            className={`
                          ${isMobile ? "w-5 h-5" : "w-4 h-4"} 
                          rounded-full border-2 border-slate-300
                        `}
                            style={{
                              borderTopColor: "#475569",
                              borderRightColor: "transparent",
                            }}
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="send"
                          initial={{ opacity: 0, x: -2 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 2 }}
                          transition={{ duration: 0.2 }}
                          className={`
                        flex items-center justify-center
                        ${
                          !message.trim() && selectedFiles.length === 0
                            ? "text-slate-400 dark:text-slate-500"
                            : "text-slate-700 group-hover:text-slate-900"
                        }
                      `}
                        >
                          <motion.div
                            whileHover={
                              !isLoading && !isUploadingFiles && (message.trim() || selectedFiles.length > 0)
                                ? {
                                    x: 1,
                                    transition: { duration: 0.1 },
                                  }
                                : {}
                            }
                          >
                            <PaperAirplaneIcon
                              className={`
                          ${isMobile ? "w-5 h-5" : "w-4 h-4"} 
                          rotate--90
                        `}
                            />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Ripple Effect on Click */}
                  {!isLoading && !isUploadingFiles && (message.trim() || selectedFiles.length > 0) && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-slate-400"
                      initial={{ scale: 0, opacity: 0.3 }}
                      whileTap={{
                        scale: 1.5,
                        opacity: 0,
                        transition: { duration: 0.3 },
                      }}
                    />
                  )}
                </motion.div>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Focus ring */}
        <div className="absolute inset-0 rounded-[30px] shadow-sm border-[1px] border-gray-300 dark:border-[#3B3B3B] pointer-events-none" />
      </div>
      
      {/* Hidden file input - Allow multiple files */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,audio/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </form>
  );
}
