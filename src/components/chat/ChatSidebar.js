'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  TrashIcon,
  XMarkIcon,
  Bars3Icon
} from "@heroicons/react/24/outline";
import Image from 'next/image';
import { useEffect } from 'react';


export default function ChatSidebar({ 
  showSidebar, 
  setShowSidebar, 
  chatHistory, 
  currentChatId, 
  onNewChat, 
  onLoadChat, 
  onDeleteChat 
}) {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId }),
      });

      if (response.ok) {
        onDeleteChat(chatId);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
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
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMinimized = showSidebar === 'minimized';
  const isFullyOpen = showSidebar === true;
  const isHidden = showSidebar === false;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

 

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
          isMobile && isFullyOpen 
            ? 'fixed left-0 top-0 h-full z-50' 
            : ''
        } bg-white border-r border-gray-200 flex flex-col overflow-hidden shadow-lg transition-all duration-300 ease-out`}
        animate={{
          width: isHidden ? 0 : isMinimized ? 72 : 290,
          opacity: isHidden ? 0 : 1
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
            <div className="p-3 border-b border-gray-100">
              <div className="flex flex-col items-center gap-3">
              <Image 
                      src="/logo.png" 
                      alt="QuestWhisper" 
                      width={54} 
                      height={54} 
                      className="object-contain border border-black rounded-full"
                    /> 
                
                <motion.button
                  onClick={onNewChat}
                  className="p-2.5 bg-gray-900 hover:bg-black text-white rounded-xl transition-all duration-200 hover:shadow-md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="New conversation"
                >
                  <PlusIcon className="w-4 h-4 stroke-2" />
                </motion.button>
              </div>
            </div>

            {/* Expand button */}
            <div className="flex p-3 border-t border-gray-100 justify-center">
              <motion.button
                onClick={() => setShowSidebar(true)}
                className="w-fit p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Expand sidebar"
              >
                <Image 
                  src="/icons/expand_icon.png" 
                  alt="Expand" 
                  width={20} 
                  height={20} 
                  className="w-8 h-8 object-contain"
                />
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
            <div className="p-6 border-b border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
               
                    <Image 
                      src="/logo.png" 
                      alt="QuestWhisper" 
                      width={54} 
                      height={54} 
                      className="object-contain border border-black rounded-full"
                    /> 
                </div>
                <div className="flex items-center gap-1">
                  <motion.button
                    onClick={() => setShowSidebar('minimized')}
                    className="p-2 rounded-lg hover:bg-white/60 transition-colors text-gray-600 hover:text-gray-800"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Minimize sidebar"
                  >
                    <Image 
                      src="/icons/minimize_icon.png" 
                      alt="Minimize" 
                      width={20} 
                      height={20} 
                      className="w-6 h-6 object-contain"
                    />
                  </motion.button>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-2 rounded-lg hover:bg-white/60 transition-colors text-gray-600 hover:text-gray-800 md:hidden"
                    title="Close sidebar"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <motion.button
                onClick={onNewChat}
                className="w-full bg-gray-900 hover:bg-black text-white rounded-full p-3 flex items-center gap-3 transition-all duration-200 hover:shadow-md"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <PlusIcon className="w-5 h-5 stroke-2" />
                <span className="font-medium">New conversation</span>
              </motion.button>
            </div>

            {/* Chat history */}
            <div className="flex-1 overflow-y-auto p-4">
              {chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <motion.div
                    className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <svg 
                      viewBox="0 0 16 16" 
                      className="w-8 h-8 text-gray-400"
                      fill="currentColor"
                    >
                      <path d="M14.5 13.5V5.41a1 1 0 0 0-.3-.7L9.8.29A1 1 0 0 0 9.08 0H1.5v13.5A2.5 2.5 0 0 0 4 16h8a2.5 2.5 0 0 0 2.5-2.5m-1.5 0v-7H8v-5H3v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1M9.5 5V2.12L12.38 5zM5.13 5h-.62v1.25h2.12V5zm-.62 3h7.12v1.25H4.5zm.62 3h-.62v1.25h7.12V11z" clipRule="evenodd" fillRule="evenodd"/>
                    </svg>
                  </motion.div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No conversations yet</h3>
                  <p className="text-sm text-gray-500 max-w-48 leading-relaxed">
                    Start your first conversation to see your chat history here
                  </p>
                </div>
              ) : (
                <div className="space-y-[1px]">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
                    Recent Conversations
                  </h2>
                  
                  {chatHistory.map((chat, index) => (
                    <motion.div
                      key={chat.id}
                      className={`group relative py-[5px] px-[10px] rounded-full cursor-pointer transition-all duration-200 ${
                        currentChatId === chat.id 
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200' 
                          : 'hover:bg-gray-50 border border-transparent'
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
                          <h3 className={`text-sm truncate ${
                            currentChatId === chat.id ? 'text-black font-bold' : 'text-gray-900 font-regular'
                          }`}>
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

                      {/* Hover effect overlay */}
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"
                        style={{ display: currentChatId === chat.id ? 'none' : 'block' }}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-gray-100/50">
              <div className="text-center">
                <p className="text-xs text-gray-500 font-medium">
                  Powered by QuestWhisper AI
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
} 