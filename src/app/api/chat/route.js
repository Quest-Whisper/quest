import { NextResponse } from "next/server";
import { generateChatCompletion, generateConversationTitle, generateChatCompletionStreaming } from "@/lib/largeLanguageModel";
import connectToDatabase from "@/lib/mongodb";
import Chat from "@/models/Chat";

import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

// Add streaming support
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      const userMessageToSave = {
        role: userMessage.role,
        content: userMessage.content,
        timestamp: new Date(userMessage.timestamp || Date.now()),
        user: userMessage.user,
        attachments: userMessage.attachments || null,
      };
      
      console.log('Saving user message:', JSON.stringify(userMessageToSave, null, 2));
      
      chat.messages.push(
        userMessageToSave,
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
      
      const userMessageToSave = {
        role: userMessage.role,
        content: userMessage.content,
        timestamp: new Date(userMessage.timestamp || Date.now()),
        user: userMessage.user,
        attachments: userMessage.attachments || null,
      };
      
      console.log('Creating new chat with user message:', JSON.stringify(userMessageToSave, null, 2));
      
      const newChat = await Chat.create({
        userId: context.userId,
        title: title,
        messages: [
          userMessageToSave,
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
    const url = new URL(request.url);
    const isStreaming = url.searchParams.get("stream") === "true";

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
    
    // Debug logging
    console.log('Latest message received by API:', JSON.stringify(latestMessage, null, 2));
    console.log('Attachments in latest message:', latestMessage.attachments);

    // For existing chats, get past messages from the chat document
    let pastMessages = [];
    if (chatId) {
      try {
        const existingChat = await Chat.findById(chatId).select('messages');
        if (existingChat) {
          // Use the last 20 messages from the database and convert attachments for AI
          pastMessages = existingChat.messages.slice(-20).map(msg => ({
            role: msg.role,
            content: msg.content,
            user: msg.user,
            files: msg.attachments ? msg.attachments.map(att => {
              if (att.type.startsWith('image/')) {
                // Images are processed inline
                return {
                  type: 'image',
                  mimeType: att.type,
                  uri: att.url
                };
              } else if (att.geminiFile) {
                // Non-images use Gemini File API
                return {
                  type: 'gemini',
                  uri: att.geminiFile.uri,
                  mimeType: att.geminiFile.mimeType
                };
              }
              return null;
            }).filter(Boolean) : null
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

    // Convert attachments to format for AI model
    const messageForAI = {
      ...latestMessage,
      files: latestMessage.attachments ? latestMessage.attachments.map(att => {
        if (att.type.startsWith('image/')) {
          // Images are processed inline
          return {
            type: 'image',
            mimeType: att.type,
            uri: att.url
          };
        } else if (att.geminiFile) {
          // Non-images use Gemini File API
          return {
            type: 'gemini',
            uri: att.geminiFile.uri,
            mimeType: att.geminiFile.mimeType
          };
        }
        return null;
      }).filter(Boolean) : null
    };

    // Handle streaming response
    if (isStreaming) {
      return await handleStreamingResponse(session, messageForAI, pastMessages, context, chatId);
    }

    // Generate AI response (non-streaming)
    const response = await generateChatCompletion(session, messageForAI, pastMessages);

    // Prepare messages for saving (use original message for saving)
    const userMessage = {
      role: "user",
      content: latestMessage.content,
      timestamp: new Date(),
      user: {
        name: context.userName || session?.user?.name,
        email: context.userEmail || session?.user?.email,
      },
      attachments: latestMessage.attachments || null,
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

async function handleStreamingResponse(session, messageForAI, pastMessages, context, chatId) {
  let controllerRef;
  let fullResponse = "";
  let streamFinished = false;
  
  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
    },
    cancel(reason) {
      console.log("[Chat Stream] Stream cancelled:", reason);
      streamFinished = true;
    },
  });

  // Start the streaming generation in the background
  (async () => {
    try {
      const streamingGenerator = generateChatCompletionStreaming(session, messageForAI, pastMessages);
      
      for await (const chunk of streamingGenerator) {
        if (streamFinished) break;
        
        if (chunk.type === 'content') {
          fullResponse += chunk.content;
          
          // Send the chunk to the client
          const chunkData = JSON.stringify({
            type: 'content',
            content: chunk.content,
            fullContent: fullResponse
          }) + '\n';
          
          if (controllerRef && !streamFinished) {
            controllerRef.enqueue(new TextEncoder().encode(chunkData));
          }
        } else if (chunk.type === 'done') {
          // Save the completed conversation (use original message for saving)
          const userMessage = {
            role: "user",
            content: messageForAI.content,
            timestamp: new Date(),
            user: {
              name: context.userName || session?.user?.name,
              email: context.userEmail || session?.user?.email,
            },
            attachments: messageForAI.attachments || null,
          };

          const aiMessage = {
            role: "model",
            content: fullResponse,
            timestamp: new Date(),
          };

          try {
            const saveResult = await saveChat(userMessage, aiMessage, context, chatId);
            
            // Send completion message
            const completionData = JSON.stringify({
              type: 'done',
              fullContent: fullResponse,
              chatId: saveResult.chatId,
              isNewChat: saveResult.isNew
            }) + '\n';
            
            if (controllerRef && !streamFinished) {
              controllerRef.enqueue(new TextEncoder().encode(completionData));
            }
          } catch (saveError) {
            console.error("Error saving streamed chat:", saveError);
            // Send error but don't fail the stream
            const errorData = JSON.stringify({
              type: 'error',
              error: 'Failed to save chat',
              fullContent: fullResponse
            }) + '\n';
            
            if (controllerRef && !streamFinished) {
              controllerRef.enqueue(new TextEncoder().encode(errorData));
            }
          }
          
          if (controllerRef && !streamFinished) {
            streamFinished = true;
            controllerRef.close();
          }
          break;
        } else if (chunk.type === 'error') {
          // Send error message
          const errorData = JSON.stringify({
            type: 'error',
            error: chunk.error,
            fullContent: fullResponse
          }) + '\n';
          
          if (controllerRef && !streamFinished) {
            controllerRef.enqueue(new TextEncoder().encode(errorData));
            streamFinished = true;
            controllerRef.close();
          }
          break;
        }
      }
    } catch (error) {
      console.error("Error in streaming generation:", error);
      
      const errorData = JSON.stringify({
        type: 'error',
        error: 'Failed to generate response',
        fullContent: fullResponse
      }) + '\n';
      
      if (controllerRef && !streamFinished) {
        controllerRef.enqueue(new TextEncoder().encode(errorData));
        streamFinished = true;
        controllerRef.close();
      }
    }
  })();

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Connection": "keep-alive",
      "Transfer-Encoding": "chunked",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
