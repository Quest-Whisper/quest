import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import os from 'os';
import path from 'path';

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (20MB limit)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 20MB.' },
        { status: 400 }
      );
    }

    // Create a temporary file
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = os.tmpdir();
    const tempFileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${file.type.split('/')[1]}`;
    const tempFilePath = path.join(tempDir, tempFileName);
    
    // Write buffer to temporary file
    fs.writeFileSync(tempFilePath, buffer);

    try {
      // Initialize the GenAI client
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      // Upload the file using the file path
      const uploadResult = await ai.files.upload({
        file: tempFilePath,
        config: {
          mimeType: file.type,
          displayName: file.name || `image_${Date.now()}`,
        },
      });

      // Clean up the temporary file
      fs.unlinkSync(tempFilePath);

      // Wait for file processing
      let fileInfo = await ai.files.get({ name: uploadResult.name });
      
      // Poll for processing completion with timeout
      const maxAttempts = 30; // 30 seconds max
      let attempts = 0;
      
      while (fileInfo.state === 'PROCESSING' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        fileInfo = await ai.files.get({ name: uploadResult.name });
        attempts++;
      }

      if (fileInfo.state === 'FAILED') {
        return NextResponse.json(
          { error: 'File processing failed' },
          { status: 500 }
        );
      }

      if (fileInfo.state === 'PROCESSING') {
        return NextResponse.json(
          { error: 'File processing timeout' },
          { status: 408 }
        );
      }

      return NextResponse.json({
        success: true,
        file: {
          uri: fileInfo.uri,
          name: fileInfo.displayName,
          mimeType: fileInfo.mimeType,
          sizeBytes: fileInfo.sizeBytes,
          createTime: fileInfo.createTime
        }
      });

    } catch (error) {
      // Clean up the temporary file in case of error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw error;
    }

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file: ' + error.message },
      { status: 500 }
    );
  }
} 