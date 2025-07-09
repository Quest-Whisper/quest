/**
 * ReactMarkdown components for consistent message formatting
 */

import React from "react";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

// Custom components for ReactMarkdown
export const markdownComponents = {
  // Basic text components - return content directly for code
  p: ({ children }) => {
    // Check if the children contain a code block
    const hasCodeBlock = React.Children.toArray(children).some(
      (child) => React.isValidElement(child) && child.type === "code"
    );

    // If there's a code block, return children directly to avoid p > div nesting
    if (hasCodeBlock) {
      return children;
    }

    // Otherwise render as normal paragraph
    return <p className="mb-6 text-slate-700 leading-relaxed">{children}</p>;
  },

  // Link component with modern styling
  a: ({ node, children, href, ...props }) => {
    return (
      <a
        href={href}
        className="text-blue-600 mx-[5px] font-medium decoration-blue-300 underline-offset-2 decoration-[0.1em] hover:decoration-[0.15em] hover:text-blue-700 transition-all duration-200"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  },

  // Only handle fenced code blocks, ignore inline code
  code: ({ inline, children, className }) => {
    // If it's inline code, treat it as regular text by returning just the content
    if (inline) {
      const text = Array.isArray(children)
        ? children.join("")
        : String(children);
      return text;
    }

    // Only style actual code blocks (triple backticks)
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "text";
    const text = String(children).replace(/\n$/, "");

    return (
      <div className="my-6 rounded-xl overflow-hidden bg-[#edf6f9]">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[#66757F] text-sm capitalize">
            {language}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(text);
              toast.success("Code copied to clipboard!");
            }}
            className="flex gap-[5px] justify-center px-3 py-1.5 w-[100px] cursor-pointer text-xs rounded-md text-[#66757F] hover:bg-gray-100 transition-colors"
          >
            <ClipboardDocumentIcon className="w-4 h-4" />
            <span>Copy</span>
          </button>
        </div>
        <pre className="p-5 overflow-x-auto">
          <code className="text-[14px] text-black font-mono whitespace-pre-wrap">
            {text}
          </code>
        </pre>
      </div>
    );
  },

  // Remove the pre component since we handle code blocks in the code component
  pre: ({ children }) => children,

  // Basic structural components
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold mb-6 text-slate-800 leading-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-bold mt-8 mb-4 text-slate-800 leading-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[14px] font-bold mb-4 text-slate-700 leading-tight">
      {children}
    </h3>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-6 space-y-3 text-slate-700">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-6 space-y-3 text-slate-700">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed mb-2">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-300 pl-6 italic text-slate-600 my-6 bg-blue-50/70 py-4 rounded-r-lg shadow-sm">
      {children}
    </blockquote>
  ),

  // Basic table formatting
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-6">
      <table
        className="min-w-full border-collapse border border-slate-300 bg-white rounded-lg shadow-sm"
        {...props}
      />
    </div>
  ),
  thead: ({ node, ...props }) => <thead className="bg-slate-50" {...props} />,
  tbody: ({ node, ...props }) => <tbody {...props} />,
  tr: ({ node, ...props }) => (
    <tr
      className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors"
      {...props}
    />
  ),
  th: ({ node, ...props }) => (
    <th
      className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-r border-slate-200 last:border-r-0"
      {...props}
    />
  ),
  td: ({ node, ...props }) => (
    <td
      className="px-4 py-3 text-sm text-slate-700 border-r border-slate-200 last:border-r-0"
      {...props}
    />
  ),
}; 