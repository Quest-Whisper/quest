"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { 
  testAudioContext, 
  fetchAndPlayStreaming, 
  fetchAndPlaySimple, 
  stopAudio 
} from "../utils/audioUtils";
import { stripMarkdown } from "../utils/messageUtils";
import toast from "react-hot-toast";

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [audioNodes, setAudioNodes] = useState([]);
  const [wavUrl, setWavUrl] = useState(null);

  // Use refs for stable references to avoid dependency loops
  const abortControllerRef = useRef(null);
  const audioNodesRef = useRef([]);

  // Keep refs in sync with state
  useEffect(() => {
    abortControllerRef.current = abortController;
  }, [abortController]);

  useEffect(() => {
    audioNodesRef.current = audioNodes;
  }, [audioNodes]);

  // AudioContext configured once
  const audioContext = useMemo(() => {
    if (typeof window !== "undefined") {
      const ctx = new AudioContext();
      return ctx;
    }
    return null;
  }, []);

  // Cleanup function to stop all audio - using refs to avoid dependency loops
  const stopAllAudio = useCallback(() => {
    stopAudio({ 
      abortController: abortControllerRef.current, 
      setAbortController, 
      audioNodes: audioNodesRef.current, 
      setAudioNodes, 
      setIsPlaying, 
      setIsLoading 
    });
  }, []); // Empty dependency array since we use refs

  // Fallback to simple audio playback
  const fallbackToSimple = useCallback((text) => {
    return fetchAndPlaySimple(text, {
      setIsLoading,
      setIsPlaying,
      setAbortController,
      setAudioNodes,
      stripMarkdown
    });
  }, []);

  // Play audio with streaming
  const playAudio = useCallback(async (text) => {
    if (isPlaying || isLoading) {
      // Stop audio if currently playing or loading
      stopAllAudio();
      return;
    }

    // First test if audio is working
    const audioWorking = await testAudioContext(audioContext);

    if (!audioWorking) {
      toast.error("Audio not available - check browser permissions");
      return;
    }

    // Wait a moment after the test beep
    setTimeout(() => {
      fetchAndPlayStreaming(text, {
        audioContext,
        setIsLoading,
        setIsPlaying,
        setAbortController,
        setAudioNodes,
        stripMarkdown,
        fallbackToSimple
      });
    }, 500);
  }, [audioContext, isPlaying, isLoading, stopAllAudio, fallbackToSimple]);

  // Cleanup on unmount - now safe with stable stopAllAudio
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [stopAllAudio]);

  return {
    isPlaying,
    isLoading,
    wavUrl,
    playAudio,
    stopAudio: stopAllAudio
  };
} 