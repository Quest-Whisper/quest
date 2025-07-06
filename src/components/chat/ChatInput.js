"use client";
import { useState, useRef, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/solid";
import Image from "next/image";

export default function ChatInput({ onSend, isLoading, onVoiceMode }) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const textareaRef = useRef(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSend(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !isLoading) {
        handleSubmit(e);
      }
    }
  };

  const handleVoiceMode = () => {
    onVoiceMode();
  };

  // Focus the textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
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
                text-slate-800 placeholder-slate-400
                focus:outline-none
                ${isMobile ? "text-base" : "text-sm"} leading-relaxed
                transition-all duration-200
                ${isFocused ? "placeholder-slate-300" : "placeholder-slate-400"}
              `}
              disabled={isLoading}
              style={{
                fontSize: isMobile ? "16px" : "15px", // Prevent zoom on iOS
                lineHeight: "1.5",
              }}
            />
          </div>

          <div className="w-full flex">
            <div className="flex justify-start w-full">
              {/* Voice Chat Button */}
              <motion.button onClick={handleVoiceMode} className="relative group absolute justify-start item-start cursor-pointer">
                <div className="flex h-[32px] w-[32px] border border-[#CCD6DD] p-[6px] rounded-full bg-[#E1E8ED] hover:bg-[#CCD6DD] justify-center">
                  <Image
                    src="/icons/waveform_lcon.png"
                    alt="waveform icon"
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
                disabled={isLoading || !message.trim()}
                className="relative group absolute justify-end item-end"
                whileHover={!isLoading && message.trim() ? "hover" : ""}
                whileTap={!isLoading && message.trim() ? "tap" : ""}
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
                  isLoading || !message.trim()
                    ? "bg-slate-100 cursor-not-allowed"
                    : "bg-white border-2 border-slate-200 shadow-sm group-hover:shadow-md group-hover:border-slate-300"
                }
              `}
                  whileHover={
                    !isLoading && message.trim()
                      ? {
                          boxShadow:
                            "0 8px 25px -8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                          transition: { duration: 0.2 },
                        }
                      : {}
                  }
                >
                  {/* Active State Indicator */}
                  {!isLoading && message.trim() && (
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
                      {isLoading ? (
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
                          !message.trim()
                            ? "text-slate-400"
                            : "text-slate-700 group-hover:text-slate-900"
                        }
                      `}
                        >
                          <motion.div
                            whileHover={
                              !isLoading && message.trim()
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
                  {!isLoading && message.trim() && (
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
        <div className="absolute inset-0 rounded-[30px] shadow-sm border-[0.5px] border-gray-300 pointer-events-none" />
      </div>
    </form>
  );
}
