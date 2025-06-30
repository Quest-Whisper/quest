"use client";
import { useState, useRef, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";

export default function ChatInput({ onSend, isLoading }) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

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

  // Focus the textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        {/* Background glow effect */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-indigo-100/50 rounded-2xl blur-sm -z-10"
            />
          )}
        </AnimatePresence>

        <div className="relative flex items-end gap-3 pb-4 px-2">
          <div className="flex-1 relative">
            <TextareaAutosize
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask me anything..."
              maxRows={8}
              minRows={1}
              className={`
                w-full resize-none bg-transparent px-4 py-3 pr-4
                text-slate-800 placeholder-slate-400
                focus:outline-none
                text-sm leading-relaxed
                transition-all duration-200
                ${isFocused ? 'placeholder-slate-300' : 'placeholder-slate-400'}
              `}
              disabled={isLoading}
              style={{
                fontSize: '15px',
                lineHeight: '1.5',
              }}
            />
          </div>

          {/* Enhanced Send Button */}
          <motion.button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="relative group"
            whileHover={
              !isLoading && message.trim() 
                ? "hover" 
                : ""
            }
            whileTap={
              !isLoading && message.trim() 
                ? "tap" 
                : ""
            }
            variants={{
              hover: { 
                scale: 1.05,
                transition: { duration: 0.2, ease: "easeOut" }
              },
              tap: { 
                scale: 0.95,
                transition: { duration: 0.1, ease: "easeInOut" }
              }
            }}
          >
            {/* Button Background with Gradient Ring */}
            <motion.div
              className={`
                relative flex items-center justify-center
                w-10 h-10 rounded-full
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
                      boxShadow: "0 8px 25px -8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                      transition: { duration: 0.2 }
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
                        className="w-4 h-4 rounded-full border-2 border-slate-300"
                        style={{
                          borderTopColor: "#475569",
                          borderRightColor: "transparent",
                        }}
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          ease: "linear"
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
                                 transition: { duration: 0.1 }
                               }
                             : {}
                         }
                       >
                         <PaperAirplaneIcon className="w-4 h-4 rotate--90" />
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
                    transition: { duration: 0.3 }
                  }}
                />
              )}
            </motion.div>

          </motion.button>
        </div>

        {/* Focus ring */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-transparent pointer-events-none"
          animate={{
            borderColor: isFocused 
              ? "rgba(59, 130, 246, 0.3)" 
              : "rgba(36, 36, 36, 0.3)",
          }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </form>
  );
}
