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
    <div className="flex h-[100vh] w-[100vw] justify-center items-center">
      {messages.length === 0 ? (
        <motion.h2
          className="text-[25px] font-regular mb-2 relative"
          style={{
            background: "linear-gradient(90deg, #f0f0f0, #888888, #f0f0f0)",
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          What's on your mind?
        </motion.h2>
      ) : (
        <div className="flex flex-col relative overflow-hidden w-[100%] h-[100%]">
          {/* Messages scrollable area */}
          <div className="overflow-y-auto w-[100%] h-[100%] pb-24 justify-center items-center">
            <div className="flex flex-col p-4 lg:p-6 space-y-6 max-w-[1080px] mx-auto">
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChatMessage
                      message={message}
                      isUser={message.role === "user"}
                    />

                    {message.role === "user" && (
                      <div className="flex items-center gap-1 mt-1 ml-2">
                        {message.status === "error" && (
                          <span className="text-xs text-red-500">
                            Failed to send {message.errorMsg}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4">
                      <div className="flex gap-1">
                        <div
                          className="w-2 h-2 bg-gray-700 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="w-2 h-2 bg-gray-700 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <div
                          className="w-2 h-2 bg-gray-700 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
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
        <div className="flex flex-col absolute bottom-[0px] left-[10px] right-[10px] w-[100%] justify-center items-center bg-white mx-auto  px-[10px]">
            <div className=" p-[10px] border-[1px] bg-white border-gray-300 shadow-sm max-w-[1020px] rounded-[20px] w-[100%]">
              <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
            </div>
            <span className="text-center w-full m-[15px] text-[12px] text-gray-500">
              Axe AI can make mistakes. Verify important info.
            </span>
          </div>
    </div>
  );
}

export default Chat;
