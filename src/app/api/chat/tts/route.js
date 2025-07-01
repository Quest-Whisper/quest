import { GoogleGenAI, Modality } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request) {
  const url = new URL(request.url);
  const message = url.searchParams.get("message") || "";

  // 1) Create a ReadableStream to push raw-PCM chunks as they arrive
  let controllerRef;
  let sessionRef;
  let connectionPromise;
  let connectionResolve;

  // Create a promise that resolves when connection is ready
  connectionPromise = new Promise((resolve) => {
    connectionResolve = resolve;
  });

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
    },
    cancel(reason) {
      if (sessionRef) {
        try {
          sessionRef.close();
        } catch (e) {
          // Silent cleanup
        }
      }
    },
  });

  // 2) Set up Gemini WebSocket callbacks to enqueue each Base64 → Buffer chunk
  const callbacks = {
    onopen: () => {
      connectionResolve();
    },
    onmessage: (msg) => {
      // Check for audio data in the correct location: serverContent.modelTurn.parts[0].inlineData.data
      let data = null;
      
      if (msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
        data = msg.serverContent.modelTurn.parts[0].inlineData.data;
      } else if (msg.serverContent?.media?.data) {
        data = msg.serverContent.media.data;
      }
      
      if (data && controllerRef) {
        const buf = Buffer.from(data, "base64");
        try {
          controllerRef.enqueue(buf);
        } catch (enqueueError) {
          // Silent error handling
        }
      }
    },
    onerror: (err) => {
      if (controllerRef) {
        controllerRef.error(err);
      }
    },
    onclose: () => {
      if (controllerRef) {
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
    sessionRef = await ai.live.connect({
      model: "gemini-2.5-flash-preview-native-audio-dialog",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Algenib" } },
        },
        systemInstruction: {
          parts: [
            {
              text: "You are a text-to-speech system. Your only job is to read the exact text provided by the user aloud, without adding any commentary, responses, or additional content. Simply speak the text as given."
            }
          ]
        }
      },
      callbacks,
    });

    // Wait for the WebSocket to actually open
    await connectionPromise;

  } catch (err) {
    return new NextResponse("Connection error", { status: 500 });
  }

  // 4) Send the user's text turn with clear instruction to just read it
  try {
    sessionRef.sendClientContent({
      turns: [{ parts: [{ text: `Please read this text exactly as written: "${message}"` }] }],
      turnComplete: true,
    });
  } catch (err) {
    return new NextResponse("Send error", { status: 500 });
  }

  // 5) Return the streaming response
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "audio/pcm",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
