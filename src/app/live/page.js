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
import { QUEST_VOICE_SYSTEM_PROMPT } from "@/lib/quest-voice-system-prompt";

export default function LiveVoiceChat() {
  const [token, setToken] = useState(null);
  const [connected, setConnected] = useState(false);
  const [recording, setRec] = useState(false);

  const sessionRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const workletRef = useRef(null);
  const isStreaming = useRef(false);

  const { data: session } = useSession();

  ////////////////////////////////////////////////////////////////////////////////
  // MCP TOOL HELPER FUNCTION
  ////////////////////////////////////////////////////////////////////////////////

  //   const executeServerTool = async (toolName, args) => {
  //     console.log(`Making API call to /api/tools/mcp for ${toolName}:`, args);

  //     const response = await fetch("/api/tools/mcp", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ toolName, args }),
  //     });

  //     console.log(`API response status for ${toolName}:`, response.status);

  //     if (!response.ok) {
  //       const error = await response.json();
  //       console.error(`API error for ${toolName}:`, error);
  //       throw new Error(error.error || "Tool execution failed");
  //     }

  //     const result = await response.json();
  //     console.log(`API response for ${toolName}:`, result);
  //     return result;
  //   };

  ////////////////////////////////////////////////////////////////////////////////
  // MCP TOOL DEFINITIONS
  ////////////////////////////////////////////////////////////////////////////////

  //   const mcpTools = [
  //     {
  //       name: "listModels",
  //       description: "This tool lists all available models in the database",
  //       parameters: { type: "OBJECT", properties: {}, required: [] },
  //       execute: async () => {
  //         return await executeServerTool("listModels", {});
  //       },
  //     },
  //     {
  //       name: "getModelSchema",
  //       description: "This tool gets the schema for a specific model",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           modelName: { type: "STRING", description: "Name of the model" },
  //         },
  //         required: ["modelName"],
  //       },
  //       execute: async ({ modelName }) => {
  //         requireParams({ modelName }, "modelName");
  //         return await executeServerTool("getModelSchema", { modelName });
  //       },
  //     },
  //     {
  //       name: "aggregate",
  //       description: "This tool to run all aggregation pipelines",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           modelName: {
  //             type: "STRING",
  //             description: "Name of the Mongoose model",
  //           },
  //           pipeline: {
  //             type: "ARRAY",
  //             items: { type: "OBJECT" },
  //             description: "Aggregation stages",
  //           },
  //         },
  //         required: ["modelName", "pipeline"],
  //       },
  //       execute: async (params) => {
  //         requireParams(params, "modelName", "pipeline");
  //         if (!Array.isArray(params.pipeline)) {
  //           throw new Error("Pipeline must be an array");
  //         }
  //         return await executeServerTool("aggregate", params);
  //       },
  //     },
  //     {
  //       name: "googleSearch",
  //       description:
  //         "Use this tool to search Google and return relevant results from the web",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           query: { type: "STRING", description: "Search query" },
  //           num: { type: "NUMBER", description: "Results to return (1–10)" },
  //           page: { type: "NUMBER", description: "Page number (1-based)" },
  //           site: { type: "STRING", description: "Limit to a website" },
  //           language: { type: "STRING", description: "ISO 639-1 code" },
  //           dateRestrict: {
  //             type: "STRING",
  //             description: "e.g., 'm6' = last 6 months",
  //           },
  //           exactTerms: { type: "STRING", description: "Exact phrase" },
  //           resultType: { type: "STRING", description: "news | images" },
  //         },
  //         required: ["query"],
  //       },
  //       execute: async (params) => {
  //         requireParams(params, "query");
  //         return await executeServerTool("googleSearch", params);
  //       },
  //     },
  //     {
  //       name: "extractWebpageContent",
  //       description:
  //         "Use this tool to extract and analyze content from a webpage, converting it to readable text",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           url: { type: "STRING", description: "Webpage URL" },
  //           format: {
  //             type: "STRING",
  //             description: "markdown | html | text (default markdown)",
  //           },
  //         },
  //         required: ["url"],
  //       },
  //       execute: async (params) => {
  //         requireParams(params, "url");
  //         return await executeServerTool("extractWebpageContent", params);
  //       },
  //     },
  //     {
  //       name: "extractMultipleWebpages",
  //       description:
  //         "Use this tool to extract and analyze content from multiple webpages in a single request",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           urls: {
  //             type: "ARRAY",
  //             items: { type: "STRING" },
  //             description: "Array of URLs (max 5)",
  //           },
  //           format: {
  //             type: "STRING",
  //             description: "markdown | html | text (default markdown)",
  //           },
  //         },
  //         required: ["urls"],
  //       },
  //       execute: async (params) => {
  //         requireParams(params, "urls");
  //         if (!Array.isArray(params.urls) || params.urls.length === 0) {
  //           throw new Error("urls must be a non-empty array");
  //         }
  //         return await executeServerTool("extractMultipleWebpages", params);
  //       },
  //     },
  //     // Gmail Tools
  //     {
  //       name: "listGmailMessages",
  //       description: "To get user's inbox messages",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           userId: { type: "STRING", description: "User ID" },
  //           maxResults: {
  //             type: "NUMBER",
  //             description: "Maximum number of results to return (default 10)",
  //           },
  //           q: {
  //             type: "STRING",
  //             description: "Search query for filtering emails",
  //           },
  //         },
  //         required: ["userId"],
  //       },
  //       execute: async (params) => {
  //         requireParams(params, "userId");
  //         return await executeServerTool("listGmailMessages", params);
  //       },
  //     },
  //     {
  //       name: "getGmailMessage",
  //       description: "To read full email content",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           userId: { type: "STRING", description: "User ID" },
  //           messageId: { type: "STRING", description: "Gmail message ID" },
  //         },
  //         required: ["userId", "messageId"],
  //       },
  //       execute: async (params) => {
  //         requireParams(params, "userId", "messageId");
  //         return await executeServerTool("getGmailMessage", params);
  //       },
  //     },
  //     {
  //       name: "gmailSendEmail",
  //       description: "To send emails via Gmail",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           userId: { type: "STRING", description: "User ID" },
  //           to: { type: "STRING", description: "Recipient email address" },
  //           subject: { type: "STRING", description: "Email subject" },
  //           body: { type: "STRING", description: "Email body content" },
  //           contentType: {
  //             type: "STRING",
  //             description: "Content type (default: text/plain)",
  //           },
  //         },
  //         required: ["userId", "to", "subject", "body"],
  //       },
  //       execute: async (params) => {
  //         requireParams(params, "userId", "to", "subject", "body");
  //         return await executeServerTool("gmailSendEmail", params);
  //       },
  //     },
  //     // Drive Tools
  //     {
  //       name: "driveListFiles",
  //       description: "To search and list files in Google Drive",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           userId: { type: "STRING", description: "User ID" },
  //           pageSize: {
  //             type: "NUMBER",
  //             description: "Number of files to return (default 10)",
  //           },
  //           q: {
  //             type: "STRING",
  //             description: "Search query for filtering files",
  //           },
  //         },
  //         required: ["userId"],
  //       },
  //       execute: async (params) => {
  //         requireParams(params, "userId");
  //         return await executeServerTool("driveListFiles", params);
  //       },
  //     },
  //     {
  //       name: "driveGetFile",
  //       description: "To get specific file metadata",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           userId: { type: "STRING", description: "User ID" },
  //           fileId: { type: "STRING", description: "Google Drive file ID" },
  //         },
  //         required: ["userId", "fileId"],
  //       },
  //       execute: async (params) => {
  //         requireParams(params, "userId", "fileId");
  //         return await executeServerTool("driveGetFile", params);
  //       },
  //     },
  //     // Google Docs Tools
  //     {
  //       name: "docsReadDocument",
  //       description: "To extract text from Google Docs",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           userId: { type: "STRING", description: "User ID" },
  //           documentId: { type: "STRING", description: "Google Doc ID" },
  //         },
  //         required: ["userId", "documentId"],
  //       },
  //       execute: async (params) => {
  //         requireParams(params, "userId", "documentId");
  //         return await executeServerTool("docsReadDocument", params);
  //       },
  //     },
  //     {
  //       name: "docsCreateDocument",
  //       description: "To create new Google Docs",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           userId: { type: "STRING", description: "User ID" },
  //           name: { type: "STRING", description: "Document name" },
  //           content: { type: "STRING", description: "Initial document content" },
  //           parentFolderId: {
  //             type: "STRING",
  //             description: "Optional parent folder ID",
  //           },
  //         },
  //         required: ["userId", "name"],
  //       },
  //       execute: async (params) => {
  //         requireParams(params, "userId", "name");
  //         return await executeServerTool("docsCreateDocument", params);
  //       },
  //     },
  //     // Google Slides Tools
  //     {
  //       name: "slidesCreatePresentation",
  //       description: "To create presentations with slides",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           userId: { type: "STRING", description: "User ID" },
  //           title: { type: "STRING", description: "Presentation title" },
  //           slidesData: {
  //             type: "ARRAY",
  //             items: {
  //               type: "OBJECT",
  //               properties: {
  //                 title: { type: "STRING" },
  //                 subtitle: { type: "STRING" },
  //                 caption: { type: "STRING" },
  //                 imageUrl: { type: "STRING" },
  //                 backgroundColor: { type: "OBJECT" },
  //                 titleStyle: { type: "OBJECT" },
  //                 subtitleStyle: { type: "OBJECT" },
  //                 captionStyle: { type: "OBJECT" },
  //               },
  //             },
  //             description: "Array of slide data objects",
  //           },
  //         },
  //         required: ["userId", "title"],
  //       },
  //       execute: async (params) => {
  //         requireParams(params, "userId", "title");
  //         return await executeServerTool("slidesCreatePresentation", params);
  //       },
  //     },
  //     {
  //       name: "slidesReadPresentation",
  //       description: "To read existing presentation content",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           userId: { type: "STRING", description: "User ID" },
  //           presentationId: { type: "STRING", description: "Presentation ID" },
  //         },
  //         required: ["userId", "presentationId"],
  //       },
  //       execute: async (params) => {
  //         requireParams(params, "userId", "presentationId");
  //         return await executeServerTool("slidesReadPresentation", params);
  //       },
  //     },
  //     // Google Sheets Tools
  //     {
  //       name: "sheetsReadSpreadsheet",
  //       description: "To read data from spreadsheets",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           userId: { type: "STRING", description: "User ID" },
  //           spreadsheetId: { type: "STRING", description: "Spreadsheet ID" },
  //           range: {
  //             type: "STRING",
  //             description: "Range to read (default: Sheet1!A1:Z1000)",
  //           },
  //         },
  //         required: ["userId", "spreadsheetId"],
  //       },
  //       execute: async (params) => {
  //         requireParams(params, "userId", "spreadsheetId");
  //         return await executeServerTool("sheetsReadSpreadsheet", params);
  //       },
  //     },
  //     // Google Forms Tools
  //     {
  //       name: "formsCreateForm",
  //       description: "To create forms with questions",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           userId: { type: "STRING", description: "User ID" },
  //           title: { type: "STRING", description: "Form title" },
  //           questions: {
  //             type: "ARRAY",
  //             items: {
  //               type: "OBJECT",
  //               properties: {
  //                 title: { type: "STRING" },
  //                 type: { type: "STRING" },
  //                 options: { type: "ARRAY", items: { type: "STRING" } },
  //                 required: { type: "BOOLEAN" },
  //               },
  //             },
  //             description: "Array of question objects",
  //           },
  //         },
  //         required: ["userId", "title"],
  //       },
  //       execute: async (params) => {
  //         requireParams(params, "userId", "title");
  //         return await executeServerTool("formsCreateForm", params);
  //       },
  //     },
  //     {
  //       name: "formsReadForm",
  //       description: "To get form structure and responses",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           userId: { type: "STRING", description: "User ID" },
  //           formId: { type: "STRING", description: "Form ID" },
  //         },
  //         required: ["userId", "formId"],
  //       },
  //       execute: async (params) => {
  //         requireParams(params, "userId", "formId");
  //         return await executeServerTool("formsReadForm", params);
  //       },
  //     },
  //     // Google Calendar Tools
  //     {
  //       name: "calendarGetEvents",
  //       description: "To retrieve upcoming calendar events",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           userId: { type: "STRING", description: "User ID" },
  //           calendarId: {
  //             type: "STRING",
  //             description: "Calendar ID (default: primary)",
  //           },
  //           maxResults: {
  //             type: "NUMBER",
  //             description: "Maximum number of events to return (default 10)",
  //           },
  //         },
  //         required: ["userId"],
  //       },
  //       execute: async (params) => {
  //         requireParams(params, "userId");
  //         return await executeServerTool("calendarGetEvents", params);
  //       },
  //     },
  //     {
  //       name: "calendarCreateEvent",
  //       description: "To create new calendar events",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           userId: { type: "STRING", description: "User ID" },
  //           calendarId: {
  //             type: "STRING",
  //             description: "Calendar ID (default: primary)",
  //           },
  //           event: {
  //             type: "OBJECT",
  //             properties: {
  //               summary: { type: "STRING" },
  //               description: { type: "STRING" },
  //               start: { type: "OBJECT" },
  //               end: { type: "OBJECT" },
  //               attendees: { type: "ARRAY", items: { type: "OBJECT" } },
  //             },
  //             description: "Event object with details",
  //           },
  //         },
  //         required: ["userId", "event"],
  //       },
  //       execute: async (params) => {
  //         requireParams(params, "userId", "event");
  //         return await executeServerTool("calendarCreateEvent", params);
  //       },
  //     },
  //     // Unsplash Tools
  //     {
  //       name: "unsplashSearchImages",
  //       description: "To find images for presentations/documents",
  //       parameters: {
  //         type: "OBJECT",
  //         properties: {
  //           searchTerm: { type: "STRING", description: "Search term for images" },
  //         },
  //         required: ["searchTerm"],
  //       },
  //       execute: async (params) => {
  //         requireParams(params, "searchTerm");
  //         return await executeServerTool("unsplashSearchImages", params);
  //       },
  //     },
  //   ];

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
            console.log("🔌 Connected");
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

            // // Handle tool calls
            // if (msg.toolCall) {
            //   console.log("Tool call received:", msg.toolCall);
            //   await runTool(msg.toolCall);
            // }
          },
        },
      })
      .then((sess) => {
        sessionRef.current = sess;
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

  //   const runTool = async (toolCall) => {
  //     console.log("Running tool:", toolCall);

  //     const fcs = toolCall.functionCalls;
  //     if (!fcs || !fcs.length) return;

  //     // If the top‐level toolCall.id is missing, grab the first functionCall.id
  //     const envelopeId = toolCall.id ?? fcs[0].id;

  //     // Execute all functionCalls in parallel
  //     const responses = await Promise.all(
  //       fcs.map(async (fc) => {
  //         const { name: toolName, args, id: fnId } = fc;
  //         const tool = mcpTools.find((t) => t.name === toolName);

  //         if (!tool) {
  //           console.error(`Tool not found: ${toolName}`);
  //           return {
  //             id: fnId,
  //             name: toolName,
  //             response: JSON.stringify({ error: `Tool not found: ${toolName}` }),
  //           };
  //         }

  //         try {
  //           const result = await tool.execute(args);
  //           console.log(`Tool ${toolName} succeeded`, result);
  //           return {
  //             id: fnId,
  //             name: toolName,
  //             response: JSON.stringify(result),
  //           };
  //         } catch (err) {
  //           console.error(`Tool ${toolName} failed:`, err);
  //           return {
  //             id: fnId,
  //             name: toolName,
  //             response: JSON.stringify({ error: err.message }),
  //           };
  //         }
  //       })
  //     );

  //     // Send a single envelope back—now with a defined id field
  //     try {
  //       if (!sessionRef.current) return;
  //       const toolResponse = {
  //         id: envelopeId,
  //         functionResponses: responses,
  //       };
  //       console.log("Sending tool response:", toolResponse);
  //       sessionRef.current.sendToolResponse(toolResponse);
  //       console.log("Successfully sent tool responses");
  //     } catch (err) {
  //       console.error("Failed to send tool responses:", err);
  //     }
  //   };

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
    return;      // ← don’t process any parts of this turn
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

  return (
    <div style={{ padding: 20 }}>
      <button
        onClick={recording ? stopVoice : startVoice}
        disabled={!connected}
      >
        {recording ? "🛑 Stop" : "🎙️ Talk"}
      </button>
      {!connected && (
        <p style={{ color: "gray", marginTop: 8 }}>Connecting to Gemini…</p>
      )}
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
