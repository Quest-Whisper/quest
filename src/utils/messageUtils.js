/**
 * Message processing utilities for parsing and formatting chat messages
 */

// Extract "sources" JSON block from message.content
export function getSources(content) {
  if (!content) return [];

  try {
    // Look for sources array at start of content
    const match = content.match(/sources:\s*(\[[\s\S]*?\])/);
    if (!match) return [];

    let jsonString = match[1];
    
    // Try to fix common JSON issues
    jsonString = cleanJsonString(jsonString);

    // Parse the JSON array
    const sources = JSON.parse(jsonString);
    return Array.isArray(sources) ? sources : [];
  } catch (error) {
    // Try alternative parsing strategies
    return parseSourcesWithFallback(content);
  }
}

// Helper function to clean up common JSON issues
function cleanJsonString(jsonString) {
  return jsonString
    // Fix common escaping issues
    .replace(/\\/g, '\\\\')  // Escape backslashes
    .replace(/"/g, '"')      // Normalize quotes
    .replace(/"/g, '"')      // Normalize quotes
    // Fix double quotes at the end of strings
    .replace(/""+/g, '"')
    // Remove trailing commas
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix missing commas between objects
    .replace(/}\s*{/g, '}, {')
    .trim();
}

// Fallback parser for when main JSON parsing fails
function parseSourcesWithFallback(content) {
  try {
    // Try to extract individual source objects manually
    const sources = [];
    const sourcePattern = /"title":\s*"([^"]*)"[\s\S]*?"url":\s*"([^"]*)"/g;
    let match;
    
    while ((match = sourcePattern.exec(content)) !== null) {
      sources.push({
        title: match[1],
        url: match[2],
        image: null,
        displayLink: extractDisplayLink(match[2])
      });
    }
    
    return sources;
  } catch (error) {
    return [];
  }
}

// Helper to extract display link from URL
function extractDisplayLink(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function getImages(content) {
  if (!content) return [];

  try {
    // Look for images array in the content
    const match = content.match(/images:\s*(\[[\s\S]*?\])/);
    if (!match) return [];

    let jsonString = match[1];
    
    // Try to fix common JSON issues
    jsonString = cleanJsonString(jsonString);

    // Parse the JSON array
    const images = JSON.parse(jsonString);
    return Array.isArray(images) ? images : [];
  } catch (error) {
    // Try alternative parsing strategies
    return parseImagesWithFallback(content);
  }
}

// Fallback parser for images when main JSON parsing fails
function parseImagesWithFallback(content) {
  try {
    // Try to extract individual image objects manually
    const images = [];
    const imagePattern = /"url":\s*"([^"]*)"[\s\S]*?"title":\s*"([^"]*)"/g;
    let match;
    
    while ((match = imagePattern.exec(content)) !== null) {
      images.push({
        url: match[1],
        title: match[2],
        thumbnail: match[1], // Use URL as thumbnail fallback
        displayLink: extractDisplayLink(match[1])
      });
    }
    
    return images;
  } catch (error) {
    return [];
  }
}

// Strip out "sources:[...]" and any prefixed labels
export function removeSources(content) {
  if (!content) return '';
  
  // Remove sources array from start if present
  return content.replace(/sources:\s*\[[\s\S]*?\]\s*\n*/, '')
    // Remove any image JSON objects
    .replace(/images:\s*\[[\s\S]*?\]\s*\n*/, '')
    // Clean up any double newlines left behind
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Strip markdown formatting for TTS and plain text purposes
export function stripMarkdown(md) {
  return (
    md
      // Remove sources block first (before other processing)
      .replace(/sources:\s*\[[\s\S]*?\]\s*/gi, "")
      // Remove images block first (before other processing)
      .replace(/images:\s*\[[\s\S]*?\]\s*/gi, "")
      // Remove AI response prefixes
      .replace(/AI FINAL USER RESPONSE:\s*/i, "")
      // Remove code blocks (```…```)
      .replace(/```[\s\S]*?```/g, "")
      // Unwrap inline code `…`
      .replace(/`([^`\n]+)`/g, "$1")
      // Remove ATX headings (e.g. "### Heading" → "Heading")
      .replace(/^#{1,6}\s*(.*)$/gm, "$1")
      // Remove setext headings (overlines/underlines)
      .replace(/^(?:=+|-+)\s*$/gm, "")
      // Remove images ![alt](url)
      .replace(/!\[.*?\]\(.*?\)/g, "")
      // Unwrap links [text](url) → text
      .replace(/\[([^\]]+)\]\((?:.|\s)*?\)/g, "$1")
      // Remove bold **text** or __text__
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      // Remove emphasis *text* or _text_
      .replace(/(\*|_)(.*?)\1/g, "$2")
      // Remove blockquotes > …
      .replace(/^\s{0,3}>\s?/gm, "")
      // Remove unordered list markers -, *, +
      .replace(/^\s*([-*+])\s+/gm, "")
      // Remove ordered list numbers "1. "
      .replace(/^\s*\d+\.\s+/gm, "")
      // Remove horizontal rules (---, ***, ___)
      .replace(/^(?:-{3,}|\*{3,}|_{3,})\s*$/gm, "")
      // Strip any remaining HTML tags
      .replace(/<\/?[^>]+(>|$)/g, "")
      // Collapse multiple blank lines
      .replace(/\n{2,}/g, "\n\n")
      .trim()
  );
}

// Extract text from React children (for ReactMarkdown components)
export function extractText(children) {
  if (Array.isArray(children)) return children.join("");
  if (typeof children === "string") return children;
  if (children?.props?.children) return extractText(children.props.children);
  return "";
}

// Generate a unique message ID
export function generateMessageId(message, isImageGeneration = false) {
  return `${message.timestamp || Date.now()}_${message.content?.substring(0, 50) || 'empty'}_${isImageGeneration}`;
}

// Determine message type flags
export function getMessageTypeFlags(message, isUser) {
  const isError = !isUser && message.isError;
  const isStreaming = !isUser && message.isStreaming;
  const isRetryableError = !isUser && message.content?.trim() === "I apologize, but I couldn't process your request. Please try again.";
  const isImageGeneration = !isUser && (message.isImageGeneration || message.isImageGeneration === true);
  
  return {
    isError,
    isStreaming,
    isRetryableError,
    isImageGeneration,
    isRetryable: isRetryableError || (!isUser && message.isRetryable),
    hasSources: !isUser && (message.sources?.length > 0),
    hasDisplayImage: !isUser && message.displayImage,
    hasUserAttachments: isUser && message.attachments && message.attachments.length > 0,
    hasAttachedImage: !isUser && message.image && message.image.uri,
  };
}

// Check if message content contains specific patterns
export function hasContentPattern(content, pattern) {
  if (!content) return false;
  return pattern.test(content);
}

// Truncate text for sharing or display
export function truncateText(text, maxLength = 200) {
  if (!text) return "";
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
} 