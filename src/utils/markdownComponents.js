/**
 * ReactMarkdown components for consistent message formatting
 */

import React from "react";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

// Custom components for ReactMarkdown
export const markdownComponents = {
  // Basic text components - handle code blocks separately from paragraphs
  p: ({ children }) => {
    return <p className="text-[16px] mb-6 text-slate-700 dark:text-slate-200 leading-relaxed">{children}</p>
  },

  // Handle both inline and block code
  code({inline, className, children}) {
    const langMatch = /language-(\w+)/.exec(className);
    if (inline || !langMatch) {
      return (
        <code className="bg-slate-100 dark:bg-slate-700/50 rounded px-1.5 py-0.5 text-sm font-mono">
          {children}
        </code>
      );
    }

    // Otherwise it’s a fenced code block
    const language = langMatch[1];
    const text = String(children).replace(/\n$/, "");

    return (
      <span className="block my-6 rounded-xl overflow-hidden bg-[#282828] dark:bg-[#3B3B3B]/60">
        <span className="block relative">
          <span className="flex items-center justify-between px-4 py-3 bg-[#282828] dark:bg-[#3B3B3B]/80">
            <span className="text-slate-200 text-sm capitalize font-bold">
              {language}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(text);
                toast.success("Code copied to clipboard!");
              }}
              className="flex gap-[5px] justify-center px-3 py-1.5 w-[100px] cursor-pointer text-xs rounded-md text-slate-200 hover:bg-gray-100/10 transition-colors"
            >
              <ClipboardDocumentIcon className="w-4 h-4" />
              <span>Copy</span>
            </button>
          </span>
          <span className="block p-5 overflow-x-auto bg-[#282828]">
            <SyntaxHighlighter
              language={language}
              style={atomOneDark}
              PreTag="span"
              CodeTag="span"
              customStyle={{ background: "transparent", padding: 0, margin: 0, display: "block" }}
            >
              {text}
            </SyntaxHighlighter>
          </span>
        </span>
      </span>
    );
  },
  
  // Rest of the components remain unchanged
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

  h1: ({ children }) => (
    <h1 className="text-[32px] font-bold mb-6 text-slate-800 dark:text-slate-100 leading-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[24px] font-medium mt-8 mb-4 text-slate-800 dark:text-slate-100 leading-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[20px] font-medium mb-4 text-slate-700 dark:text-slate-200 leading-tight">
      {children}
    </h3>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-6 space-y-3 text-slate-700 dark:text-slate-200">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-6 space-y-3 text-slate-700 dark:text-slate-200">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed mb-2">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-300 pl-6 italic text-slate-600 my-6 bg-blue-50/70 dark:bg-[#3B3B3B]/90 py-4 rounded-r-lg">
      {children}
    </blockquote>
  ),

  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-6">
      <table
        className="min-w-full border-collapse border border-slate-300 dark:border-[#212124] bg-white dark:bg-[#3B3B3B]/60 rounded-lg shadow-sm"
        {...props}
      />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-slate-5 dark:bg-[#3B3B3B]/90" {...props} />
  ),
  tbody: ({ node, ...props }) => <tbody {...props} />,
  tr: ({ node, ...props }) => (
    <tr
      className="border-b border-slate-200 dark:border-[#212124] hover:bg-slate-100 dark:hover:bg-slate-50/10 transition-colors"
      {...props}
    />
  ),
  th: ({ node, ...props }) => (
    <th
      className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-[#212124]/50 last:border-r-0"
      {...props}
    />
  ),
  td: ({ node, ...props }) => (
    <td
      className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-[#212124]/50 last:border-r-0"
      {...props}
    />
  ),
  hr: () => (
    <hr className="my-10 border-t-[1px] border-slate-200 dark:border-slate-700" />
  ),
};
