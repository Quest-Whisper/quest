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

  const isError = !isUser && message.isError;
  const sources = message.sources?.length ? message.sources : parsedSources;
  const hasSources = !isUser && sources.length > 0;
  const hasDisplayImage = !isUser && message.displayImage;

  // AudioContext configured once
  const audioContext = useMemo(() => new AudioContext(), []);

  // Extract “sources” JSON block from message.content
  function getSources(text) {
    const match = text.match(/sources:\s*(\[[\s\S]*?\])/i);
    if (!match) return [];
    try {
      return JSON.parse(match[1]);
    } catch {
      return [];
    }
  }

  // Strip out “sources:[…]” and any prefixed labels
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
        // Remove ATX headings (e.g. “### Heading” → “Heading”)
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
        // Remove ordered list numbers “1. ”
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
      <h1 className="text-2xl font-bold mb-[20px]" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-xl font-bold mt-[40px]" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-lg font-bold mb-[20px]" {...props} />
    ),
    h4: ({ node, ...props }) => (
      <h4 className="text-base font-bold my-[4px]" {...props} />
    ),
    h5: ({ node, ...props }) => (
      <h5 className="text-base font-semibold my-[3px]" {...props} />
    ),
    h6: ({ node, ...props }) => (
      <h6 className="text-sm font-semibold my-[3px]" {...props} />
    ),
    p: ({ node, ...props }) => <p className="my-[5px]" {...props} />,
    ul: ({ node, ...props }) => (
      <ul className="list-disc pl-5 my-[4px]" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="list-decimal pl-5 my-[15]" {...props} />
    ),
    li: ({ node, ...props }) => <li className="my-[6px]" {...props} />,
    // Add a wrapper component that will handle the whitespace classes
    root: ({ node, ...props }) => (
      <div className="whitespace-pre-line" {...props} />
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
    toast.success("Copied");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6`}
    >
      <div
        className={`flex flex-col ${
          isUser ? "items-end max-w-[60%]" : "items-start w-full max-w-[100%]"
        }`}
      >
        <div
          className={`rounded-[60px] px-[15px] py-[5px] ${
            isUser
              ? "bg-gray-100 text-black"
              : isError
              ? "text-red-800"
              : "bg-white text-gray-900"
          }`}
        >
          {hasDisplayImage && (
            <div className="mt-4 flex justify-center">
              <img
                src={message.displayImage}
                className="rounded-[60px] h-[300px] w-[450px] object-cover mb-[50px]"
              />
            </div>
          )}

          {isError && (
            <span className="flex items-center gap-1 text-red-600 font-medium">
              <ExclamationTriangleIcon className="h-4 w-4" />
              Oops!
            </span>
          )}

          <article className="text-[15px] mx-auto p-[10px] space-y-[4px]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {removeSources(message.content)}
            </ReactMarkdown>
          </article>

          {hasSources && (
                <div className="mt-4 border-t border-gray-200 pt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Sources:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sources.map((source, index) => (
                      <a
                        key={index}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        {source.image && (
                          <div className="flex-shrink-0 w-16 h-16 overflow-hidden rounded-md">
                            <img
                              src={source.image}
                              alt={source.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {source.title}
                          </p>
                          <div className="flex items-center text-xs text-blue-600 mt-1">
                            <span className="truncate">Visit source</span>
                            <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                          </div>
                        </div>
                      </a>
                    ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mt-2 ml-4">
          <ClipboardDocumentIcon
            onClick={copyText}
            className="h-5 w-5 cursor-pointer"
          />
          {/* {!isUser && (
            <>
              <MicrophoneIcon
                onClick={() => fetchAndPlay(message.content)}
                className="h-5 w-5 text-black-500 cursor-pointer"
              />
              {wavUrl && <audio src={wavUrl} className="ml-2" />}
            </>
          )} */}
        </div>
      </div>
    </motion.div>
  );
}
