"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useEffect, useRef, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";

export default function ChatSidebar({
  showSidebar,
  setShowSidebar,
  chatHistory,
  currentChatId,
  onNewChat,
  onLoadChat,
  onDeleteChat,
  pagination,
  isLoadingMore,
  onLoadMore,
}) {
  const { data: session } = useSession();

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/login" });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this conversation?")) {
      return;
    }

    try {
      const response = await fetch("/api/chat", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId }),
      });

      if (response.ok) {
        onDeleteChat(chatId);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  // Check window size and set default sidebar state
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile && showSidebar === true) {
        // Don't auto-collapse if user explicitly opened it
        return;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Infinite scrolling for chat history
  const chatHistoryRef = useRef(null);
  
  const handleScroll = useCallback(() => {
    if (!chatHistoryRef.current || !pagination?.hasMore || isLoadingMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatHistoryRef.current;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // Load when 100px from bottom
    
    if (isNearBottom) {
      onLoadMore();
    }
  }, [pagination?.hasMore, isLoadingMore, onLoadMore]);

  useEffect(() => {
    const chatHistoryElement = chatHistoryRef.current;
    if (chatHistoryElement) {
      let timeoutId;
      const debouncedScroll = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(handleScroll, 100);
      };
      
      chatHistoryElement.addEventListener('scroll', debouncedScroll);
      return () => {
        chatHistoryElement.removeEventListener('scroll', debouncedScroll);
        clearTimeout(timeoutId);
      };
    }
  }, [handleScroll]);

  const isMinimized = showSidebar === "minimized";
  const isFullyOpen = showSidebar === true;
  const isHidden = showSidebar === false;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobile && isFullyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        className={`${
          isMobile && isFullyOpen ? "fixed left-0 top-0 h-full z-50" : ""
        } bg-white dark:bg-[#181818] border-r border-gray-200 ${isMobile?"dark:border-0":"dark:border-[#3B3B3B]"} flex flex-col overflow-hidden shadow-lg transition-all duration-300 ease-out`}
        animate={{
          width: isHidden ? 0 : isMinimized ? 72 : 270,
          opacity: isHidden ? 0 : 1,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
      >
        {/* Minimized view */}
        {isMinimized && (
          <motion.div
            className="flex flex-col h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {/* Minimized header */}
            <div className="p-3 border-b border-gray-200 dark:border-[#3B3B3B]">
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-[54px] h-[54px]">
                  <Image
                    src="/whisper_logo.png"
                    alt="QuestWhisper"
                    fill
                    className="object-contain dark:collapse"
                  />

                  <Image
                    src="/whisper_logo_dark.png"
                    alt="QuestWhisper"
                    fill
                    className="object-contain collapse dark:visible"
                  />
                </div>

                <motion.button
                  onClick={onNewChat}
                  className="cursor-pointer p-2.5 bg-[#212124] dark:bg-[#212124] dark:hover:bg-[#3B3B3B] hover:bg-black text-white rounded-xl transition-all duration-200 hover:shadow-md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="New conversation"
                >
                  <PlusIcon className="w-4 h-4 stroke-2" />
                </motion.button>
              </div>
            </div>

            {/* Expand button and logout */}
            <div className="flex flex-col p-3 items-center gap-3">
              <motion.button
                onClick={() => setShowSidebar(true)}
                className="w-fit p-2.5 rounded-xl dark:hover:bg-[#3B3B3B] cursor-pointer transition-colors text-gray-600 hover:text-gray-800"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Expand sidebar"
              >
                <Image
                  src="/icons/expand_icon.png"
                  alt="Expand"
                  width={20}
                  height={20}
                  className="w-8 h-8 object-contain dark:invert"
                />
              </motion.button>

              <motion.button
                onClick={handleLogout}
                className="cursor-pointer p-2 rounded-lg hover:bg-red-50 dark:hover:bg-[#3B3B3B] transition-colors text-gray-600 hover:text-red-600 flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-7 h-7 dark:text-[#E1E8ED]" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Full view */}
        {isFullyOpen && (
          <motion.div
            className="flex flex-col h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {/* Sidebar header */}
            <div className="p-6 border-b border-gray-200 dark:border-[#3B3B3B] bg-white dark:bg-[#181818]">
              <div className="flex items-center justify-between mb-6">
                <div className="relative w-[54px] h-[54px]">
                  <Image
                    src="/whisper_logo.png"
                    alt="QuestWhisper"
                    fill
                    className="object-contain dark:collapse"
                  />

                  <Image
                    src="/whisper_logo_dark.png"
                    alt="QuestWhisper"
                    fill
                    className="object-contain collapse dark:visible"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <motion.button
                    onClick={() => setShowSidebar("minimized")}
                    className="cursor-pointer p-2 rounded-lg dark:hover:bg-[#3B3B3B] transition-colors text-gray-600 hover:text-gray-800"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Minimize sidebar"
                  >
                    <Image
                      src="/icons/minimize_icon.png"
                      alt="Minimize"
                      width={20}
                      height={20}
                      className="w-6 h-6 object-contain dark:invert"
                    />
                  </motion.button>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="cursor-pointer p-2 rounded-lg dark:hover:bg-[#3B3B3B] transition-colors text-gray-400 hover:text-gray-200 md:hidden"
                    title="Close sidebar"
                  >
                    <Image
                  src="/icons/close_icon.png"
                  alt="Close"
                  width={18}
                  height={18}
                  className="w-6 h-6 object-contain dark:invert"
                />
                  </button>
                </div>
              </div>

              <motion.button
                onClick={onNewChat}
                className="cursor-pointer w-full bg-[#212124] dark:bg-[#212124] dark:hover:bg-[#3B3B3B] hover:bg-black text-white rounded-full p-3 flex items-center gap-3 transition-all duration-200 hover:shadow-md"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <PlusIcon className="w-5 h-5 stroke-2" />
                <span className="font-medium">New conversation</span>
              </motion.button>
            </div>

            {/* Chat history */}
            <div ref={chatHistoryRef} className="flex-1 overflow-y-auto p-4">
              {chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <motion.div
                    className="p-4 bg-slate-100 dark:bg-[#3B3B3B] rounded-2xl mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      className="w-8 h-8 text-slate-400 dark:text-slate-200"
                      fill="currentColor"
                    >
                      <path
                        d="M14.5 13.5V5.41a1 1 0 0 0-.3-.7L9.8.29A1 1 0 0 0 9.08 0H1.5v13.5A2.5 2.5 0 0 0 4 16h8a2.5 2.5 0 0 0 2.5-2.5m-1.5 0v-7H8v-5H3v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1M9.5 5V2.12L12.38 5zM5.13 5h-.62v1.25h2.12V5zm-.62 3h7.12v1.25H4.5zm.62 3h-.62v1.25h7.12V11z"
                        clipRule="evenodd"
                        fillRule="evenodd"
                      />
                    </svg>
                  </motion.div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200  mb-2">
                    No conversations yet
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-48 leading-relaxed">
                    Start your first conversation to see your chat history here
                  </p>
                </div>
              ) : (
                <div className="space-y-[1px]">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Recent Conversations
                    </h2>
                    {pagination?.total > 0 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {chatHistory.length} of {pagination.total}
                      </span>
                    )}
                  </div>

                  {chatHistory.map((chat, index) => (
                    <motion.div
                      key={chat.id}
                      className={`group relative py-[5px] px-[10px] rounded-[60px] cursor-pointer transition-all duration-200 ${
                        currentChatId === chat.id
                          ? "bg-white dark:bg-[#3B3B3B] border border-blue-200 dark:border-[#3B3B3B]"
                          : "hover:bg-gray-50 dark:hover:bg-[#3B3B3B] border border-transparent"
                      }`}
                      onClick={() => onLoadChat(chat.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      layout
                    >
                      <div className="flex items-center justify-between text-center">
                        <div className="flex h-full min-w-0 mr-3 text-center">
                          <h3
                            className={`text-sm truncate ${
                              currentChatId === chat.id
                                ? "text-black dark:text-[#E1E8ED] font-bold"
                                : "text-gray-900 dark:text-[#E1E8ED] font-regular"
                            }`}
                          >
                            {chat.title}
                          </h3>
                        </div>

                        <motion.button
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-white transition-all duration-200 text-gray-400 hover:text-black"
                          title="Delete conversation"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Loading indicator for infinite scroll */}
                  {isLoadingMore && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-center py-4"
                    >
                      <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-xs">Loading more...</span>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* End of chat history indicator */}
                  {!pagination?.hasMore && chatHistory.length > 0 && pagination?.total > 25 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-4 text-xs text-gray-500 dark:text-gray-400"
                    >
                      You've reached the end of your conversations
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200  dark:border-[#3B3B3B] bg-white dark:bg-[#181818]">
              {/* User info and logout */}
              {session?.user && (
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {session.user.image && (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-[#E1E8ED] truncate">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-[#E1E8ED] truncate">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={handleLogout}
                    className="cursor-pointer p-2 rounded-lg hover:bg-red-50 dark:hover:bg-[#3B3B3B] transition-colors text-gray-600 hover:text-red-600 flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Logout"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5 dark:text-[#E1E8ED]" />
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
