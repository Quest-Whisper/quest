/**
 * Audio utilities for TTS and audio playback functionality
 */

// Minimal WAV header builder for 16-bit PCM @ 24 kHz mono
export function makeWavHeader(dataLength, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
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

// Test function to verify AudioContext is working
export async function testAudioContext(audioContext) {
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
}

// Fetch and play audio using simple audio element (fallback)
export async function fetchAndPlaySimple(message, { setIsLoading, setIsPlaying, setAbortController, setAudioNodes, stripMarkdown }) {
  const controller = new AbortController();
  setAbortController(controller);
  setIsLoading(true);

  try {
    // stripMarkdown is passed as a dependency
    const txt = stripMarkdown(message);

    // Fetch raw PCM
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

    // Build WAV container
    const header = makeWavHeader(pcm.length, 24000, 1, 16);
    const wavBuffer = new Uint8Array(header.byteLength + pcm.length);
    wavBuffer.set(new Uint8Array(header), 0);
    wavBuffer.set(pcm, header.byteLength);

    // Play via a normal <audio> element
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
  } catch (err) {
    setIsLoading(false);
    setIsPlaying(false);
    setAbortController(null);
    setAudioNodes([]);
    // Silent error handling
  }
}

// Streaming audio playback
export async function fetchAndPlayStreaming(
  text, 
  { 
    audioContext, 
    setIsLoading, 
    setIsPlaying, 
    setAbortController, 
    setAudioNodes, 
    stripMarkdown,
    fallbackToSimple 
  }
) {
  if (!audioContext) {
    throw new Error("Audio context not available");
  }

  // Create abort controller for this request
  const controller = new AbortController();
  setAbortController(controller);
  setIsLoading(true);

  try {
    // Ensure AudioContext is resumed
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    // Kick off fetch with Firebase-optimized headers
    const res = await fetch(
      `/api/chat/tts?message=${encodeURIComponent(stripMarkdown(text))}`,
      {
        cache: "no-store",
        headers: {
          Accept: "audio/pcm",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Connection: "keep-alive",
          "X-Requested-With": "XMLHttpRequest",
        },
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      throw new Error(`TTS API error: ${res.status} ${res.statusText}`);
    }

    // Confirm streaming support
    if (!res.body) {
      return fallbackToSimple(text);
    }

    const reader = res.body.getReader();

    // Set up streaming audio playback using AudioBufferSourceNode scheduling
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

    // Function to schedule and play audio chunks
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

    // Timer to regularly schedule audio chunks
    const audioTimer = setInterval(() => {
      if (!controller.signal.aborted) {
        scheduleAudioChunk();
      } else {
        clearInterval(audioTimer);
      }
    }, 50); // Check every 50ms

    // Read and process streaming chunks - START IMMEDIATELY
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
                      setAudioNodes((prev) =>
                        prev.filter((node) => node !== sourceNode)
                      );
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
        const isAborted =
          controller.signal.aborted ||
          streamError.name === "AbortError" ||
          streamError.message?.includes("aborted");

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
          fallbackToSimple(text);
        }
      }
    };

    // Start processing immediately, don't wait
    processStream();
  } catch (err) {
    // Check if this is an intentional abort
    const isAborted =
      controller.signal.aborted ||
      err.name === "AbortError" ||
      err.message?.includes("aborted");

    setIsLoading(false);
    setIsPlaying(false);
    setAbortController(null);

    // Only fallback if not aborted (genuine error)
    if (!isAborted) {
      fallbackToSimple(text);
    }
  }
}

// Cleanup function to stop all audio
export function stopAudio({ abortController, setAbortController, audioNodes, setAudioNodes, setIsPlaying, setIsLoading }) {
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
} 