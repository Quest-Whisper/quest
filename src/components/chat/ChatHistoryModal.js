'use client';
import { useState } from 'react';
import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/modal";
import { Button } from "@heroui/button";
import { XMarkIcon, ChatBubbleLeftRightIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatHistoryModal({ isOpen, onClose, conversations, onLoadConversation, onDeleteConversation }) {
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatContent = (content) => {
    if (!content) return '';
    // Truncate long messages
    return content.length > 100 ? `${content.substring(0, 100)}...` : content;
  };

  const handleLoadConversation = () => {
    if (selectedConvo) {
      onLoadConversation(selectedConvo, selectedIndex);
      onClose();
    }
  };

  const handleDeleteConversation = (index, e) => {
    e.stopPropagation(); // Prevent selecting the conversation
    onDeleteConversation(index);
    
    // If the currently selected conversation is deleted, reset selection
    if (selectedIndex === index) {
      setSelectedConvo(null);
      setSelectedIndex(null);
    }
  };

  const handleSelectConversation = (convo, index) => {
    setSelectedConvo(convo);
    setSelectedIndex(index);
  };

  return (
    <Modal
      isOpen={isOpen}
      size="xl"
      backdrop="blur"
      isDismissable={true}
      scrollBehavior="inside"
      onClose={onClose}
      hideCloseButton={true}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            y: -20,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        },
      }}
      classNames={{
        base: "bg-white border border-gray-200 shadow-md",
        header: "border-b border-gray-200",
        body: "p-0 overflow-hidden",
        backdrop: "backdrop-blur-sm",
        closeButton: "hover:bg-gray-100 active:bg-gray-200 rounded-full p-2",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="px-6 py-4 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Conversation History
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </ModalHeader>

            <ModalBody>
              <div className="h-[500px] overflow-y-auto">
                <div className="p-6">
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="p-4 bg-blue-50 rounded-full mb-4">
                        <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-500" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Conversation History</h4>
                      <p className="text-sm text-gray-500 max-w-md">
                        You don't have any saved conversations yet. Start chatting with the AI assistant to create history.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="text-base font-medium text-gray-700 mb-4">
                        Select a conversation to continue
                      </h4>
                      
                      <AnimatePresence>
                        {conversations.map((convo, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className={`border rounded-xl p-4 cursor-pointer transition-all group ${
                              selectedIndex === index 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                            onClick={() => handleSelectConversation(convo, index)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                Conversation {index + 1}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <ClockIcon className="h-3 w-3" />
                                  <span>{formatDate(convo[0]?.timestamp)}</span>
                                </div>
                                <motion.button
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="p-1 rounded hover:bg-red-100 group-hover:opacity-100 opacity-0 transition-opacity"
                                  onClick={(e) => handleDeleteConversation(index, e)}
                                  title="Delete conversation"
                                >
                                  <TrashIcon className="h-4 w-4 text-red-500" />
                                </motion.button>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              {convo.slice(0, 2).map((message, msgIndex) => (
                                <div key={msgIndex} className="flex gap-2">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    message.role === 'user' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {message.role === 'user' ? 'You' : 'AI'}
                                  </span>
                                  <p className="text-sm text-gray-700 flex-1 line-clamp-2">
                                    {formatContent(message.content)}
                                  </p>
                                </div>
                              ))}
                              
                              {convo.length > 2 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  + {convo.length - 2} more messages
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
                <Button
                  color="default"
                  variant="bordered"
                  onPress={onClose}
                  className="px-4 py-2 rounded-xl"
                >
                  Cancel
                </Button>
                
                <Button
                  color="primary"
                  onPress={handleLoadConversation}
                  isDisabled={!selectedConvo}
                  className={`px-4 py-2 rounded-xl ${
                    selectedConvo 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Continue Conversation
                </Button>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
} 