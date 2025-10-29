// components/LiveVoiceChat.jsx
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  ActivityHandling,
  FunctionCallingConfigMode,
  GoogleGenAI,
  Modality,
} from "@google/genai";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { QUEST_VOICE_SYSTEM_PROMPT } from "@/lib/quest-voice-system-prompt";
import Image from "next/image";
import WaveformAnimation from "./WaveformAnimation";

export default function LiveVoiceChat({ onClose }) {
  const [token, setToken] = useState(null);
  const [connected, setConnected] = useState(false);
  const [recording, setRec] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const userSpeakingRef = useRef(false);
  const speechSilenceTimeoutRef = useRef(null);
  const playbackAudioCtxRef = useRef(null);
  const playbackCursorRef = useRef(null);
  const activePlaybackSourcesRef = useRef(new Set());
  const didConnect = useRef(false);

  const sessionRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const workletRef = useRef(null);
  const isStreaming = useRef(false);

  const { data: session } = useSession();

  function getCurrentDateTime() {
    const now = new Date();
    return now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
  }

  let userDetails = "No session data available.";
  if (session && session.user) {
    userDetails = `
User ID: ${session.user.id}
Name: ${session.user.name}
Email: ${session.user.email}
`;
  }

  // 1) Fetch ephemeral token once
  useEffect(() => {
    fetch("/api/ephemeral-token")
      .then((r) => r.json())
      .then((d) => setToken(d.token))
      .catch(console.error);
  }, []);

  // 2) Open Gemini Live WebSocket when we have a token
  useEffect(() => {
    if (!token || didConnect.current) return;
    didConnect.current = true;

    const now = getCurrentDateTime();

    const ai = new GoogleGenAI({ apiKey: token, apiVersion: "v1alpha" });
    ai.live
      .connect({
        model: "gemini-2.5-flash-preview-native-audio-dialog",
        config: {
           languageCode: "en-US",
           speechConfig: {
             voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } },
           },
          tools: [
            { googleSearch: {} }, // ← this hooks in the Google Search tool
          ],
          //   // 2) If you’re also doing function calls, keep your declarations:
          functionDeclarations: [],
          toolConfig: {
            languageCode: "en-US",
            functionCallingConfig: { mode: FunctionCallingConfigMode.ANY },
            singleUtterance: false,
          },
           responseModalities: [Modality.AUDIO],

          systemInstruction: QUEST_VOICE_SYSTEM_PROMPT.replace(
            "%USERDETAILS%",
            userDetails
          ).replace("%DATEDETAILS%", now),

          realtimeInputConfig: {
            automaticActivityDetection: {
              disabled: false,
              startOfSpeechSensitivity: "START_SENSITIVITY_HIGH", // values: START_SENSITIVITY_LOW, START_SENSITIVITY_HIGH
              endOfSpeechSensitivity: "END_SENSITIVITY_LOW",
              prefixPaddingMs: 200, // how much leading audio the server buffers before start
              silenceDurationMs: 250,
            }, // ensure VAD is on
            activityHandling: ActivityHandling.START_OF_ACTIVITY_INTERRUPTS,
          },
        },
        callbacks: {
          onopen: () => {
            setConnected(true);
          },
          onerror: (e) => console.error("Socket error:", e),
          onclose: (e) => {
            console.log(`❌ Disconnected (code=${e.code}, reason=${e.reason})`);
            setConnected(false);
            isStreaming.current = false;
            cleanupAudioGraph();
            setRec(false);
          },
          onmessage: async (msg) => {
            console.log("Received message:", msg);
            // Handle audio content
            await handleAIMessage(msg);
          },
        },
      })
      .then((sess) => {
        sessionRef.current = sess;
        startVoice();
      })
      .catch(console.error);

      return () => {
        didConnect.current = false;
        try { sessionRef.current?.close(); } catch {}
      };
  }, [token]);

  // 3) Start streaming mic → Gemini
  const startVoice = async () => {
    if (!connected || recording) return;

    const sess = sessionRef.current;
    if (!sess) return console.error("Session not ready");

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    const audioCtx = new AudioContext({ sampleRate: 16000, latencyHint: "interactive" });
    await audioCtx.audioWorklet.addModule("/voice-processor.js");

    const source = audioCtx.createMediaStreamSource(stream);
    const worklet = new AudioWorkletNode(audioCtx, "voice-processor");
    // Avoid routing mic to destination to prevent echo; send only to worklet
    source.connect(worklet);

    isStreaming.current = true;
    worklet.port.onmessage = (e) => {
      // Double-check streaming state and connection before processing
      if (!isStreaming.current || !connected) return;

      const floatSamples = e.data;

      // Calculate audio level from samples
      const rms = Math.sqrt(
        floatSamples.reduce((sum, sample) => sum + sample * sample, 0) /
          floatSamples.length
      );
      const db = 20 * Math.log10(rms);
      // Normalize to 0-1 range and smooth
      const normalizedLevel = Math.max(0, Math.min(1, (db + 90) / 90));
      setAudioLevel(normalizedLevel);

      // Simple barge-in: if user speaks above threshold, stop current TTS playback immediately
      const startThreshold = 0.2;
      const stopThreshold = 0.05;
      const stopDelayMs = 200;
      if (normalizedLevel > startThreshold) {
        userSpeakingRef.current = true;
        // Stop any ongoing playback
        if (typeof currentSource !== "undefined" && currentSource) {
          try {
            currentSource.onended = null;
            currentSource.stop();
          } catch {}
        }
        audioChunks = [];
        isPlaying = false;
        if (typeof currentAudioContext !== "undefined" && currentAudioContext) {
          try {
            currentAudioContext.close();
          } catch {}
          currentAudioContext = null;
        }
      } else if (normalizedLevel < stopThreshold && userSpeakingRef.current) {
        // Debounce end-of-speech
        if (speechSilenceTimeoutRef.current) {
          clearTimeout(speechSilenceTimeoutRef.current);
        }
        speechSilenceTimeoutRef.current = setTimeout(() => {
          userSpeakingRef.current = false;
        }, stopDelayMs);
      }

      const pcm16 = floatTo16BitPCM(floatSamples);
      const b64 = arrayBufferToBase64(pcm16.buffer);

      try {
        // Check if session and connection are still valid before sending
        if (sessionRef.current && connected && isStreaming.current) {
          sessionRef.current.sendRealtimeInput({
            audio: { data: b64, mimeType: "audio/pcm;rate=16000" },
          });
          console.log("sent audio chunk");
        }
      } catch (err) {
        console.warn("sendRealtimeInput failed:", err);
        // Stop streaming if we get connection errors
        if (err.message.includes("CLOSING") || err.message.includes("CLOSED")) {
          console.log("WebSocket closed, stopping audio stream");
          isStreaming.current = false;
          setRec(false);
        }
      }
    };

    audioCtxRef.current = audioCtx;
    sourceRef.current = source;
    workletRef.current = worklet;
    setRec(true);
  };

  // 4) Stop streaming & signal end-of-stream
  const stopVoice = () => {
    if (!recording) return;
    isStreaming.current = false;

    if (workletRef.current) {
      workletRef.current.port.onmessage = null;
      workletRef.current.disconnect();
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    try {
      if (sessionRef.current && connected) {
        sessionRef.current.sendRealtimeInput({ audioStreamEnd: true });
      }
    } catch {
      /* ignore if socket already closed */
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
    setRec(false);
  };

  // Keep track of current audio context and source
  let currentAudioContext = null;
  let currentSource = null;

  // Audio buffer management
  let audioChunks = [];
  let isPlaying = false;
  let lastChunkTime = 0;
  const CHUNK_TIMEOUT = 40; // ms to wait before playing buffered chunks (reduced for lower latency)

  // WAV header helper function
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
    view.setUint32(4, 36 + dataLength, true);
    wStr(8, "WAVE");
    wStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    wStr(36, "data");
    view.setUint32(40, dataLength, true);

    return buffer;
  }

  const handleAIMessage = async (msg) => {
    // Handle different message types from Live API

    // If we got an interrupt flag, clear everything and bail
    if (msg.serverContent?.interrupted) {
      console.log("Turn was interrupted – clearing playback buffers");
      if (currentSource) {
        currentSource.onended = null;
        currentSource.stop();
      }
      audioChunks = [];
      isPlaying = false;
      return; // ← don’t process any parts of this turn
    }

    if (msg.serverContent) {
      const parts = msg.serverContent?.modelTurn?.parts || [];
      for (const p of parts) {
        if (p.inlineData?.data) {
          try {
            console.log("Audio MIME type:", p.inlineData.mimeType);
            schedulePlaybackChunk(p.inlineData.data);
          } catch (err) {
            console.error("Failed to handle audio:", err);
          }
        }

        // Handle text content
        if (p.text) {
          console.log("AI text response:", p.text);
        }
      }

      // Log turn completion
      if (msg.serverContent.turnComplete) {
        console.log("Turn completed");
      }

      // Log interruptions
      if (msg.serverContent.interrupted) {
        console.log("Turn was interrupted");
      }
    }

    // Handle tool call cancellations
    if (msg.toolCallCancellation) {
      console.log("Tool call cancelled:", msg.toolCallCancellation);
    }

    // Handle usage metadata
    if (msg.usageMetadata) {
      console.log("Usage metadata:", msg.usageMetadata);
    }
  };

  // Streamed playback scheduler per Gemini Live API best practice
  const schedulePlaybackChunk = (b64Data) => {
    const PLAYBACK_SR = 24000;
    if (!playbackAudioCtxRef.current) {
      playbackAudioCtxRef.current = new AudioContext({ latencyHint: "interactive" });
      playbackCursorRef.current = playbackAudioCtxRef.current.currentTime + 0.04;
    }
    const ctx = playbackAudioCtxRef.current;
    const now = ctx.currentTime;
    if (playbackCursorRef.current == null || playbackCursorRef.current < now + 0.02) {
      playbackCursorRef.current = now + 0.04;
    }

    // Convert base64 PCM16 to Float32
    const bin = base64ToArrayBuffer(b64Data);
    const int16 = new Int16Array(bin);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 0x8000;
    }

    const buffer = ctx.createBuffer(1, float32.length, PLAYBACK_SR);
    buffer.getChannelData(0).set(float32);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.onended = () => {
      activePlaybackSourcesRef.current.delete(src);
    };
    activePlaybackSourcesRef.current.add(src);
    try {
      src.start(playbackCursorRef.current);
      playbackCursorRef.current += buffer.duration;
    } catch (e) {
      try {
        src.start();
        playbackCursorRef.current = ctx.currentTime + buffer.duration;
      } catch {}
    }
  };

  // Tear down audio graph helpers
  const cleanupAudioGraph = () => {
    isStreaming.current = false;
    if (workletRef.current) {
      workletRef.current.port.onmessage = null;
      workletRef.current.disconnect();
      workletRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    // Stop and close playback context and any active scheduled sources
    try {
      activePlaybackSourcesRef.current.forEach((src) => {
        try { src.onended = null; src.stop(); } catch {}
      });
      activePlaybackSourcesRef.current.clear();
      if (playbackAudioCtxRef.current) {
        playbackAudioCtxRef.current.close();
      }
    } catch {}
    playbackAudioCtxRef.current = null;
    playbackCursorRef.current = null;
  };

  // Add handleClose function
  const handleClose = () => {
    // Clean up resources
    if (recording) {
      stopVoice();
    }
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        /* ignore if already closed */
      }
    }
    cleanupAudioGraph();
    // Call the parent's onClose callback
    onClose();
  };

  const connectionBadge = useMemo(() => {
    if (recording) return { text: "Listening", color: "bg-blue-600" };
    if (connected) return { text: "Connected", color: "bg-blue-600" };
    return { text: "Connecting…", color: "bg-slate-400" };
  }, [connected, recording]);

  return (
    <div className="relative min-h-[100dvh] w-screen overflow-hidden bg-gray-50 dark:bg-[#181818]">
      {/* Top bar (chat-like) */}
      <div className="sticky top-0 z-20 flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#3B3B3B] bg-white/95 dark:bg-[#181818]/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${connectionBadge.color}`} />
          <span className="text-sm text-slate-700 dark:text-slate-300">{connectionBadge.text}</span>
        </div>
        <button
          onClick={handleClose}
          className="group relative inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-[#3B3B3B] bg-white dark:bg-[#1f1f1f] px-4 py-2 text-sm text-slate-700 dark:text-slate-200 transition hover:bg-gray-100 dark:hover:bg-[#3B3B3B]"
        >
          <span>Close</span>
          <Image src="/icons/close_icon.png" alt="close" width={16} height={16} className="opacity-80 group-hover:opacity-100 dark:invert" />
        </button>
      </div>

      {/* Center visualizer */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative">
          <WaveformAnimation
            connected={connected}
            recording={recording}
            audioLevel={audioLevel}
            size={420}
          />

          {/* Microphone CTA */}
          <div className="absolute inset-0 grid place-items-center">
            <motion.button
              onClick={recording ? stopVoice : startVoice}
              disabled={!connected && !recording}
              className="group relative inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-[#3B3B3B] bg-white dark:bg-[#1f1f1f] p-4 transition disabled:opacity-60 hover:bg-gray-100 dark:hover:bg-[#3B3B3B]"
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: connected ? 1.03 : 1 }}
            >
              <div
                className={`relative flex h-16 w-16 items-center justify-center rounded-full ${
                  recording ? "bg-blue-600/90" : connected ? "bg-blue-600/90" : "bg-slate-600/80"
                } shadow-xl shadow-black/20`}
              >
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    boxShadow: recording
                      ? [
                          "0 0 0 0 rgba(37,99,235,0.30)",
                          "0 0 0 10px rgba(37,99,235,0)",
                        ]
                      : connected
                      ? [
                          "0 0 0 0 rgba(37,99,235,0.30)",
                          "0 0 0 10px rgba(37,99,235,0)",
                        ]
                      : "0 0 0 0 rgba(148,163,184,0)",
                  }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              </div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Bottom help text */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center px-6 pb-8">
        <div className="rounded-full border border-gray-200 dark:border-[#3B3B3B] bg-white dark:bg-[#1f1f1f] px-4 py-2 text-xs text-slate-600 dark:text-slate-300">
          {recording
            ? "Speaking… we’ll auto-detect when you stop"
            : connected
            ? "Tap the mic to talk — we’ll listen and respond in real-time"
            : "Connecting to live assistant…"}
        </div>
      </div>
    </div>
  );
}

// —— Helpers ——

function floatTo16BitPCM(input) {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function arrayBufferToBase64(buf) {
  let str = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str);
}

function base64ToArrayBuffer(b64) {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes.buffer;
}
