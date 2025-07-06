// components/LiveVoiceChat.jsx
"use client";

import { useEffect, useRef, useState } from "react";
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
    if (!token) return;

    const now = getCurrentDateTime();

    const ai = new GoogleGenAI({ apiKey: token, apiVersion: "v1alpha" });
    ai.live
      .connect({
        model: "gemini-2.0-flash-live-001",
        config: {
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } },
          },
          tools: [
            { googleSearch: {} }, // ← this hooks in the Google Search tool
          ],
          //   // 2) If you’re also doing function calls, keep your declarations:
          functionDeclarations: [],
          toolConfig: {
            functionCallingConfig: { mode: FunctionCallingConfigMode.ANY },
            singleUtterance: true,
          },
          responseModalities: [Modality.AUDIO],

          systemInstruction: QUEST_VOICE_SYSTEM_PROMPT.replace(
            "%USERDETAILS%",
            userDetails
          ).replace("%DATEDETAILS%", now),

          realtimeInputConfig: {
            automaticActivityDetection: {
              disabled: false,
              //   startOfSpeechSensitivity: "LOW", // values: VERY_LOW, LOW, MEDIUM, HIGH, VERY_HIGH
              //   endOfSpeechSensitivity: "MEDIUM",
              //   prefixPaddingMs: 250, // how much leading audio the server buffers before “start”
              //   silenceDurationMs: 200,
            }, // ensure VAD is on
            activityHandling: ActivityHandling.START_OF_ACTIVITY_INTERRUPTS,
          },
        },
        callbacks: {
          onopen: () => {
            setConnected(true);
          },
          onerror: (e) => console.error("Socket error:", e),
          onclose: () => {
            console.log("❌ Disconnected");
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
  }, [token]);

  // 3) Start streaming mic → Gemini
  const startVoice = async () => {
    if (!connected || recording) return;

    const sess = sessionRef.current;
    if (!sess) return console.error("Session not ready");

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioCtx = new AudioContext({ sampleRate: 16000 });
    await audioCtx.audioWorklet.addModule("/voice-processor.js");

    const source = audioCtx.createMediaStreamSource(stream);
    const worklet = new AudioWorkletNode(audioCtx, "voice-processor");
    source.connect(worklet).connect(audioCtx.destination);

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
  const CHUNK_TIMEOUT = 100; // ms to wait before playing buffered chunks

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
            await bufferAndPlayAudio(p.inlineData.data);
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

  const bufferAndPlayAudio = async (b64Data) => {
    const now = Date.now();

    // Convert incoming chunk to samples
    const bin = base64ToArrayBuffer(b64Data);
    const samples = new Int16Array(bin);

    // Add to chunks buffer
    audioChunks.push(samples);
    lastChunkTime = now;

    // If we're not already playing, schedule playback
    if (!isPlaying) {
      setTimeout(async () => {
        // Only play if we haven't received new chunks recently
        if (
          Date.now() - lastChunkTime >= CHUNK_TIMEOUT &&
          audioChunks.length > 0
        ) {
          isPlaying = true;
          try {
            await playBufferedAudio();
          } finally {
            isPlaying = false;
          }
        }
      }, CHUNK_TIMEOUT);
    }
  };

  const playBufferedAudio = async () => {
    if (audioChunks.length === 0) return;

    // Clean up any existing playback
    if (currentAudioContext) {
      currentSource?.stop();
      await currentAudioContext.close();
      currentAudioContext = null;
      currentSource = null;
    }

    try {
      // Calculate total length and combine chunks
      const totalLength = audioChunks.reduce(
        (sum, chunk) => sum + chunk.length,
        0
      );
      const combinedSamples = new Int16Array(totalLength);
      let offset = 0;
      for (const chunk of audioChunks) {
        combinedSamples.set(chunk, offset);
        offset += chunk.length;
      }

      // Convert to WAV format
      const wavHeader = makeWavHeader(combinedSamples.byteLength, 24000, 1, 16);
      const wavBuffer = new Uint8Array(
        wavHeader.byteLength + combinedSamples.byteLength
      );
      wavBuffer.set(new Uint8Array(wavHeader), 0);
      wavBuffer.set(
        new Uint8Array(combinedSamples.buffer),
        wavHeader.byteLength
      );

      // Create audio context and decode WAV data
      currentAudioContext = new AudioContext();
      const audioBuffer = await currentAudioContext.decodeAudioData(
        wavBuffer.buffer
      );

      // Play the audio
      currentSource = currentAudioContext.createBufferSource();
      currentSource.buffer = audioBuffer;
      currentSource.connect(currentAudioContext.destination);

      // Clear the chunks buffer
      audioChunks = [];

      return new Promise((resolve, reject) => {
        currentSource.onended = async () => {
          try {
            await currentAudioContext.close();
            currentAudioContext = null;
            currentSource = null;
            resolve();
          } catch (err) {
            reject(err);
          }
        };

        currentSource.start();
      });
    } catch (err) {
      console.error("Playback error:", err);
      // Clear buffers on error
      audioChunks = [];
      throw err;
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

  return (
    <div className="flex flex-col justify-center relative items-center h-[100vh] w-[100vw]">
      <div className="absolute top-1/2 transform -translate-y-1/2">
        <WaveformAnimation
          connected={connected}
          recording={recording}
          audioLevel={audioLevel}
          size={120}
        />
      </div>

      <div className="flex justify-center w-[100vw] h-fit py-[10px] absolute bottom-[20px] left-0 right-0">
      <button
        onClick={recording ? stopVoice : startVoice}
        disabled={!connected}
      >
        {recording ? "🛑 Stop" : "🎙️ Talk"}
      </button>
      {!connected && (
        <p style={{ color: "gray", marginTop: 8 }}>Connecting to Gemini…</p>
      )}

        {/* Voice Chat Button */}
        <motion.button
          className="relative group absolute justify-start item-start cursor-pointer"
          onClick={handleClose}
        >
          <div className="flex h-[64px] w-[64px] border border-[#CCD6DD] p-[15px] rounded-full bg-[#E1E8ED] justify-center">
            <img
              src="/icons/cancel_icon.png"
              alt="cancel icon"
              className="object-fit p-[6px]"
            />
          </div>
        </motion.button>
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
