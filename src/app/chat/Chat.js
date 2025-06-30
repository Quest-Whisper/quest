"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatInput from "../../components/chat/ChatInput";
import { useSession } from "next-auth/react";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { Bars3Icon } from "@heroicons/react/24/outline";
import Image from 'next/image';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  // Initialize sidebar state based on screen size
  const [showSidebar, setShowSidebar] = useState(null); // null means not initialized
  const { data: session, status } = useSession();
  const messagesEndRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize sidebar state based on screen size
  useEffect(() => {
    const initializeSidebar = () => {
      const isMobile = window.innerWidth < 768;
      // On mobile: default to hidden, on desktop/tablet: default to expanded
      setShowSidebar(isMobile ? false : true);
    };

    initializeSidebar();
    window.addEventListener('resize', initializeSidebar);
    return () => window.removeEventListener('resize', initializeSidebar);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    if (session?.user?.id) {
      loadChatHistory();
    }
  }, [session]);

  // Check for chat ID in URL parameters
  useEffect(() => {
    const chatId = searchParams.get('id');
    if (chatId && chatHistory.length > 0) {
      loadChat(chatId);
    }
  }, [searchParams, chatHistory]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch('/api/chat');
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.chats || []);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const loadChat = (chatId) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      setCurrentChatId(chatId);
      // Update URL without triggering navigation
      window.history.replaceState({}, '', `/chat?id=${chatId}`);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    window.history.replaceState({}, '', '/chat');
  };

  const handleDeleteChat = (chatId) => {
    // Remove from local state
    setChatHistory(prev => prev.filter(c => c.id !== chatId));
    
    // If currently viewing this chat, start a new one
    if (currentChatId === chatId) {
      startNewChat();
    }
  };

  const handleToggleSidebar = () => {
    const isMobile = window.innerWidth < 768;
    
    if (showSidebar === false) {
      setShowSidebar(isMobile ? true : 'minimized'); // Show full on mobile, minimized on desktop
    } else if (showSidebar === 'minimized') {
      setShowSidebar(true); // Expand to full
    } else {
      setShowSidebar(isMobile ? false : 'minimized'); // Hide on mobile, minimize on desktop
    }
  };

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
          chatId: currentChatId,
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

      // Update chat ID if this was a new chat
      if (data.isNewChat && data.chatId) {
        setCurrentChatId(data.chatId);
        window.history.replaceState({}, '', `/chat?id=${data.chatId}`);
        // Reload chat history to include the new chat
        loadChatHistory();
      }
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

  if (status === "loading" || showSidebar === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 text-sm">Loading QuestWhisper...</p>
        </div>
      </div>
    );
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Component */}
      <ChatSidebar
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        onNewChat={startNewChat}
        onLoadChat={loadChat}
        onDeleteChat={handleDeleteChat}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col relative bg-white">
        {/* Top bar */}
        <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {(showSidebar === false || (isMobile && showSidebar !== true)) && (
              <button
                onClick={() => setShowSidebar(true)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors group"
                title="Show sidebar"
              >
                <Bars3Icon className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
              </button>
            )}
            {showSidebar === 'minimized' && !isMobile && (
              <button
                onClick={() => setShowSidebar(true)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors group"
                title="Expand sidebar"
              >
                                 <Image 
                   src="/icons/expand_icon.png" 
                   alt="Expand sidebar" 
                   width={20} 
                   height={20} 
                   className="w-5 h-5 object-contain opacity-60 group-hover:opacity-80"
                 />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h2 className="text-lg font-semibold text-gray-800">
                {currentChatId ? 
                  chatHistory.find(c => c.id === currentChatId)?.title || 'Chat' : 
                  'New Chat'
                }
              </h2>
            </div>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="flex items-center justify-center flex-1 p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center space-y-6 max-w-2xl mx-auto"
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
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 relative">
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
                className="text-lg text-slate-600 font-medium max-w-md mx-auto leading-relaxed"
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
          <div className="flex-1 overflow-y-auto bg-white pb-32 pt-8 chat-scroll">
            <div className="max-w-4xl mx-auto px-4">
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
                      <div className="flex items-center gap-1 mt-1 ml-2">
                        {message.status === "error" && (
                          <span className="text-xs text-red-500">
                            Failed to send
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-8"
                >
                  <div className="max-w-4xl mx-auto px-4 py-2">
                    <div className="flex items-center space-x-2 text-slate-500">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Chat input at bottom */}
        <div className="bg-white/90">
          <div className="max-w-4xl mx-auto mb-[20px]">
            <ChatInput
              onSend={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
