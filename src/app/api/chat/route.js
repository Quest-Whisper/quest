import { NextResponse } from "next/server";
import { generateChatCompletion } from "@/lib/largeLanguageModel";
import connectToDatabase from "@/lib/mongodb";
import Chat from "@/models/Chat";

import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";


// Helper function to save chat directly to the database
async function saveChat(messages, context) {
  try {
    // Find existing chat for this company
    const chat = await Chat.findOne({ userId: context.userId });

    if (chat) {
      // Update existing chat
      chat.messages.push(
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp || Date.now()),
          user: msg.user,
        }))
      );
      await chat.save();
    } else {
      // Create new chat
      await Chat.create({
        userId: context.userId,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp || Date.now()),
          user: msg.user,
        })),
      });
    }
    return true;
  } catch (error) {
    console.error("Error saving chat directly:", error);
    return false;
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    const { messages, context } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase();

    // Get the latest user message
    const latestMessage = messages[messages.length - 1];

    //get past messages to add to the conversation
    const pastMessages = [...messages.slice(-20)]; // Only use the last 50 user messages

    // Generate AI response
    const response = await generateChatCompletion(session,latestMessage,pastMessages);

    // Save the conversation with context directly (background task)
    const chatMessages = [
      {
        role: "user",
        content: latestMessage.content,
        timestamp: new Date(),
        user: context,
      },
      { role: "model", content: response, timestamp: new Date() },
    ];

    // // Don't wait for the save to complete before responding
    saveChat(chatMessages, context).catch((err) =>
      console.error("Background save error:", err)
    );
    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error in chat API:", error);

    // If the error was due to parsing the request body or other errors
    return NextResponse.json(
      {
        response:
          "I encountered an error processing your request. Please try again.",
      },
      { status: 200 }
    );
  }
}
