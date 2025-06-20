import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

function stripMarkdown(md) {
    return md
      // Remove code blocks (```…```)
      .replace(/```[\s\S]*?```/g, '')
      // Unwrap inline code `…`
      .replace(/`([^`\n]+)`/g, '$1')
      // Remove ATX headings (e.g. “### Heading” → “Heading”)
      .replace(/^#{1,6}\s*(.*)$/gm, '$1')
      // Remove setext headings (overlines/underlines)
      .replace(/^(?:=+|-+)\s*$/gm, '')
      // Remove images ![alt](url)
      .replace(/!\[.*?\]\(.*?\)/g, '')
      // Unwrap links [text](url) → text
      .replace(/\[([^\]]+)\]\((?:.|\s)*?\)/g, '$1')
      // Remove bold **text** or __text__
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      // Remove emphasis *text* or _text_
      .replace(/(\*|_)(.*?)\1/g, '$2')
      // Remove blockquotes > …
      .replace(/^\s{0,3}>\s?/gm, '')
      // Remove unordered list markers -, *, +
      .replace(/^\s*([-*+])\s+/gm, '')
      // Remove ordered list numbers “1. ”
      .replace(/^\s*\d+\.\s+/gm, '')
      // Remove horizontal rules (---, ***, ___)
      .replace(/^(?:-{3,}|\*{3,}|_{3,})\s*$/gm, '')
      // Strip any remaining HTML tags
      .replace(/<\/?[^>]+(>|$)/g, '')
      // Collapse multiple blank lines
      .replace(/\n{2,}/g, '\n\n')
      .trim();
  }
  
export async function GET(request) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const { searchParams } = new URL(request.url);
  const message = searchParams.get('message'); 

  console.log("Message : "+ message )

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: "Say professionally: "+message }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Kore" },
        },
      },
    },
  });


  const base64Data =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Data) {
    console.error(
      "Invalid Gemini API response:",
      JSON.stringify(response, null, 2)
    );
    return new NextResponse(
      JSON.stringify({ error: "No audio data received from Gemini API" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const audioBuffer = Buffer.from(base64Data, "base64");

  return new NextResponse(audioBuffer, {
    headers: {
      "Content-Type": "audio/wav",
    },
  });
}
