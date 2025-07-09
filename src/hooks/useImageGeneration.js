"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { generateMessageId } from "../utils/messageUtils";

export function useImageGeneration(message, isImageGeneration, onChatUpdate) {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  
  // Add refs for tracking requests and cleanup
  const activeRequestRef = useRef(null);
  const processedMessagesRef = useRef(new Set());
  const isMountedRef = useRef(true);

  // Create messageId only once per message
  const messageId = useMemo(() => {
    return generateMessageId(message, isImageGeneration);
  }, [message.timestamp, message.content, isImageGeneration]);

  // Set mounted ref
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Debug logging for component lifecycle and state changes
  useEffect(() => {
    if (isImageGeneration) {
      console.log('=== Image Generation Debug ===');
      console.log('Message ID:', messageId);
      console.log('Current State:', {
        isGeneratingImage,
        hasAttachments: !!message.attachments?.length,
        generatedImageUrl: !!generatedImageUrl,
        isInGlobalSet: processedMessagesRef.current.has(messageId)
      });
    }
  }, [isImageGeneration, messageId, isGeneratingImage, message.attachments, generatedImageUrl]);

  // Generate image function
  const generateImage = async () => {
    // Check if already processed or generating
    if (isGeneratingImage || processedMessagesRef.current.has(messageId)) {
      console.log('🚫 Image generation skipped:', {
        reason: isGeneratingImage ? 'Already generating' : 'Already processed',
        messageId,
        content: message.content?.substring(0, 50)
      });
      return;
    }

    // Create an abort controller for this request
    const controller = new AbortController();
    activeRequestRef.current = controller;
    
    console.log('🎨 Starting image generation:', {
      messageId,
      content: message.content?.substring(0, 50),
      timestamp: new Date().toISOString()
    });

    // Set loading state BEFORE the API call
    setIsGeneratingImage(true);
    processedMessagesRef.current.add(messageId);
    
    let hasError = false;
    try {
      // Prepare request body
      const requestBody = {
        prompt: message.content,
        chatId: message.chatId || null,
        context: {
          userName: message.user?.name,
          userEmail: message.user?.email,
          userId: message.user?.id
        }
      };

      console.log('📤 Sending API request:', {
        messageId,
        requestBody,
        timestamp: new Date().toISOString()
      });

      const response = await fetch('/api/chat/image-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      // Log raw response for debugging
      const responseText = await response.text();
      console.log('📥 Received API response text:', {
        messageId,
        status: response.status,
        text: responseText,
        timestamp: new Date().toISOString()
      });

      // Parse response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      console.log('📥 Processed API response:', {
        messageId,
        success: data.success,
        hasImageData: !!data.imageData,
        timestamp: new Date().toISOString()
      });

      if (data.imageData) {
        // Create a data URL from the base64 image data
        const imageUrl = `data:image/png;base64,${data.imageData}`;
        setGeneratedImageUrl(imageUrl);
        if (onChatUpdate && data.chatId) {
          onChatUpdate(data.chatId, data.isNewChat);
        }
        console.log('🖼️ Image processed successfully:', {
          messageId,
          hasAttachment: true,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      // Check if this is an intentional abort (component unmount)
      const isAborted = controller.signal.aborted || 
                       error.name === 'AbortError' || 
                       error.message?.includes('aborted');
      
      if (!isAborted) {
        console.error('❌ Image generation error:', {
          messageId,
          error: error?.message || String(error),
          timestamp: new Date().toISOString()
        });
        hasError = true;
      } else {
        console.log('ℹ️ Image generation aborted (likely component unmount):', {
          messageId,
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      // Only reset loading state if the component is still mounted and we have a result
      if (isMountedRef.current && !hasError) {
        setIsGeneratingImage(false);
      }
      // Clear the active request if it's this one
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
      }
    }
  };

  // Cleanup effect - only run on component unmount
  useEffect(() => {
    return () => {
      // Cleanup image URL (only if it's a blob URL, not a data URL)
      if (generatedImageUrl && generatedImageUrl.startsWith('blob:')) {
        console.log('🧹 Cleaning up image URL:', {
          messageId,
          timestamp: new Date().toISOString()
        });
        URL.revokeObjectURL(generatedImageUrl);
      }
      
      // Abort any active request
      if (activeRequestRef.current) {
        console.log('🛑 Aborting active request:', {
          messageId,
          timestamp: new Date().toISOString()
        });
        activeRequestRef.current.abort();
      }
      
      // Remove from processed messages
      if (processedMessagesRef.current.has(messageId)) {
        console.log('🧹 Removing from processed tracking:', {
          messageId,
          timestamp: new Date().toISOString()
        });
        processedMessagesRef.current.delete(messageId);
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Image generation effect
  useEffect(() => {
    if (isImageGeneration && 
        message.content && 
        !processedMessagesRef.current.has(messageId) &&
        !generatedImageUrl && 
        !message.attachments?.length &&
        !isGeneratingImage) {
      console.log('🔄 Effect triggered image generation:', {
        messageId,
        content: message.content?.substring(0, 50),
        conditions: {
          isImageGeneration,
          hasContent: !!message.content,
          notProcessed: !processedMessagesRef.current.has(messageId),
          noGeneratedUrl: !generatedImageUrl,
          noAttachments: !message.attachments?.length,
          notGenerating: !isGeneratingImage
        },
        timestamp: new Date().toISOString()
      });
      generateImage();
    }
  }, [messageId, isImageGeneration, message.content, message.attachments]);

  return {
    isGeneratingImage,
    generatedImageUrl,
    messageId
  };
} 