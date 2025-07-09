"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatInput from "../../components/chat/ChatInput";
import { useSession } from "next-auth/react";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { Bars3Icon } from "@heroicons/react/24/outline";
import Image from "next/image";
import LiveVoiceChat from "@/components/chat/LiveChat";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  // Initialize sidebar state based on screen size
  const [showSidebar, setShowSidebar] = useState(null); // null means not initialized
  const [isMobile, setIsMobile] = useState(false);
  const { data: session, status } = useSession();
  const messagesEndRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize sidebar state and mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On mobile: default to hidden, on desktop/tablet: default to expanded
      setShowSidebar(mobile ? false : true);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  // Load chat history on mount
  useEffect(() => {
    if (session?.user?.id) {
      loadChatHistory();
    }
  }, [session]);

  // Check for chat ID in URL parameters
  useEffect(() => {
    const chatId = searchParams.get("id");
    if (chatId && chatHistory.length > 0) {
      loadChat(chatId);
    }
  }, [searchParams, chatHistory]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch("/api/chat");
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.chats || []);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  const loadChat = (chatId) => {
    const chat = chatHistory.find((c) => c.id === chatId);
    if (chat) {
      // Process messages to ensure proper format for image generation messages
      const processedMessages = chat.messages.map(msg => {
        // Ensure image generation messages have the proper flag
        if (msg.isImageGeneration) {
          return {
            ...msg,
            isImageGeneration: true,
            // Ensure attachments are properly formatted
            attachments: msg.attachments?.map(att => ({
              ...att,
              isGenerated: att.isGenerated || false,
              prompt: att.prompt || msg.content
            })) || null
          };
        }
        return msg;
      });
      
      setMessages(processedMessages);
      setCurrentChatId(chatId);
      // Update URL without triggering navigation
      window.history.replaceState({}, "", `/chat?id=${chatId}`);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    window.history.replaceState({}, "", "/chat");
  };

  const handleDeleteChat = (chatId) => {
    // Remove from local state
    setChatHistory((prev) => prev.filter((c) => c.id !== chatId));

    // If currently viewing this chat, start a new one
    if (currentChatId === chatId) {
      startNewChat();
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

  const handleResendLastMessage = async () => {
    // Find the last user message in the conversation
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((msg) => msg.role === "user");

    if (lastUserMessage) {
      // Remove the error message (last AI message) but keep the user message
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (
          lastMessage?.role === "model" &&
          lastMessage?.content?.trim() ===
            "I apologize, but I couldn't process your request. Please try again."
        ) {
          return prev.slice(0, -1);
        }
        return prev;
      });

      setIsLoading(true);
      setIsTyping(true);

      try {
        // Try streaming first for retry as well
        const success = await handleStreamingMessage(lastUserMessage.content, lastUserMessage);
        if (!success) {
          // Fallback to non-streaming for retry
          await handleNonStreamingMessageForRetry(lastUserMessage);
        }
      } catch (error) {
        console.error("Error retrying message:", error);
        await handleMessageError(error, lastUserMessage);
      } finally {
        setIsLoading(false);
        setIsTyping(false);
      }
    }
  };

  const handleNonStreamingMessageForRetry = async (lastUserMessage) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages
          .filter(
            (msg) =>
              !(
                msg.role === "model" &&
                msg.content?.trim() ===
                  "I apologize, but I couldn't process your request. Please try again."
              )
          )
          .map(({ role, content, user, attachment }) => ({
            role,
            content,
            user,
            attachment,
          })),
        context: {
          userId: session?.user?.id,
          userName: session?.user?.name,
          userEmail: session?.user?.email,
          userCurrency: "ZMW",
        },
        chatId: currentChatId,
      }),
    });

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

    setMessages((prev) => [...prev, assistantMessage]);

    // Update chat ID if this was a new chat
    if (data.isNewChat && data.chatId) {
      setCurrentChatId(data.chatId);
      window.history.replaceState({}, "", `/chat?id=${data.chatId}`);
      // Reload chat history to include the new chat
      loadChatHistory();
    }
  };

  const handleChatUpdate = (chatId, isNewChat) => {
    if (isNewChat && chatId && !currentChatId) {
      setCurrentChatId(chatId);
      // Update the URL with the new chat ID
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', `/chat?id=${chatId}`);
      }
      // Reload chat history to show the new chat in the sidebar
      loadChatHistory();
    }
  };

  const handleSendMessage = async (messageData) => {
    // Handle both old string format and new object format for backward compatibility
    const content = typeof messageData === 'string' ? messageData : messageData.text;
    const attachments = typeof messageData === 'object' ? messageData.attachments : null;
    const isImageGeneration = typeof messageData === 'object' ? messageData.isImageGeneration : false;
    
    // Create the user message
    const userMessage = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
      status: "sending",
      user: {
        name: session?.user?.name,
        email: session?.user?.email,
      },
      attachments: attachments || null
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      if (isImageGeneration) {
        // For image generation, create an AI message that will trigger the image generation
        const aiMessage = {
          role: "model",
          content: content,
          timestamp: new Date().toISOString(),
          status: "complete",
          isImageGeneration: true,
          user: {
            name: session?.user?.name,
            email: session?.user?.email,
          },
          userId: session?.user?.id,
          // Add a placeholder for attachments that will be updated when generation is complete
          attachments: []
        };
        
        // Try streaming first
        const success = await handleStreamingMessage(content, userMessage);
        if (!success) {
          // Fallback to non-streaming
          await handleNonStreamingMessage(content, userMessage);
        }
        
        // Mark user message as sent
        setMessages((prev) => 
          prev.map((msg) =>
            msg === userMessage ? { ...msg, status: "sent" } : msg
          )
        );
      } else {
        // Try streaming first
        const success = await handleStreamingMessage(content, userMessage);
        if (!success) {
          // Fallback to non-streaming
          await handleNonStreamingMessage(content, userMessage);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      await handleMessageError(error, userMessage);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleStreamingMessage = async (content, userMessage) => {
    try {
      // Log the messages being sent to API
      console.log('Sending messages to API:', [...messages, userMessage]);
      console.log('Current chatId being sent:', currentChatId);

      const response = await fetch("/api/chat?stream=true", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(
            ({ role, content, user, attachments }) => ({
              role,
              content,
              user,
              attachments,
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      let streamedContent = "";
      let imageGenerationResult = null;

      // Mark user message as sent
      setMessages((prev) => 
        prev.map((msg) =>
          msg === userMessage ? { ...msg, status: "sent" } : msg
        )
      );

      // Add initial assistant message with unique ID for tracking
      const assistantMessageId = `streaming-${Date.now()}`;
      const initialAssistantMessage = {
        id: assistantMessageId,
        role: "model",
        content: "",
        timestamp: new Date().toISOString(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, initialAssistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            console.log('Received streaming data:', data);
            
            if (data.type === 'content') {
              streamedContent += data.content;
              
              // Update the streaming message using the ID
              setMessages((prev) => 
                prev.map((msg) => 
                  msg.id === assistantMessageId
                    ? { ...msg, content: streamedContent }
                    : msg
                )
              );
            } else if (data.type === 'image_generation') {
              // Store image generation result
              imageGenerationResult = data.result;
            } else if (data.type === 'done') {
              console.log('Received done event:', data);
              
              // Finalize the message
              setMessages((prev) => 
                prev.map((msg) => 
                  msg.id === assistantMessageId
                    ? { 
                        ...msg, 
                        content: data.fullContent || streamedContent,
                        isStreaming: false,
                        // Add image generation data if available
                        ...(imageGenerationResult && {
                          attachments: [{
                            url: imageGenerationResult.url,
                            type: imageGenerationResult.type,
                            displayName: imageGenerationResult.displayName,
                            size: imageGenerationResult.size,
                            category: imageGenerationResult.category,
                            isGenerated: imageGenerationResult.isGenerated,
                            prompt: imageGenerationResult.prompt
                          }],
                          isImageGeneration: true,
                          imageDescription: imageGenerationResult.description
                        })
                      }
                    : msg
                )
              );

              // Update chat ID if this was a new chat
              if (data.isNewChat && data.chatId) {
                console.log('Setting new chatId:', data.chatId);
                setCurrentChatId(data.chatId);
                window.history.replaceState({}, "", `/chat?id=${data.chatId}`);
                loadChatHistory();
              } else {
                console.log('Not updating chatId - isNewChat:', data.isNewChat, 'chatId:', data.chatId);
              }
              
              setIsLoading(false);
              setIsTyping(false);
              return true; // Success
            } else if (data.type === 'error') {
              throw new Error(data.error || 'Streaming error');
            }
          } catch (parseError) {
            console.warn("Failed to parse streaming chunk:", parseError);
            // Continue processing other chunks
          }
        }
      }

      return true; // Success
    } catch (error) {
      console.error("Streaming error:", error);
      return false; // Failed, should fallback
    }
  };

  const handleNonStreamingMessage = async (content, userMessage, image) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
              body: JSON.stringify({
          messages: [...messages, userMessage].map(
            ({ role, content, user, attachments }) => ({
              role,
              content,
              user,
              attachments,
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
      console.log('Setting new chatId (non-streaming):', data.chatId);
      setCurrentChatId(data.chatId);
      window.history.replaceState({}, "", `/chat?id=${data.chatId}`);
      loadChatHistory();
    }
  };

  const handleMessageError = async (error, userMessage) => {
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
  };

  const handleVoiceMode = async () => {
    setIsVoiceMode(true);
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

  return (
    <div>
      {isVoiceMode ? (
        <LiveVoiceChat onClose={() => setIsVoiceMode(false)} />
      ) : (
        <div
          className={`
      flex bg-gray-50 overflow-hidden
      ${isMobile ? "h-[100dvh]" : "h-screen"}
    `}
        >
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
          <div className="flex-1 flex flex-col relative bg-white h-full">
            {/* Top bar */}
            <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm p-4 flex items-center justify-between sticky top-0 z-30 shrink-0">
              <div className="flex items-center gap-3">
                {(showSidebar === false ||
                  (isMobile && showSidebar !== true)) && (
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors group"
                    title="Show sidebar"
                  >
                    <Image
                      src="/icons/menu_icon.png"
                      alt="Expand sidebar"
                      width={20}
                      height={20}
                      className="w-5 h-5 object-contain"
                    />
                  </button>
                )}
                {showSidebar === "minimized" && !isMobile && (
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
                    {currentChatId
                      ? chatHistory.find((c) => c.id === currentChatId)
                          ?.title || "Chat"
                      : "New Chat"}
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
                    <h1 className="text-[26px] md:text-[36px] lg:text-[52px] font-bold mb-4 relative">
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
                    className="text-[16px] text-slate-600 font-medium max-w-md mx-auto leading-relaxed"
                  >
                    Ask me anything, and I'll help you explore ideas with
                    thoughtful responses.
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
              <div className="flex-1 overflow-y-auto bg-white chat-scroll relative">
                <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
                  <AnimatePresence mode="popLayout">
                    {messages.map((message, index) => {
                      const isLastMessage = index === messages.length - 1;
                      const isStreamingMessage = message.isStreaming;
                      
                      return (
                        <motion.div
                          key={message.id || index}
                          layout={!isStreamingMessage} // Disable layout animation for streaming messages
                          initial={{ opacity: 0, y: 30, scale: 0.95 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            transition: {
                              type: isStreamingMessage ? "tween" : "spring",
                              stiffness: isStreamingMessage ? undefined : 500,
                              damping: isStreamingMessage ? undefined : 30,
                              duration: isStreamingMessage ? 0.2 : 0.4,
                            },
                          }}
                          exit={{
                            opacity: 0,
                            y: -20,
                            scale: 0.95,
                            transition: { duration: 0.2 },
                          }}
                          className="mb-8"
                        >
                          <ChatMessage
                            message={{...message, chatId: currentChatId}}
                            isUser={message.role === "user"}
                            onResendLastMessage={handleResendLastMessage}
                            onChatUpdate={handleChatUpdate}
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
                      );
                    })}
                  </AnimatePresence>

                  {/* Only show typing indicator if not streaming and isTyping is true */}
                  {isTyping && !messages.some(msg => msg.isStreaming) && (
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
                            <div
                              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-sm">I'm thinking...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Extra space for mobile keyboard */}
                  <div className={`${isMobile ? "h-32" : "h-16"}`} />
                </div>
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Chat input at bottom - Mobile optimized */}
            <div
              className={`
          bg-white/95 backdrop-blur-sm shrink-0
          ${isMobile ? "sticky bottom-0 pb-safe-area-inset-bottom" : "relative"}
        `}
            >
              <div className="max-w-4xl mx-auto pb-4 px-4">
                <ChatInput
                  onSend={handleSendMessage}
                  onVoiceMode={handleVoiceMode}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
