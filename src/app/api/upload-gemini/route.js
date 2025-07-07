import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { tmpdir } from "os";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a temporary file path for upload
    const tempFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const tempFilePath = path.join(tmpdir(), tempFileName);
    
    try {
      // Write file to temporary location
      await writeFile(tempFilePath, buffer);

      // Upload to Gemini File API
      const uploadedFile = await ai.files.upload({
        file: tempFilePath,
        config: { 
          mimeType: file.type,
          displayName: file.name
        },
      });

      console.log("Uploaded file to Gemini:", uploadedFile);

      // For video files, we need to wait for processing
      if (file.type.startsWith('video/')) {
        let processedFile = uploadedFile;
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes max wait time
        
        while (processedFile.state !== "ACTIVE" && attempts < maxAttempts) {
          console.log("Processing video...", processedFile.state);
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          processedFile = await ai.files.get({ name: uploadedFile.name });
          attempts++;
        }
        
        if (attempts >= maxAttempts) {
          throw new Error("Video processing timeout");
        }
        
        uploadedFile.state = processedFile.state;
      }

      // Clean up temporary file
      await unlink(tempFilePath);

      return NextResponse.json({
        success: true,
        geminiFile: {
          name: uploadedFile.name,
          uri: uploadedFile.uri,
          mimeType: uploadedFile.mimeType,
          displayName: file.name,
          size: file.size,
          state: uploadedFile.state
        }
      });

    } catch (uploadError) {
      // Clean up temporary file on error
      try {
        await unlink(tempFilePath);
      } catch (cleanupError) {
        console.error("Error cleaning up temp file:", cleanupError);
      }
      throw uploadError;
    }

  } catch (error) {
    console.error("Error uploading file to Gemini:", error);
    return NextResponse.json(
      { error: "Failed to upload file to Gemini: " + error.message },
      { status: 500 }
    );
  }
} 