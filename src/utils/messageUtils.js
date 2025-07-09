/**
 * Message processing utilities for parsing and formatting chat messages
 */

// Extract "sources" JSON block from message.content
export function getSources(text) {
  const match = text.match(/sources:\s*(\[[\s\S]*?\])/i);
  if (!match) return [];
  try {
    return JSON.parse(match[1]);
  } catch {
    return [];
  }
}

// Strip out "sources:[...]" and any prefixed labels
export function removeSources(text) {
  let t = text
    .replace(/AI FINAL USER RESPONSE:\s*/i, "")
    .replace(/sources:\s*\[[\s\S]*?\]\s*/gi, "")
    .replace(/\n{2,}/g, "\n");
  return t.trim();
}

// Strip markdown formatting for TTS and plain text purposes
export function stripMarkdown(md) {
  return (
    md
      // Remove sources block first (before other processing)
      .replace(/sources:\s*\[[\s\S]*?\]\s*/gi, "")
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