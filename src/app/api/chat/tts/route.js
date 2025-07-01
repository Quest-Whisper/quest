import { GoogleGenAI, Modality } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request) {
  console.log("[TTS] GET handler start");
  const url = new URL(request.url);
  const message = url.searchParams.get("message") || "";
  console.log("[TTS] message =", message);

  // 1) Create a ReadableStream to push raw-PCM chunks as they arrive
  let controllerRef;
  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
    },
    cancel(reason) {
      console.error("[TTS] stream cancelled:", reason);
    },
  });

  // 2) Set up Gemini WebSocket callbacks to enqueue each Base64 → Buffer chunk
  const callbacks = {
    onopen: () => {
      console.log("[TTS] WS opened");
    },
    onmessage: (msg) => {
      console.log("[TTS] onmessage: chunk received");
      const data = msg.serverContent?.media?.data;
      if (data) {
        const buf = Buffer.from(data, "base64");
        console.log("[TTS]   chunk size:", buf.length);
        controllerRef.enqueue(buf);
      }
    },
    onerror: (err) => {
      console.error("[TTS] WS error:", err);
      controllerRef.error(err);
    },
    onclose: () => {
      console.log("[TTS] WS closed; ending stream");
      controllerRef.close();
    },
  };

  // 3) Init Gemini client & connect
  console.log("[TTS] creating GoogleGenAI client");
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    apiVersion: "v1alpha",
  });
  let session;
  try {
    session = await ai.live.connect({
      model: "gemini-2.5-flash-preview-native-audio-dialog",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Algenib" } },
        },
      },
      callbacks,
    });
    console.log("[TTS] live.connect resolved, session ready");
  } catch (err) {
    console.error("[TTS] live.connect failed:", err);
    return new NextResponse("Connection error", { status: 500 });
  }

  // 4) Send the user’s text turn
  console.log("[TTS] sending client content");
  session.sendClientContent({
    turns: [{ parts: [{ text: message }] }],
    turnComplete: true,
  });
  console.log("[TTS] sendClientContent called");

  // 5) Return the streaming response
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "audio/pcm",
      // Note: Transfer-Encoding: chunked is implied
    },
  });
}
