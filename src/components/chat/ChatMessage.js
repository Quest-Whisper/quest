"use client";

import { motion } from "framer-motion";
import {
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  MicrophoneIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Minimal WAV header builder for 16-bit PCM @ 24 kHz mono
function makeWavHeader(
  dataLen,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
) {
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const buf = new ArrayBuffer(44);
  const dv = new DataView(buf);
  let p = 0;
  const writeString = (s) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(p++, s.charCodeAt(i));
  };
  const writeUint32 = (v) => {
    dv.setUint32(p, v, true);
    p += 4;
  };
  const writeUint16 = (v) => {
    dv.setUint16(p, v, true);
    p += 2;
  };

  writeString("RIFF");
  writeUint32(36 + dataLen);
  writeString("WAVE");
  writeString("fmt ");
  writeUint32(16); // Subchunk1Size (PCM)
  writeUint16(1); // AudioFormat = PCM
  writeUint16(numChannels);
  writeUint32(sampleRate);
  writeUint32(byteRate);
  writeUint16(blockAlign);
  writeUint16(bitsPerSample);
  writeString("data");
  writeUint32(dataLen);
  return buf;
}

export default function ChatMessage({ message, isUser }) {
  const [parsedSources, setParsedSources] = useState([]);
  const [wavUrl, setWavUrl] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  const isError = !isUser && message.isError;
  const sources = message.sources?.length ? message.sources : parsedSources;
  const hasSources = !isUser && sources.length > 0;
  const hasDisplayImage = !isUser && message.displayImage;

  // AudioContext configured once
  const audioContext = useMemo(() => new AudioContext(), []);

  // Extract "sources" JSON block from message.content
  function getSources(text) {
    const match = text.match(/sources:\s*(\[[\s\S]*?\])/i);
    if (!match) return [];
    try {
      return JSON.parse(match[1]);
    } catch {
      return [];
    }
  }

  // Strip out "sources:[...]" and any prefixed labels
  function removeSources(text) {
    let t = text
      .replace(/AI FINAL USER RESPONSE:\s*/i, "")
      .replace(/sources:\s*\[[\s\S]*?\]\s*/gi, "")
      .replace(/\n{2,}/g, "\n");
    return t.trim();
  }

  useEffect(() => {
    setParsedSources(getSources(message.content || ""));
  }, [message.content]);

  function stripMarkdown(md) {
    return (
      md
        // Remove code blocks (```…```)
        .replace(/```[\s\S]*?```/g, "")
        // Unwrap inline code `…`
        .replace(/`([^`\n]+)`/g, "$1")
        // Remove ATX headings (e.g. "### Heading" → "Heading")
        .replace(/^#{1,6}\s*(.*)$/gm, "$1")
        // Remove setext headings (overlines/underlines)
        .replace(/^(?:=+|-+)\s*$/gm, "")
        // Remove images ![alt](url)
        .replace(/!\[.*?\]\(.*?\)/g, "")
        // Unwrap links [text](url) → text
        .replace(/\[([^\]]+)\]\((?:.|\s)*?\)/g, "$1")
        // Remove bold **text** or __text__
        .replace(/(\*\*|__)(.*?)\1/g, "$2")
        // Remove emphasis *text* or _text_
        .replace(/(\*|_)(.*?)\1/g, "$2")
        // Remove blockquotes > …
        .replace(/^\s{0,3}>\s?/gm, "")
        // Remove unordered list markers -, *, +
        .replace(/^\s*([-*+])\s+/gm, "")
        // Remove ordered list numbers "1. "
        .replace(/^\s*\d+\.\s+/gm, "")
        // Remove horizontal rules (---, ***, ___)
        .replace(/^(?:-{3,}|\*{3,}|_{3,})\s*$/gm, "")
        // Strip any remaining HTML tags
        .replace(/<\/?[^>]+(>|$)/g, "")
        // Collapse multiple blank lines
        .replace(/\n{2,}/g, "\n\n")
        .trim()
    );
  }

  // Custom components for ReactMarkdown
  const components = {
    h1: ({ node, ...props }) => (
      <h1 className="text-2xl font-bold mb-6 text-slate-800 leading-tight" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-xl font-bold mt-8 mb-4 text-slate-800 leading-tight" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-lg font-bold mb-4 text-slate-700 leading-tight" {...props} />
    ),
    h4: ({ node, ...props }) => (
      <h4 className="text-base font-semibold mb-3 text-slate-700" {...props} />
    ),
    h5: ({ node, ...props }) => (
      <h5 className="text-sm font-semibold mb-2 text-slate-600" {...props} />
    ),
    h6: ({ node, ...props }) => (
      <h6 className="text-sm font-medium mb-2 text-slate-600" {...props} />
    ),
    p: ({ node, ...props }) => (
      <p className="mb-4 text-slate-700 leading-relaxed" {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-700" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-2 text-slate-700" {...props} />
    ),
    li: ({ node, ...props }) => (
      <li className="leading-relaxed" {...props} />
    ),
    blockquote: ({ node, ...props }) => (
      <blockquote className="border-l-4 border-blue-200 pl-4 italic text-slate-600 my-4 bg-blue-50/50 py-2 rounded-r-lg" {...props} />
    ),
    code: ({ node, inline, ...props }) => 
      inline ? (
        <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
      ) : (
        <code className="block bg-slate-900 text-slate-100 p-4 rounded-lg text-sm font-mono overflow-x-auto" {...props} />
      ),
    pre: ({ node, ...props }) => (
      <pre className="bg-slate-900 rounded-lg overflow-hidden my-4" {...props} />
    ),
    strong: ({ node, ...props }) => (
      <strong className="font-semibold text-slate-800" {...props} />
    ),
    em: ({ node, ...props }) => (
      <em className="italic text-slate-700" {...props} />
    ),
    a: ({ node, ...props }) => (
      <a className="text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors" {...props} />
    ),
  };

  const fetchAndPlay = async (message) => {
    // Fetch raw L16/PCM from your TTS endpoint, wrap in WAV, expose to <audio> and play via Web Audio
    const editedMassage = stripMarkdown(message);
    try {
      const res = await fetch(`/api/chat/tts?message=${editedMassage}`);
      const pcmArrayBuffer = await res.arrayBuffer();
      const pcm = new Uint8Array(pcmArrayBuffer);

      // 1) Build WAV container
      const header = makeWavHeader(pcm.byteLength, 24000, 1, 16);
      const wavBuffer = new Uint8Array(header.byteLength + pcm.byteLength);
      wavBuffer.set(new Uint8Array(header), 0);
      wavBuffer.set(pcm, header.byteLength);
      const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
      const url = URL.createObjectURL(wavBlob);
      setWavUrl(url);

      // 2) Decode & play via AudioContext
      const audioBuffer = await audioContext.decodeAudioData(
        wavBuffer.buffer.slice(0)
      );
      const src = audioContext.createBufferSource();
      src.buffer = audioBuffer;
      src.connect(audioContext.destination);
      src.start();
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch or play audio");
    }
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(message.content || "");
    toast.success("Copied to clipboard!", {
      style: {
        background: '#10b981',
        color: 'white',
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full group" 
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="max-w-4xl mx-auto px-4 py-2">
        <div
          className={`flex flex-col ${
            isUser ? "items-end" : "items-start"
          }`}
        >
          <motion.div
            className={`${
              isUser 
                ? "bg-slate-200 rounded-3xl px-4 pt-[12px] max-w-[70%] flex items-center"
                : isError
                ? "bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3"
                : "w-full"
            }`}
            whileHover={isUser ? { 
              transition: { duration: 0.2 }
            } : !isError ? { 
              transition: { duration: 0.2 }
            } : {}}
            transition={{ duration: 0.2 }}
          >



          {hasDisplayImage && (
            <motion.div 
              className="mb-6 flex justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <img
                src={message.displayImage}
                className="rounded-xl max-h-80 w-auto object-cover shadow-md"
                alt="AI generated image"
              />
            </motion.div>
          )}

          {isError && (
            <motion.div 
              className="flex items-center gap-2 mb-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              <span className="font-semibold text-red-700">Something went wrong</span>
            </motion.div>
          )}

          <motion.article 
            className="text-[16px] leading-relaxed text-slate-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {removeSources(message.content)}
            </ReactMarkdown>
          </motion.article>

          {hasSources && (
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
                        <span className="truncate font-medium">Visit source</span>
                        <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1 group-hover/source:translate-x-0.5 group-hover/source:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

          {/* Action buttons positioned under the bubble */}
          <motion.div 
            className="flex items-center gap-2 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0.4 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              onClick={copyText}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ClipboardDocumentIcon className="h-3.5 w-3.5" />
            </motion.button>
            
            {!isUser && (
              <motion.button
                onClick={() => fetchAndPlay(message.content)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MicrophoneIcon className="h-3.5 w-3.5" />
              </motion.button>
            )}
            
            {wavUrl && (
              <motion.audio 
                src={wavUrl} 
                className="ml-2" 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              />
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
