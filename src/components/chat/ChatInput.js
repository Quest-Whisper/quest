"use client";
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { motion } from "framer-motion";
import { ArrowUpIcon } from "@heroicons/react/24/solid";

export default function ChatInput({ onSend, isLoading }) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full h-full mx-auto">
      <div className="flex flex-col">
        <div className="relative justify-center">
          <TextareaAutosize
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (message.trim() && !isLoading) {
                  handleSubmit(e);
                }
              }
            }}
            placeholder="Write anything..."
            maxRows={10}
            className="w-full resize-none rounded-xl bg-white px-4 pr-12 text-sm focus:outline-none min-h-[46px]"
            disabled={isLoading}
          />

          <motion.button
            type="submit"
            disabled={isLoading || !message.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`absolute right-2 bottom-2.5 p-2 rounded-full ${
              isLoading || !message.trim()
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
            } transition-colors duration-200`}
          >
            <ArrowUpIcon className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </form>
  );
}
