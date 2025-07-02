import { GoogleGenAI, Modality } from "@google/genai";
import { NextResponse } from "next/server";

// Firebase App Hosting optimizations
export const runtime = "nodejs"; // Use Node.js runtime for better Firebase compatibility
export const dynamic = "force-dynamic"; // Ensure dynamic rendering for streaming
export const maxDuration = 60; // Firebase function timeout

export async function GET(request) {
  const url = new URL(request.url);
  const message = url.searchParams.get("message") || "";

  if (!message.trim()) {
    return new NextResponse("Message is required", { status: 400 });
  }

  // Check for API key
  if (!process.env.GEMINI_API_KEY) {
    return new NextResponse("API key not configured", { status: 500 });
  }



  // 1) Create a ReadableStream to push raw-PCM chunks as they arrive
  let controllerRef;
  let sessionRef;
  let isConnected = false;
  let connectionPromise;
  let connectionResolve;
  let connectionReject;
  let streamFinished = false;
  let totalChunks = 0;
  let totalBytesProcessed = 0;
  
  // Firebase memory management
  const MAX_BUFFER_SIZE = 20 * 1024 * 1024; // 20MB buffer limit for Firebase NOTE: 20MB of 16-bit PCM audio at 24kHz = ~7 minutes of speech

  // Create a promise that resolves when connection is ready
  connectionPromise = new Promise((resolve, reject) => {
    connectionResolve = resolve;
    connectionReject = reject;
  });

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
    },
    cancel(reason) {
      console.error("[TTS] Stream cancelled:", reason);
      streamFinished = true;
      if (sessionRef) {
        try {
          sessionRef.close();
        } catch (e) {
          console.error("[TTS] Error closing session:", e);
        }
      }
    },
  });

  // 2) Set up Gemini WebSocket callbacks to enqueue each Base64 → Buffer chunk
  const callbacks = {
    onopen: () => {
      isConnected = true;
      connectionResolve();
    },
    onmessage: (message) => {
      if (streamFinished) return;
      
      // Check for direct audio data first (this is the main audio stream)
      if (message.data) {
        try {
          // Validate base64 data before processing
          if (typeof message.data !== 'string' || message.data.length === 0) {
            return;
          }
          
          const buf = Buffer.from(message.data, "base64");
          
          // Validate buffer size (should be multiple of 2 for 16-bit PCM)
          if (buf.length % 2 !== 0) {
            return;
          }
          
          // Firebase memory check
          totalBytesProcessed += buf.length;
          if (totalBytesProcessed > MAX_BUFFER_SIZE) {
            if (controllerRef && !streamFinished) {
              streamFinished = true;
              controllerRef.close();
            }
            return;
          }
          
          totalChunks++;
          
          if (controllerRef && !streamFinished) {
            controllerRef.enqueue(buf);
          }
        } catch (bufferError) {
          // Silent error handling - no logs in production
        }
        return;
      }

      // Check for serverContent messages
      if (message.serverContent) {
        // Look for audio in modelTurn parts
        if (message.serverContent.modelTurn?.parts) {
          for (const part of message.serverContent.modelTurn.parts) {
            if (part.inlineData?.data && part.inlineData?.mimeType?.includes('audio')) {
              try {
                const buf = Buffer.from(part.inlineData.data, "base64");
                totalChunks++;
                
                if (controllerRef && !streamFinished) {
                  controllerRef.enqueue(buf);
                }
              } catch (bufferError) {
                // Silent error handling - no logs in production
              }
            }
          }
        }
        
        // Check for completion signals
        if (message.serverContent.turnComplete || message.serverContent.generationComplete) {
          if (controllerRef && !streamFinished) {
            streamFinished = true;
            controllerRef.close();
          }
        }
        
        // Check for errors
        if (message.serverContent.error) {
          if (controllerRef && !streamFinished) {
            streamFinished = true;
            controllerRef.error(new Error("Audio generation error"));
          }
        }
      }
    },
    onerror: (err) => {
      if (controllerRef && !streamFinished) {
        streamFinished = true;
        controllerRef.error(new Error("Connection error"));
      }
      connectionReject(new Error("Connection failed"));
    },
    onclose: (event) => {
      if (controllerRef && !streamFinished) {
        streamFinished = true;
        controllerRef.close();
      }
    },
  };

  // 3) Init Gemini client & connect
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    apiVersion: "v1alpha",
  });

  try {
    // Create the session with async iteration approach
    const session = await ai.live.connect({
      model: "gemini-2.0-flash-live-001",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } },
        },
        temperature: 0.7,
        maxOutputTokens: 10000,
      },
      callbacks,
    });
    
    sessionRef = session;

    // Wait for the WebSocket to actually open
    const connectionTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Connection timeout")), 15000);
    });
    
    await Promise.race([connectionPromise, connectionTimeout]);

    // 4) Send the user's text turn
    await session.sendClientContent({
      turns: [{ 
        role: "user",
        parts: [{ text: `Please say this text in a enthusiastic tone that matches it, just start saying the folloing without anything extra: "${message}"` }] 
      }],
      turnComplete: true,
    });

  } catch (err) {
    if (controllerRef && !streamFinished) {
      streamFinished = true;
      controllerRef.error(new Error("Service unavailable"));
    }
    return new NextResponse("Service temporarily unavailable", { status: 500 });
  }

  // 5) Set up a timeout to close the stream if no data is received
  setTimeout(() => {
    if (!streamFinished && totalChunks === 0) {
      if (controllerRef) {
        streamFinished = true;
        controllerRef.close();
      }
      if (sessionRef) {
        try {
          sessionRef.close();
        } catch (e) {
          // Silent cleanup
        }
      }
    }
  }, 30000); // 30 second timeout

  // 6) Return the streaming response with Firebase-optimized headers
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "audio/pcm",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Connection": "keep-alive",
      "Transfer-Encoding": "chunked",
      "X-Accel-Buffering": "no", // Disable nginx buffering for Firebase
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
