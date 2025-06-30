"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatInput from "../../components/chat/ChatInput";
import { useSession } from "next-auth/react";
import ChatMessage from "@/components/chat/ChatMessage";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { data: session, status } = useSession();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const parseModelResponse = (rawContent) => {
    try {
      // Check if the response contains sources or displayImage
      if (typeof rawContent !== "string") return { content: rawContent };

      let content = rawContent;
      let sources = [];
      let displayImage = null;

      // Extract sources if present
      const sourcesMatch = content.match(/sources:\[.*?\]/s);
      if (sourcesMatch) {
        const sourcesStr = sourcesMatch[0];
        content = content.replace(sourcesStr, "").trim();

        // Parse the sources JSON
        const sourcesJson = sourcesStr.replace("sources:", "");
        try {
          sources = JSON.parse(sourcesJson);
        } catch (e) {
          console.error("Failed to parse sources JSON:", e);
        }
      }

      // Extract displayImage if present
      const displayImageMatch = content.match(/displayImage:(\S+)/);
      if (displayImageMatch) {
        displayImage = displayImageMatch[1];
        content = content.replace(displayImageMatch[0], "").trim();
      }

      return { content, sources, displayImage };
    } catch (error) {
      console.error("Error parsing model response:", error);
      return { content: rawContent };
    }
  };

  const handleSendMessage = async (content) => {
    const userMessage = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
      status: "sending",
      user: {
        name: session?.user?.name,
        email: session?.user?.email,
      },
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(
            ({ role, content, user }) => ({
              role,
              content,
              user,
            })
          ),
          context: {
            userId: session?.user?.id,
            userName: session?.user?.name,
            userEmail: session?.user?.email,
            userCurrency: "ZMW",
          },
        }),
      });

      // Handle non-JSON responses (like HTML error pages)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "The server returned an unexpected response format. This typically happens when the server is overloaded."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      // Parse the response to extract sources and displayImage if present
      const parsedResponse = parseModelResponse(data.response);

      const assistantMessage = {
        role: "model",
        content: parsedResponse.content,
        sources: parsedResponse.sources,
        displayImage: parsedResponse.displayImage,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [
        ...prev.map((msg) =>
          msg === userMessage ? { ...msg, status: "sent" } : msg
        ),
        assistantMessage,
      ]);
    } catch (error) {
      console.error("Error sending message:", error);

      // Create a friendly error message based on the error type
      let errorMessage = "An error occurred while processing your request.";

      if (error.message.includes("JSON")) {
        errorMessage =
          "The server is currently experiencing high load. Please try again in a moment or use a more specific question.";
      } else if (
        error.message.includes("504") ||
        error.message.includes("timeout")
      ) {
        errorMessage =
          "The request timed out. Please try again with a more specific question to reduce processing time.";
      }

      // Add an AI message that explains the error
      const errorResponseMessage = {
        role: "model",
        content: errorMessage,
        timestamp: new Date().toISOString(),
        isError: true,
      };

      setMessages((prev) => [
        ...prev.map((msg) =>
          msg === userMessage ? { ...msg, status: "error" } : msg
        ),
        errorResponseMessage,
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-white">
      {/* Background decoration */}
      <div className="absolute bg-white" />
      
      {messages.length === 0 ? (
        <div className="flex items-center  justify-center w-full h-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center space-y-6"
          >
            <motion.div
              className="relative"
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 relative">
                <span
                  className="bg-gradient-to-r from-slate-900 via-blue-700 to-slate-600 bg-clip-text text-transparent"
                  style={{
                    backgroundSize: "200% 100%",
                    animation: "shimmer 3s ease-in-out infinite",
                  }}
                >
                  What's on your mind?
                </span>
              </h1>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-lg text-slate-600 font-medium max-w-md mx-auto leading-relaxed inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"
            >
              Ask me anything, and I'll help you explore ideas with thoughtful responses.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="flex justify-center space-x-1"
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-blue-400 rounded-full"
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>
      ) : (
        <div className="flex flex-col  relative w-full h-full">
          {/* Messages container */}
          <div className="flex-1 overflow-y-auto bg-white pb-32 pt-8 chat-scroll">
            <div className="max-w-4xl mx-auto">
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    layout
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      transition: {
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        duration: 0.4,
                      }
                    }}
                    exit={{ 
                      opacity: 0, 
                      y: -20, 
                      scale: 0.95,
                      transition: { duration: 0.2 }
                    }}
                    className="mb-8"
                  >
                    <ChatMessage
                      message={message}
                      isUser={message.role === "user"}
                    />

                    {message.role === "user" && (
                      <motion.div 
                        className="flex items-center gap-2 mt-2 ml-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {message.status === "error" && (
                          <span className="text-xs text-red-500 flex items-center gap-1">
                            <motion.div
                              className="w-1.5 h-1.5 bg-red-500 rounded-full"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                            Failed to send {message.errorMsg}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="flex justify-start mb-8"
                  >
                    <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-3xl p-4 shadow-sm border border-slate-200/50">
                      <div className="flex gap-1.5">
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-2.5 h-2.5 bg-slate-400 rounded-full"
                            animate={{
                              y: [-4, 0, -4],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              delay: i * 0.15,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-slate-600 font-medium">Thinking...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* Input Container - Fixed to the bottom */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <div className="max-w-4xl mx-auto pb-4 lg:pb-6 bg-white">
          <motion.div 
            className="relative bg-white rounded-2xl shadow-lg border border-slate-200/80 overflow-hidden"
            whileHover={{ 
              shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              scale: 1.01,
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 opacity-50" />
            <div className="relative p-4">
              <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
            </div>
          </motion.div>
          
          <motion.p
            className="text-center text-xs text-slate-500 mt-3 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Quest Whisper AI can make mistakes. Verify important info.
          </motion.p>
        </div>
      </motion.div>
      
      {/* Shimmer keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}

export default Chat;
