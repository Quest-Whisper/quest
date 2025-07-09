import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateChatCompletion, generateChatCompletionStreaming, executeMcpTool, generateConversationTitle } from "@/lib/largeLanguageModel";
import connectToDatabase from "@/lib/mongodb";
import Chat from "@/models/Chat";

// Add streaming support
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper function to send streaming response
const streamResponse = (writer, data) => {
  const encoder = new TextEncoder();
  return writer.write(encoder.encode(JSON.stringify(data) + '\n'));
};

// Helper function to save chat to MongoDB
async function saveChat(userMessage, aiMessage, userId, chatId = null) {
  await connectToDatabase();

  if (chatId) {
    // Update existing chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }
    chat.messages.push(userMessage, aiMessage);
    await chat.save();
    return { chatId: chat._id.toString(), isNew: false };
  } else {
    // Create new chat
    const title = await generateConversationTitle(userMessage.content, aiMessage.content);
    const newChat = await Chat.create({
      userId: userId,
      title: title,
      messages: [userMessage, aiMessage],
    });
    return { chatId: newChat._id.toString(), isNew: true };
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

export async function POST(req) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, context, chatId } = await req.json();
    const isStreaming = req.url.includes('stream=true');

    const lastUserMessage = messages[messages.length - 1];

    if (isStreaming) {
      // Set up streaming response
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      // Start processing in the background
      (async () => {
        try {
          // Always use the LLM for streaming - it will handle image generation internally
          const response = await generateChatCompletionStreaming(
            session,
            lastUserMessage,
            messages
          );

          // Create user message for saving
          const userMessageToSave = {
            role: "user",
            content: lastUserMessage.content,
            timestamp: new Date(),
            user: {
              name: session.user.name,
              email: session.user.email,
            },
            attachments: lastUserMessage.attachments || null
          };

          let fullContent = '';
          let imageResult = null;
          
          // Process the response if it's a generator
          if (typeof response !== 'string') {
            for await (const chunk of response) {
              if (chunk.type === 'content') {
                fullContent += chunk.content;
                await streamResponse(writer, chunk);
              } else if (chunk.type === 'image_generation') {
                // Handle image generation results from the LLM
                imageResult = chunk.result;
                await streamResponse(writer, chunk);
              } else if (chunk.type === 'done') {
                // Don't send the LLM's done event - we'll send our own with chat metadata
                continue;
              } else {
                // Send other event types (like error)
                await streamResponse(writer, chunk);
              }
            }
          } else {
            fullContent = response;
          }

          // Create AI message for saving with the complete content
          const aiMessageToSave = {
            role: "model",
            content: fullContent || "I apologize, but I couldn't generate a response.",
            timestamp: new Date(),
            ...(imageResult && {
              isImageGeneration: true,
              imageDescription: imageResult.description,
              attachments: [{
                url: imageResult.url,
                type: imageResult.type,
                displayName: imageResult.displayName,
                size: imageResult.size,
                category: imageResult.category,
                isGenerated: imageResult.isGenerated,
                prompt: imageResult.prompt
              }]
            })
          };

          // Save the chat after we have the complete content
          const saveResult = await saveChat(
            userMessageToSave,
            aiMessageToSave,
            session.user.id,
            chatId
          );

          // Send completion message with chat info
          const doneData = {
            type: 'done',
            chatId: saveResult.chatId,
            isNewChat: saveResult.isNew
          };
          await streamResponse(writer, doneData);

          writer.close();
        } catch (error) {
          console.error('Streaming error:', error);
          await streamResponse(writer, {
            type: 'error',
            error: error.message
          });
          writer.close();
        }
      })();

      return new Response(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response - let the LLM handle everything including image generation
      const response = await generateChatCompletion(
        session,
        lastUserMessage,
        messages
      );

      // Create user message for saving
      const userMessageToSave = {
        role: "user",
        content: lastUserMessage.content,
        timestamp: new Date(),
        user: {
          name: session.user.name,
          email: session.user.email,
        },
        attachments: lastUserMessage.attachments || null
      };

      // Extract image result if present (for non-streaming responses)
      let imageResult = null;
      let responseContent = response;
      
      if (typeof response === 'object' && response.attachments) {
        // If response contains attachments, it's likely an image generation response
        imageResult = response.attachments[0];
        responseContent = response.content;
      }

      // Create AI message for saving
      const aiMessageToSave = {
        role: "model",
        content: typeof responseContent === 'string' ? responseContent : responseContent.content || "I apologize, but I couldn't generate a response.",
        timestamp: new Date(),
        ...(imageResult && {
          isImageGeneration: true,
          imageDescription: imageResult.description || imageResult.prompt,
          attachments: [{
            url: imageResult.url,
            type: imageResult.type,
            displayName: imageResult.displayName,
            size: imageResult.size,
            category: imageResult.category,
            isGenerated: imageResult.isGenerated,
            prompt: imageResult.prompt
          }]
        })
      };

      // Save the chat
      const saveResult = await saveChat(
        userMessageToSave,
        aiMessageToSave,
        session.user.id,
        chatId
      );

      return NextResponse.json({ 
        response,
        chatId: saveResult.chatId,
        isNewChat: saveResult.isNew
      });
    }
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}
