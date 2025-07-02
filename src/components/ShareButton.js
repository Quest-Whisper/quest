import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShareIcon, 
  LinkIcon, 
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ShareButton({ 
  content, 
  title, 
  sources = [], 
  displayImage = null,
  className = "",
  size = "md" // "sm", "md", "lg"
}) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const createShareLink = async () => {
    if (shareUrl) {
      // If share URL already exists, just copy it
      await copyToClipboard(shareUrl);
      return;
    }

    setIsSharing(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          title: title || 'QuestWhisper AI Response',
          sources,
          displayImage,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShareUrl(result.shareUrl);
        await copyToClipboard(result.shareUrl);
        toast.success('Share link created and copied!');
      } else {
        toast.error('Failed to create share link');
      }
    } catch (error) {
      console.error('Error creating share link:', error);
      toast.error('Failed to create share link');
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const openNativeShare = async () => {
    if (!shareUrl) {
      await createShareLink();
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'QuestWhisper AI Response',
          text: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        if (err.name !== 'AbortError') {
          await copyToClipboard(shareUrl);
        }
      }
    } else {
      await copyToClipboard(shareUrl);
    }
  };

  const buttonSizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Main Share Button */}
      <motion.button
        onClick={createShareLink}
        disabled={isSharing}
        className={`
          ${buttonSizes[size]}
          bg-[#4f7269] text-white rounded-lg font-medium
          hover:bg-[#3f5a51] focus:outline-none focus:ring-2 focus:ring-[#4f7269] focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 flex items-center gap-2
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isSharing ? (
          <>
            <div className={`${iconSizes[size]} animate-spin rounded-full border-2 border-white border-t-transparent`} />
            Creating...
          </>
        ) : copied ? (
          <>
            <CheckIcon className={iconSizes[size]} />
            Copied!
          </>
        ) : (
          <>
            <ShareIcon className={iconSizes[size]} />
            Share
          </>
        )}
      </motion.button>

      {/* Copy Link Button (appears after share link is created) */}
      {shareUrl && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => copyToClipboard(shareUrl)}
          className={`
            ${buttonSizes[size]}
            bg-gray-100 text-gray-700 rounded-lg font-medium
            hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2
            transition-all duration-200 flex items-center gap-2
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {copied ? (
            <>
              <CheckIcon className={iconSizes[size]} />
              Copied!
            </>
          ) : (
            <>
              <LinkIcon className={iconSizes[size]} />
              Copy Link
            </>
          )}
        </motion.button>
      )}

      {/* Native Share Button (mobile) */}
      {shareUrl && typeof navigator !== 'undefined' && navigator.share && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={openNativeShare}
          className={`
            ${buttonSizes[size]}
            bg-blue-500 text-white rounded-lg font-medium
            hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-all duration-200 flex items-center gap-2
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ShareIcon className={iconSizes[size]} />
          Share
        </motion.button>
      )}
    </div>
  );
} 