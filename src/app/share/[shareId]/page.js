"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import toast from "react-hot-toast";
import Image from "next/image";

export default function SharePage() {
  const { shareId } = useParams();
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (shareId) {
      fetchSharedContent();
    }
  }, [shareId]);

  const fetchSharedContent = async () => {
    try {
      const response = await fetch(`/api/share?id=${shareId}`);
      const result = await response.json();

      if (result.success) {
        setShareData(result.data);
      } else {
        setError(result.error || "Content not found");
      }
    } catch (err) {
      setError("Failed to load shared content");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareData.content);
      toast.success("Content copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy content");
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Share link copied!");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  // Custom components for ReactMarkdown
  const components = {
    h1: ({ node, ...props }) => (
      <h1
        className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-200 leading-tight"
        {...props}
      />
    ),
    h2: ({ node, ...props }) => (
      <h2
        className="text-xl font-bold mt-8 mb-4 text-slate-800 dark:text-slate-200 leading-tight"
        {...props}
      />
    ),
    h3: ({ node, ...props }) => (
      <h3
        className="text-lg font-bold mb-4 text-slate-700 dark:text-slate-300 leading-tight"
        {...props}
      />
    ),
    p: ({ node, ...props }) => (
      <p
        className="mb-4 text-slate-700 dark:text-slate-300 leading-relaxed"
        {...props}
      />
    ),
    ul: ({ node, ...props }) => (
      <ul
        className="list-disc pl-6 mb-4 space-y-2 text-slate-700 dark:text-slate-300"
        {...props}
      />
    ),
    ol: ({ node, ...props }) => (
      <ol
        className="list-decimal pl-6 mb-4 space-y-2 text-slate-700 dark:text-slate-300"
        {...props}
      />
    ),
    li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
    blockquote: ({ node, ...props }) => (
      <blockquote
        className="border-l-4 border-blue-200 pl-4 italic text-slate-600 dark:text-slate-300 my-4 bg-blue-50/50 py-2 rounded-r-lg"
        {...props}
      />
    ),
    code: ({ node, inline, ...props }) =>
      inline ? (
        <code
          className="bg-slate-100 text-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded text-sm font-mono"
          {...props}
        />
      ) : (
        <code
          className="block bg-slate-900 text-slate-100 p-4 rounded-lg text-sm font-mono overflow-x-auto"
          {...props}
        />
      ),
    pre: ({ node, ...props }) => (
      <pre
        className="bg-slate-900 rounded-lg overflow-hidden my-4"
        {...props}
      />
    ),
    strong: ({ node, ...props }) => (
      <strong
        className="font-semibold text-slate-800 dark:text-slate-400"
        {...props}
      />
    ),
    em: ({ node, ...props }) => (
      <em className="italic text-slate-700 dark:text-slate-200" {...props} />
    ),
    a: ({ node, ...props }) => (
      <a
        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 underline underline-offset-2 transition-colors"
        {...props}
      />
    ),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#181818] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4f7269] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-300">Loading shared content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#181818] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">
            Content Not Found
          </h1>
          <p className="text-gray-600 dark:text-slate-400 mb-6">{error}</p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-[#4f7269] text-white rounded-lg hover:bg-[#3f5a51] transition-colors"
          >
            Go to QuestWhisper
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#181818]">
      {/* Header */}
      <header className="bg-white dark:bg-[#181818] border-b border-gray-200 dark:border-[#3B3B3B] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative w-[35px] h-[35px]">
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
              <div>
                <h1 className="text-lg font-semibold text-[#4f7269]">
                  QuestWhisper
                </h1>
                <p className="text-sm text-slate-700 dark:text-slate-400">
                  Shared AI Response
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-gray-100 dark:bg-[#3B3B3B] hover:bg-gray-200 dark:hover:bg-[#3B3B3B]/50 rounded-lg transition-colors"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
                Copy
              </button>
              <button
                onClick={copyShareLink}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-[#4f7269] text-white hover:bg-[#3f5a51] rounded-lg transition-colors"
              >
                Share Link
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-200 dark:border-[#3B3B3B] overflow-hidden"
        >
          {/* Metadata Header */}
          <div className="bg-gradient-to-r from-[#4f7269]/5 to-[#4f7269]/10 px-6 py-4 border-b border-gray-200 dark:border-[#3B3B3B]">
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <UserIcon className="h-4 w-4" />
                  <span>Shared by {shareData.sharedBy.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {new Date(shareData.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <EyeIcon className="h-4 w-4" />
                  <span>{shareData.views} views</span>
                </div>
              </div>
            </div>
          </div>

          {/* Display Image if available */}
          {shareData.displayImage && (
            <div className="px-6 pt-6">
              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <img
                  src={shareData.displayImage}
                  className="rounded-xl max-h-80 w-auto object-cover shadow-md"
                  alt="Shared content image"
                />
              </motion.div>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-6">
            <motion.article
              className="text-[16px] leading-relaxed text-slate-800 dark:text-slate-400 prose prose-slate max-w-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={components}
              >
                {shareData.content}
              </ReactMarkdown>
            </motion.article>

            {/* Sources */}
            {shareData.sources && shareData.sources.length > 0 && (
              <motion.div
                className="mt-8 pt-6 border-t border-slate-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-xs font-semibold text-slate-600 mb-4 uppercase tracking-wide">
                  Sources
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {shareData.sources.map((source, index) => (
                    <motion.a
                      key={index}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200 group"
                      whileHover={{ scale: 1.01 }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      {source.image && (
                        <div className="flex-shrink-0 w-16 h-16 overflow-hidden rounded-lg">
                          <img
                            src={source.image}
                            alt={source.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 line-clamp-2 group-hover:text-blue-700 transition-colors">
                          {source.title}
                        </p>
                        <div className="flex items-center text-xs text-blue-600 mt-2 group-hover:text-blue-700">
                          <span className="truncate font-medium">
                            Visit source
                          </span>
                          <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-200 dark:border-[#3B3B3B] p-8">
            <h2 className="text-2xl font-bold text-gray-700 dark:text-slate-200 mb-3">
              Experience QuestWhisper AI
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto">
              Get intelligent responses like this one. Start your conversation
              with AI that connects to your entire digital world.
            </p>
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 bg-[#4f7269] text-white font-medium rounded-lg hover:bg-[#3f5a51] transition-colors"
            >
              Try QuestWhisper Free
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
