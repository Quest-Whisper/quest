import { GoogleGenAI, Modality } from "@google/genai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadGeneratedImageToFirebase } from "@/lib/firebase";
import connectToDatabase from "@/lib/mongodb";
import Chat from "@/models/Chat";
import { generateConversationTitle } from "@/lib/largeLanguageModel";

export async function POST(req) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }



    // Ensure proper content type
    if (!req.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    // Get the raw body text
    const bodyText = await req.text();

    // Try to parse the JSON
    let requestData;
    try {
      requestData = JSON.parse(bodyText);
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { prompt, chatId, context } = requestData;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }



    // Initialize Gemini AI
    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_AI_API_KEY
    });

    // Generate image using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    // Extract image data from response
    let imageData = null;
    let description = null;

    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        description = part.text;
      } else if (part.inlineData) {
        imageData = part.inlineData.data;
      }
    }

    if (!imageData) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }

    // Convert base64 to blob for Firebase upload
    const buffer = Buffer.from(imageData, 'base64');
    const blob = new Blob([buffer], { type: 'image/png' });

    // Upload the image to Firebase
    const uploadResult = await uploadGeneratedImageToFirebase(
      blob,
      session.user.id,
      prompt
    );

    let attachment = null;
    if (uploadResult.success) {
      attachment = {
        url: uploadResult.url,
        type: uploadResult.type,
        displayName: uploadResult.displayName,
        size: uploadResult.size,
        category: uploadResult.category,
        isGenerated: uploadResult.isGenerated,
        prompt: uploadResult.prompt
      };
    }

    // Now create/update the chat after successful image generation
    try {
      await connectToDatabase();

      // Prepare messages for saving
      const userMessage = {
        role: "user",
        content: prompt,
        timestamp: new Date(),
        user: {
          name: context?.userName || session?.user?.name || "User",
          email: context?.userEmail || session?.user?.email || "user@example.com",
        },
        attachments: null,
      };

      const aiMessage = {
        role: "model",
        content: prompt, // Use the prompt as content for image generation
        timestamp: new Date(),
        isImageGeneration: true,
        imageDescription: description || `Generated image: ${prompt}`,
        attachments: attachment ? [attachment] : null,
      };

      let chatResult;
      if (chatId) {
        // Update existing chat
        const chat = await Chat.findById(chatId);
        if (!chat) {
          return NextResponse.json({ error: "Chat not found" }, { status: 404 });
        }
        
        chat.messages.push(userMessage, aiMessage);
        await chat.save();
        
        chatResult = { chatId: chat._id, isNew: false };
      } else {
        // Create new chat
        const title = await generateConversationTitle(userMessage.content, `Generated image: ${prompt}`);
        
        const newChat = await Chat.create({
          userId: session.user.id,
          title: title,
          messages: [userMessage, aiMessage],
        });
        
        chatResult = { chatId: newChat._id, isNew: true };
      }

      return NextResponse.json({
        success: true,
        imageData: imageData, // Keep sending base64 for immediate display
        description: description || `Generated image: ${prompt}`,
        attachment: attachment,
        chatId: chatResult.chatId,
        isNewChat: chatResult.isNew
      });

    } catch (dbError) {
      // Still return the image data even if database save fails
      return NextResponse.json({
        success: true,
        imageData: imageData,
        description: description || `Generated image: ${prompt}`,
        attachment: attachment,
        error: 'Failed to save chat, but image generation succeeded'
      });
    }

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}