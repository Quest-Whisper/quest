"use client";

import { motion } from "framer-motion";
import {
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  MicrophoneIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";

// Minimal WAV header builder for 16-bit PCM @ 24 kHz mono
// 1) WAV‐header helper
function makeWavHeader(dataLength, sampleRate, numChannels, bitsPerSample) {
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  function wStr(offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  wStr(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true); // file length minus 8
  wStr(8, "WAVE");
  wStr(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // audio format = PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  wStr(36, "data");
  view.setUint32(40, dataLength, true);

  return buffer;
}

// 2) AudioContext (if you ever want Web-Audio playback)
/*
const audioContext = new AudioContext();
*/

  // 3) Fetch + play
  async function fetchAndPlay(message) {
    const controller = new AbortController();
    setAbortController(controller);
    setIsLoading(true);

  try {
    // stripMarkdown is your existing helper
    const txt = stripMarkdown(message);

    // a) Fetch raw PCM
    const res = await fetch(
      `/api/chat/tts?message=${encodeURIComponent(txt)}`,
      {
        cache: "no-store",
        signal: controller.signal,
      }
    );
    if (!res.ok) throw new Error(`TTS failed: ${res.status}`);

    const pcmArrayBuffer = await res.arrayBuffer();
    const pcm = new Uint8Array(pcmArrayBuffer);

    // b) Build WAV container
    const header = makeWavHeader(pcm.length, 24000, 1, 16);
    const wavBuffer = new Uint8Array(header.byteLength + pcm.length);
    wavBuffer.set(new Uint8Array(header), 0);
    wavBuffer.set(pcm, header.byteLength);

    // c) Play via a normal <audio> element
    const blob = new Blob([wavBuffer.buffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const audioEl = new Audio(url);

    // Track the audio element so we can stop it
    const audioNode = { stop: () => audioEl.pause() };
    setAudioNodes([audioNode]);

    // Set playing state when audio starts
    audioEl.onloadeddata = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };

    // Clean up when audio ends
    audioEl.onended = () => {
      setIsPlaying(false);
      setAbortController(null);
      setAudioNodes([]);
      URL.revokeObjectURL(url);
    };

    // Also handle if audio is paused (stopped)
    audioEl.onpause = () => {
      setIsPlaying(false);
      setAbortController(null);
      setAudioNodes([]);
      URL.revokeObjectURL(url);
    };

    audioEl.play();

    // —OR—  If you prefer Web-Audio:
    /*
    const decoded = await audioContext.decodeAudioData(wavBuffer.buffer);
    const src = audioContext.createBufferSource();
    src.buffer = decoded;
    src.connect(audioContext.destination);
    src.start();
    */
  } catch (err) {
    setIsLoading(false);
    setIsPlaying(false);
    setAbortController(null);
    setAudioNodes([]);
    // Silent error handling
  }
}

export default function ChatMessage({ message, isUser, onRetry, onResendLastMessage }) {
  const [parsedSources, setParsedSources] = useState([]);
  const [wavUrl, setWavUrl] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [audioNodes, setAudioNodes] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);

  const isError = !isUser && message.isError;
  const isStreaming = !isUser && message.isStreaming;
  // Check if this is the specific error message that needs retry
  const isRetryableError = !isUser && message.content?.trim() === "I apologize, but I couldn't process your request. Please try again.";
  const isRetryable = isRetryableError || (!isUser && message.isRetryable && onRetry);
  const sources = message.sources?.length ? message.sources : parsedSources;
  const hasSources = !isUser && sources.length > 0;
  const hasDisplayImage = !isUser && message.displayImage;

  // Handle retry for the specific error message
  const handleRetry = useCallback(() => {
    if (onRetry) {
      // Use the provided onRetry function if available
      onRetry();
    } else if (isRetryableError && onResendLastMessage) {
      // For the specific error message, resend the last user message
      onResendLastMessage();
    }
  }, [onRetry, isRetryableError, onResendLastMessage]);

  // Memoize hover handlers to prevent unnecessary re-renders
  const handleHoverStart = useCallback(() => {
    if (!isStreaming) {
      setIsHovered(true);
    }
  }, [isStreaming]);

  const handleHoverEnd = useCallback(() => {
    setIsHovered(false);
  }, []);

  // AudioContext configured once
  const audioContext = useMemo(() => {
    if (typeof window !== "undefined") {
      const ctx = new AudioContext();
      return ctx;
    }
    return null;
  }, []);

  // Cleanup function to stop all audio
  const stopAudio = () => {
    // Stop the fetch request
    if (abortController) {
      try {
        abortController.abort();
      } catch (e) {
        // AbortController.abort() can throw "BodyStreamBuffer was aborted" error
        // This is expected when stopping an ongoing stream, so we silently handle it
      }
      setAbortController(null);
    }

    // Stop all scheduled audio nodes
    audioNodes.forEach((node) => {
      try {
        if (node.stop) {
          node.stop();
        }
      } catch (e) {
        // Node might already be stopped
      }
    });
    setAudioNodes([]);
    setIsPlaying(false);
    setIsLoading(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  // Test function to verify AudioContext is working
  const testAudio = async () => {
    if (!audioContext) {
      return false;
    }

    try {
      // Resume if suspended
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      // Create a simple 440Hz beep for 0.2 seconds
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.2
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);

      return true;
    } catch (error) {
      return false;
    }
  };

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
        // Remove sources block first (before other processing)
        .replace(/sources:\s*\[[\s\S]*?\]\s*/gi, "")
        // Remove AI response prefixes
        .replace(/AI FINAL USER RESPONSE:\s*/i, "")
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
      <h1
        className="text-2xl font-bold mb-6 text-slate-800 leading-tight"
        {...props}
      />
    ),
    h2: ({ node, ...props }) => (
      <h2
        className="text-xl font-bold mt-8 mb-4 text-slate-800 leading-tight"
        {...props}
      />
    ),
    h3: ({ node, ...props }) => (
      <h3
        className="text-lg font-bold mb-4 text-slate-700 leading-tight"
        {...props}
      />
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
      <ol
        className="list-decimal pl-6 mb-4 space-y-2 text-slate-700"
        {...props}
      />
    ),
    li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
    blockquote: ({ node, ...props }) => (
      <blockquote
        className="border-l-4 border-blue-200 pl-4 italic text-slate-600 my-4 bg-blue-50/50 py-2 rounded-r-lg"
        {...props}
      />
    ),
    code: ({ node, inline, ...props }) =>
      inline ? (
        <code
          className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono"
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
      <strong className="font-semibold text-slate-800" {...props} />
    ),
    em: ({ node, ...props }) => (
      <em className="italic text-slate-700" {...props} />
    ),
    a: ({ node, ...props }) => (
      <a
        className="text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors"
        {...props}
      />
    ),
  };

  // NEW streaming TTS playback
  async function fetchAndPlayStreaming(text) {
    if (!audioContext) {
      toast.error("Audio not available in this browser");
      return;
    }

    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);
    setIsLoading(true);

    try {
      // 1) Ensure AudioContext is resumed
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      // 2) Kick off fetch with Firebase-optimized headers
      const res = await fetch(
        `/api/chat/tts?message=${encodeURIComponent(stripMarkdown(text))}`,
        {
          cache: "no-store",
          headers: {
            Accept: "audio/pcm",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Connection: "keep-alive",
            "X-Requested-With": "XMLHttpRequest", // Help Firebase identify AJAX requests
          },
          // Use our abort controller
          signal: controller.signal,
        }
      );

      if (!res.ok) {
        throw new Error(`TTS API error: ${res.status} ${res.statusText}`);
      }

      // 3) Confirm streaming support
      if (!res.body) {
        return fetchAndPlay(text);
      }

      const reader = res.body.getReader();

      // 4) Set up streaming audio playback using AudioBufferSourceNode scheduling
      const sampleRate = 24000; // PCM sample rate from Gemini
      const chunkDurationSeconds = 0.1; // Play chunks every 100ms
      const samplesPerChunk = Math.floor(sampleRate * chunkDurationSeconds);

      let pcmBuffer = new Int16Array(0);
            let nextPlayTime = audioContext.currentTime;
      let streamFinished = false;
      let totalBytesReceived = 0;
      let chunksScheduled = 0;
      let activeAudioNodes = 0;
      let hasStartedPlaying = false;
      
      // Buffer for incomplete chunks - fixes the fragmentation issue
      let incompleteByteBuffer = new Uint8Array(0);

      // 5) Function to schedule and play audio chunks
      const scheduleAudioChunk = () => {
        if (controller.signal.aborted || pcmBuffer.length < samplesPerChunk) {
          return false;
        }

        try {
          // Extract chunk from buffer
          const chunkData = pcmBuffer.slice(0, samplesPerChunk);
          pcmBuffer = pcmBuffer.slice(samplesPerChunk);

          // Create AudioBuffer
          const audioBuffer = audioContext.createBuffer(
            1,
            chunkData.length,
            sampleRate
          );
          const channelData = audioBuffer.getChannelData(0);

          // Convert Int16 PCM to Float32 and copy to AudioBuffer
          for (let i = 0; i < chunkData.length; i++) {
            channelData[i] = chunkData[i] / 32768.0; // Convert to -1.0 to 1.0 range
          }

          // Create and schedule AudioBufferSourceNode
          const sourceNode = audioContext.createBufferSource();
          sourceNode.buffer = audioBuffer;
          sourceNode.connect(audioContext.destination);

                    // Track this audio node so we can stop it later
          setAudioNodes((prev) => [...prev, sourceNode]);
          activeAudioNodes++;

          // Set playing state when first audio starts
          if (!hasStartedPlaying) {
            hasStartedPlaying = true;
            setIsLoading(false);
            setIsPlaying(true);
          }

          // Clean up when the node finishes playing
          sourceNode.onended = () => {
            setAudioNodes((prev) => prev.filter((node) => node !== sourceNode));
            activeAudioNodes--;

            // If stream is finished and no more audio nodes are playing, we're done
            if (streamFinished && activeAudioNodes === 0) {
              setIsPlaying(false);
              setAbortController(null);
            }
          };

          // Schedule to play at the right time
          if (nextPlayTime <= audioContext.currentTime) {
            nextPlayTime = audioContext.currentTime + 0.01; // Small delay to avoid timing issues
          }

          sourceNode.start(nextPlayTime);
          chunksScheduled++;

          // Update next play time
          nextPlayTime += chunkDurationSeconds;

          return true;
        } catch (audioError) {
          return false;
        }
      };

      // 6) Timer to regularly schedule audio chunks
      const audioTimer = setInterval(() => {
        if (!controller.signal.aborted) {
          scheduleAudioChunk();
        } else {
          clearInterval(audioTimer);
        }
      }, 50); // Check every 50ms

      // 7) Read and process streaming chunks - START IMMEDIATELY
      const processStream = async () => {
        try {
          let chunkCount = 0;

          while (true) {
            const result = await reader.read();
            const { done, value } = result;
            chunkCount++;

            if (done) {
              // Process any remaining incomplete bytes
              if (incompleteByteBuffer.length > 0) {
                // If we have at least one complete sample, process it
                if (incompleteByteBuffer.length >= 2) {
                  const completeSamples = Math.floor(
                    incompleteByteBuffer.length / 2
                  );
                  const int16Data = new Int16Array(
                    incompleteByteBuffer.buffer,
                    0,
                    completeSamples
                  );
                  const newBuffer = new Int16Array(
                    pcmBuffer.length + int16Data.length
                  );
                  newBuffer.set(pcmBuffer);
                  newBuffer.set(int16Data, pcmBuffer.length);
                  pcmBuffer = newBuffer;
                }
              }

              // Mark stream as finished and schedule remaining audio
              streamFinished = true;
              
              setTimeout(() => {
                if (!controller.signal.aborted) {
                  // Schedule any remaining audio - be more aggressive about playing all remaining data
                  let remainingChunks = 0;
                  
                  // First, try to schedule complete chunks
                  while (pcmBuffer.length >= samplesPerChunk) {
                    if (scheduleAudioChunk()) {
                      remainingChunks++;
                    } else {
                      break;
                    }
                  }
                  
                  // Then, if there's still data left (even if incomplete), schedule it
                  if (pcmBuffer.length > 0) {
                    try {
                      const finalChunkData = pcmBuffer;
                      const audioBuffer = audioContext.createBuffer(
                        1,
                        finalChunkData.length,
                        sampleRate
                      );
                      const channelData = audioBuffer.getChannelData(0);

                      for (let i = 0; i < finalChunkData.length; i++) {
                        channelData[i] = finalChunkData[i] / 32768.0;
                      }

                      const sourceNode = audioContext.createBufferSource();
                      sourceNode.buffer = audioBuffer;
                      sourceNode.connect(audioContext.destination);

                      setAudioNodes((prev) => [...prev, sourceNode]);
                      activeAudioNodes++;

                      sourceNode.onended = () => {
                        setAudioNodes((prev) => prev.filter((node) => node !== sourceNode));
                        activeAudioNodes--;
                        if (streamFinished && activeAudioNodes === 0) {
                          setIsPlaying(false);
                          setAbortController(null);
                        }
                      };

                      if (nextPlayTime <= audioContext.currentTime) {
                        nextPlayTime = audioContext.currentTime + 0.01;
                      }

                      sourceNode.start(nextPlayTime);
                      remainingChunks++;
                      
                      // Clear the buffer since we've scheduled everything
                      pcmBuffer = new Int16Array(0);
                    } catch (finalAudioError) {
                      // Silently handle final audio chunk errors
                    }
                  }
                }

                // Clear the timer
                clearInterval(audioTimer);
                
                // If no audio nodes are playing, we can stop immediately
                if (activeAudioNodes === 0) {
                  setIsPlaying(false);
                  setAbortController(null);
                }
              }, 500); // Increased delay from 100ms to 500ms to ensure all data is processed
              break;
            }

            if (value && value.length > 0) {
              totalBytesReceived += value.length;

              try {
                // Combine with any previous incomplete bytes
                const combinedBytes = new Uint8Array(
                  incompleteByteBuffer.length + value.length
                );
                combinedBytes.set(incompleteByteBuffer);
                combinedBytes.set(value, incompleteByteBuffer.length);

                // Calculate how many complete 16-bit samples we have
                const completeSamples = Math.floor(combinedBytes.length / 2);
                const completeBytes = completeSamples * 2;

                if (completeSamples > 0) {
                  // Process complete samples
                  const completeByteArray = combinedBytes.slice(
                    0,
                    completeBytes
                  );
                  const int16Data = new Int16Array(
                    completeByteArray.buffer,
                    completeByteArray.byteOffset,
                    completeSamples
                  );

                  // Validate the audio data range
                  const hasValidData = int16Data.some(
                    (sample) => Math.abs(sample) > 100
                  );

                  // Append to our buffer
                  const newBuffer = new Int16Array(
                    pcmBuffer.length + int16Data.length
                  );
                  newBuffer.set(pcmBuffer);
                  newBuffer.set(int16Data, pcmBuffer.length);
                  pcmBuffer = newBuffer;

                  // Try to schedule audio immediately if we have enough data
                  scheduleAudioChunk();
                }

                // Store any remaining incomplete bytes for next chunk
                if (combinedBytes.length > completeBytes) {
                  incompleteByteBuffer = combinedBytes.slice(completeBytes);
                } else {
                  incompleteByteBuffer = new Uint8Array(0);
                }
              } catch (audioError) {
                // Reset incomplete buffer on error
                incompleteByteBuffer = new Uint8Array(0);
              }
            }
          }
        } catch (streamError) {
          // Check if this is an intentional abort
          const isAborted = controller.signal.aborted || 
                           streamError.name === 'AbortError' || 
                           streamError.message?.includes('aborted');
          
          streamFinished = true;
          clearInterval(audioTimer);
          setIsLoading(false);
          
          // Only stop immediately if no audio is playing
          if (activeAudioNodes === 0) {
            setIsPlaying(false);
            setAbortController(null);
          }
          
          // Only fallback if not aborted (genuine error)
          if (!isAborted) {
            fetchAndPlay(text);
          }
        }
      };

      // Start processing immediately, don't wait
      processStream();
    } catch (err) {
      // Check if this is an intentional abort
      const isAborted = controller.signal.aborted || 
                       err.name === 'AbortError' || 
                       err.message?.includes('aborted');
      
      setIsLoading(false);
      setIsPlaying(false);
      setAbortController(null);
      
      // Only fallback if not aborted (genuine error)
      if (!isAborted) {
        fetchAndPlay(text);
      }
    }
  }

  const copyText = async () => {
    await navigator.clipboard.writeText(message.content || "");
    toast.success("Copied to clipboard!", {
      style: {
        background: "#14171A",
        color: "white",
      },
    });
  };

  const shareToSocial = (platform) => {
    const text = removeSources(message.content || "");
    const shareText = `Check out this AI response from QuestWhisper:\n\n${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`;
    const url = encodeURIComponent(window.location.href);
    const encodedText = encodeURIComponent(shareText);

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText}`,
      telegram: `https://t.me/share/url?url=${url}&text=${encodedText}`,
      reddit: `https://reddit.com/submit?url=${url}&title=${encodedText}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      setShowShareModal(false);
      toast.success(`Shared to ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`);
    }
  };

  const shareViaEmail = () => {
    const text = removeSources(message.content || "");
    const subject = "AI Response from QuestWhisper";
    const body = `I wanted to share this AI response with you:\n\n${text}\n\nGenerated by QuestWhisper AI`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setShowShareModal(false);
    toast.success("Email client opened!");
  };

  const copyShareableLink = async () => {
    try {
      // Create a shareable version of the message
      const shareData = {
        content: removeSources(message.content || ""),
        title: `AI Response - ${new Date(message.timestamp).toLocaleDateString()}`,
        sources: message.sources || [],
        displayImage: message.displayImage || null,
      };

      // Create a shareable link via API
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shareData),
      });

      const result = await response.json();

      if (result.success) {
        await navigator.clipboard.writeText(result.shareUrl);
        setShowShareModal(false);
        toast.success("Shareable link copied to clipboard!");
      } else {
        throw new Error(result.error || 'Failed to create share link');
      }
    } catch (error) {
      console.error('Share error:', error);
      // Fallback to copying content as text
      const shareText = `QuestWhisper AI Response:\n\n${removeSources(message.content || "")}\n\nGenerated at: ${new Date(message.timestamp).toLocaleString()}`;
      await navigator.clipboard.writeText(shareText);
      setShowShareModal(false);
      toast.success("Content copied to clipboard!");
    }
  };

  const downloadAsText = () => {
    const text = removeSources(message.content || "");
    const timestamp = new Date(message.timestamp).toLocaleString();
    const content = `QuestWhisper AI Response\n${'='.repeat(25)}\n\nGenerated: ${timestamp}\n\n${text}\n\n${message.sources?.length ? '\nSources:\n' + message.sources.map((s, i) => `${i + 1}. ${s.title} - ${s.url}`).join('\n') : ''}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questwhisper-response-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowShareModal(false);
    toast.success("Response downloaded as text file!");
  };

  const ShareModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowShareModal(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Share Response</h3>
          <p className="text-sm text-gray-600">Choose how you'd like to share this AI response</p>
        </div>

        <div className="space-y-4">
          {/* Social Media Sharing */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Social Media</h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'twitter', label: 'Twitter', color: 'bg-blue-400 hover:bg-blue-500' },
                { name: 'facebook', label: 'Facebook', color: 'bg-blue-600 hover:bg-blue-700' },
                { name: 'linkedin', label: 'LinkedIn', color: 'bg-blue-800 hover:bg-blue-900' },
                { name: 'whatsapp', label: 'WhatsApp', color: 'bg-green-500 hover:bg-green-600' },
                { name: 'telegram', label: 'Telegram', color: 'bg-blue-500 hover:bg-blue-600' },
                { name: 'reddit', label: 'Reddit', color: 'bg-orange-500 hover:bg-orange-600' },
              ].map((platform) => (
                <motion.button
                  key={platform.name}
                  onClick={() => shareToSocial(platform.name)}
                  className={`${platform.color} text-white p-3 rounded-xl text-xs font-medium transition-colors`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {platform.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Direct Actions */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Direct Actions</h4>
            <div className="space-y-2">
              <motion.button
                onClick={shareViaEmail}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  📧
                </div>
                <span className="text-sm font-medium text-gray-700">Share via Email</span>
              </motion.button>

              <motion.button
                onClick={copyShareableLink}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  🔗
                </div>
                <span className="text-sm font-medium text-gray-700">Create Share Link</span>
              </motion.button>

              <motion.button
                onClick={downloadAsText}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  💾
                </div>
                <span className="text-sm font-medium text-gray-700">Download as File</span>
              </motion.button>
            </div>
          </div>
        </div>

        <motion.button
          onClick={() => setShowShareModal(false)}
          className="w-full mt-6 p-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Cancel
        </motion.button>
      </motion.div>
    </motion.div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full group"
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
        layout={!isStreaming} // Disable layout animation during streaming
      >
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div
            className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
          >
            <motion.div
              className={`${
                isUser
                  ? "bg-slate-200 rounded-3xl px-4 pt-[12px] max-w-[70%] flex items-center"
                  : isError && !isRetryableError
                  ? "bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3"
                  : "w-full"
              }`}
              whileHover={
                isUser && !isStreaming
                  ? {
                      transition: { duration: 0.2 },
                    }
                  : !isError && !isStreaming
                  ? {
                      transition: { duration: 0.2 },
                    }
                  : {}
              }
              transition={{ duration: 0.2 }}
              layout={!isStreaming} // Disable layout animation during streaming
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

              {isError && !isRetryableError && (
                <motion.div
                  className="flex items-center gap-2 mb-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  <span className="font-semibold text-red-700">
                    Something went wrong
                  </span>
                </motion.div>
              )}

              <motion.article
                className="text-[16px] leading-relaxed text-slate-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: isStreaming ? 0 : 0.1 }} // Faster transition for streaming
                layout={!isStreaming} // Disable layout animation during streaming
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={components}
                >
                  {removeSources(message.content)}
                </ReactMarkdown>
                
                {/* Streaming indicator */}
                {isStreaming && (
                  <motion.div
                    className="flex items-center gap-2 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="flex space-x-1">
                      <motion.div 
                        className="w-2 h-2 bg-blue-400 rounded-full"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: 0
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-blue-400 rounded-full"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: 0.2
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-blue-400 rounded-full"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: 0.4
                        }}
                      />
                    </div>
                    <span className="text-sm text-slate-500">generating...</span>
                  </motion.div>
                )}
              </motion.article>

              {hasSources && !isStreaming && (
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
              )}
            </motion.div>

            {/* Action buttons positioned under the bubble - Don't show for streaming messages */}
            {!isStreaming && (
              <motion.div 
                className="flex items-center gap-1 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.button onClick={copyText} className="p-1.5 rounded-md">
                  <Image
                    src="/icons/copy_icon.png"
                    alt="Copy content"
                    width={20}
                    height={20}
                  />
                </motion.button>

                {!isUser && (
                  <>
                    {isRetryable && (
                      <motion.button
                        onClick={handleRetry}
                        className="px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 flex items-center gap-1.5 border border-blue-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Retry this message"
                      >
                        <svg 
                          className="w-4 h-4" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                          />
                        </svg>
                        <span className="text-sm font-medium">Retry</span>
                      </motion.button>
                    )}

                    <motion.button
                      onClick={async () => {
                        if (isPlaying || isLoading) {
                          // Stop audio if currently playing or loading
                          stopAudio();
                        } else {
                          // First test if audio is working
                          const audioWorking = await testAudio();

                          if (audioWorking) {
                            // Wait a moment after the test beep
                            setTimeout(() => {
                              fetchAndPlayStreaming(message.content);
                            }, 500);
                          } else {
                            toast.error(
                              "Audio not available - check browser permissions"
                            );
                          }
                        }
                      }}
                      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isLoading ? (
                        // Loading spinner
                        <div className="w-6 h-6 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                        </div>
                      ) : isPlaying ? (
                        // Stop button
                        <div className="w-6 h-6 bg-[#66757F] hover:bg-[#292F33] rounded-md flex items-center justify-center transition-colors duration-200">
                          <div className="w-3 h-3 bg-white rounded-sm"></div>
                        </div>
                      ) : (
                        // Play button
                        <Image
                          src="/icons/volume_icon.png"
                          alt="Play audio"
                          width={24}
                          height={24}
                        />
                      )}
                    </motion.button>

                    <motion.button
                      onClick={() => setShowShareModal(true)}
                      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Share response"
                    >
                      <ShareIcon className="w-5 h-5" />
                    </motion.button>
                  </>
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
            )}
          </div>
        </div>
      </motion.div>

      {/* Share Modal */}
      {showShareModal && <ShareModal />}
    </>
  );
}
