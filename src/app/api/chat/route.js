import { NextResponse } from "next/server";
import { generateChatCompletion, generateConversationTitle } from "@/lib/largeLanguageModel";
import connectToDatabase from "@/lib/mongodb";
import Chat from "@/models/Chat";

import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

// Helper function to save chat messages to a specific chat instance
async function saveChat(userMessage, aiMessage, context, chatId = null) {
  try {
    if (chatId) {
      // Update existing chat
      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }
      
      // Add new messages
      chat.messages.push(
        {
          role: userMessage.role,
          content: userMessage.content,
          timestamp: new Date(userMessage.timestamp || Date.now()),
          user: userMessage.user,
        },
        {
          role: aiMessage.role,
          content: aiMessage.content,
          timestamp: new Date(aiMessage.timestamp || Date.now()),
        }
      );
      
      await chat.save();
      return { chatId: chat._id, isNew: false };
    } else {
      // Create new chat instance with AI-generated title
      const title = await generateConversationTitle(userMessage.content, aiMessage.content);
      
      const newChat = await Chat.create({
        userId: context.userId,
        title: title,
        messages: [
          {
            role: userMessage.role,
            content: userMessage.content,
            timestamp: new Date(userMessage.timestamp || Date.now()),
            user: userMessage.user,
          },
          {
            role: aiMessage.role,
            content: aiMessage.content,
            timestamp: new Date(aiMessage.timestamp || Date.now()),
          }
        ],
      });
      
      return { chatId: newChat._id, isNew: true };
    }
  } catch (error) {
    console.error("Error saving chat:", error);
    throw error;
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase();

    // Get all chat instances for the user
    const chats = await Chat.find({ userId: session.user.id })
      .sort({ updatedAt: -1 })
      .select('_id title messages createdAt updatedAt')
      .lean();

    // Format the response
    const formattedChats = chats.map(chat => ({
      id: chat._id,
      title: chat.title,
      messages: chat.messages,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messageCount: chat.messages.length
    }));

    return NextResponse.json({ chats: formattedChats });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { chatId } = await request.json();

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase();

    // Delete the chat instance (only if it belongs to the user)
    const deletedChat = await Chat.findOneAndDelete({ 
      _id: chatId, 
      userId: session.user.id 
    });

    if (!deletedChat) {
      return NextResponse.json(
        { error: "Chat not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Chat deleted successfully",
      deletedChatId: chatId
    });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    const { messages, context, chatId } = await request.json();

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

    // For existing chats, get past messages from the chat document
    let pastMessages = [];
    if (chatId) {
      try {
        const existingChat = await Chat.findById(chatId).select('messages');
        if (existingChat) {
          // Use the last 20 messages from the database
          pastMessages = existingChat.messages.slice(-20).map(msg => ({
            role: msg.role,
            content: msg.content,
            user: msg.user
          }));
        }
      } catch (error) {
        console.error("Error fetching existing chat:", error);
        // Continue with empty past messages if chat not found
      }
    } else {
      // For new chats, use messages from the request (should just be the current message)
      pastMessages = messages.slice(0, -1);
    }

    // Generate AI response
    const response = await generateChatCompletion(session, latestMessage, pastMessages);

    // Prepare messages for saving
    const userMessage = {
      role: "user",
      content: latestMessage.content,
      timestamp: new Date(),
      user: {
        name: context.userName || session?.user?.name,
        email: context.userEmail || session?.user?.email,
      },
    };

    const aiMessage = {
      role: "model",
      content: response,
      timestamp: new Date(),
    };

    // Save the conversation
    const saveResult = await saveChat(userMessage, aiMessage, context, chatId);

    return NextResponse.json({ 
      response,
      chatId: saveResult.chatId,
      isNewChat: saveResult.isNew
    });
  } catch (error) {
    console.error("Error in chat API:", error);

    return NextResponse.json(
      {
        response: "I encountered an error processing your request. Please try again.",
      },
      { status: 200 }
    );
  }
}
