"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

export default function Sources({ sources, isStreaming }) {
  if (!sources || sources.length === 0 || isStreaming) {
    return null;
  }

  return (
    <motion.div
      className="mt-6 pt-4 border-t border-slate-200"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">
        Sources
      </p>
      <div className="grid grid-cols-1 gap-3">
        {sources.map((source, index) => (
          <motion.a
            key={index}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200 group/source"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            {source.image && (
              <div className="flex-shrink-0 w-16 h-16 overflow-hidden rounded-lg">
                <img
                  src={source.image}
                  alt={source.title}
                  className="w-full h-full object-cover group-hover/source:scale-105 transition-transform duration-200"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 line-clamp-2 group-hover/source:text-blue-700 transition-colors">
                {source.title}
              </p>
              <div className="flex items-center text-xs text-blue-600 mt-2 group-hover/source:text-blue-700">
                <span className="truncate font-medium">
                  Visit source
                </span>
                <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1 group-hover/source:translate-x-0.5 group-hover/source:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
} 