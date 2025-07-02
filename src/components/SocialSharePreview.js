import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

export default function SocialSharePreview({ 
  title, 
  description, 
  shareUrl, 
  author,
  date,
  displayImage 
}) {
  const [selectedPlatform, setSelectedPlatform] = useState('twitter');

  const platforms = [
    { id: 'twitter', name: 'Twitter', color: 'bg-blue-500' },
    { id: 'facebook', name: 'Facebook', color: 'bg-blue-600' },
    { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-700' },
  ];

  const renderPreview = () => {
    const ogImageUrl = `/api/og-image?type=share&title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&author=${encodeURIComponent(author)}&date=${date}`;

    switch (selectedPlatform) {
      case 'twitter':
        return (
          <motion.div 
            className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key="twitter"
          >
            {/* Twitter Card */}
            <div className="relative h-64 bg-gray-100">
              <Image
                src={ogImageUrl}
                alt={title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-3">
              <div className="text-gray-500 text-sm mb-1 truncate">
                {shareUrl}
              </div>
              <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1 line-clamp-2">
                {title}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-2">
                {description}
              </p>
              <div className="text-gray-500 text-xs mt-2">
                Quest Whisper
              </div>
            </div>
          </motion.div>
        );

      case 'facebook':
        return (
          <motion.div 
            className="bg-white border border-gray-300 rounded-lg overflow-hidden max-w-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key="facebook"
          >
            {/* Facebook Card */}
            <div className="relative h-64 bg-gray-100">
              <Image
                src={ogImageUrl}
                alt={title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <div className="text-gray-500 text-xs mb-1 uppercase tracking-wide">
                QUEST WHISPER
              </div>
              <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1 line-clamp-1">
                {title}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-2">
                {description}
              </p>
            </div>
          </motion.div>
        );

      case 'linkedin':
        return (
          <motion.div 
            className="bg-white border border-gray-300 rounded-lg overflow-hidden max-w-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key="linkedin"
          >
            {/* LinkedIn Card */}
            <div className="relative h-64 bg-gray-100">
              <Image
                src={ogImageUrl}
                alt={title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-2 line-clamp-2">
                {title}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                {description}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Quest Whisper</span>
                {author && (
                  <span>By {author}</span>
                )}
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Platform Selector */}
      <div className="flex space-x-2">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => setSelectedPlatform(platform.id)}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${selectedPlatform === platform.id
                ? `${platform.color} text-white shadow-md`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {platform.name}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="flex justify-center">
        {renderPreview()}
      </div>

      {/* Caption */}
      <p className="text-center text-sm text-gray-500">
        Preview of how your content will appear when shared on {platforms.find(p => p.id === selectedPlatform)?.name}
      </p>
    </div>
  );
} 