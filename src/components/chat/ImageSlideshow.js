import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { useState, useEffect, useCallback } from "react";

export default function ImageSlideshow({ 
  images, 
  startIndex = 0, 
  isOpen, 
  onClose,
  clickPosition = { x: 0, y: 0 } 
}) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  // Reset index when images change
  useEffect(() => {
    setCurrentIndex(startIndex);
  }, [startIndex, images]);

  const handlePrevious = useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleOpenLink = useCallback((e) => {
    e.stopPropagation();
    const currentImage = images[currentIndex];
    if (currentImage.displayLink) {
      // Ensure the URL has a protocol
      let url = currentImage.displayLink;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [currentIndex, images]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case "ArrowLeft":
          handlePrevious();
          break;
        case "ArrowRight":
          handleNext();
          break;
        case "Escape":
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handlePrevious, handleNext, onClose]);

  // Handle touch events for swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrevious();
    }
  };

  if (!isOpen) return null;

  const currentImage = images[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Background blur and overlay */}
        <motion.div 
          className="absolute inset-0 backdrop-blur-lg bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Background preview image */}
        <motion.div 
          className="absolute inset-0 opacity-30 filter blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          style={{
            backgroundImage: `url(${images[currentIndex].url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: 'scale(1.1)',
          }}
        />

        {/* Close button */}
        <motion.button
          className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors z-50 backdrop-blur-sm bg-black/30"
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Close slideshow"
        >
          <XMarkIcon className="w-8 h-8" />
        </motion.button>

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <motion.button
              className="absolute left-4 md:left-8 text-white p-3 hover:bg-white/20 rounded-full transition-colors z-50 group backdrop-blur-sm bg-black/30"
              onClick={handlePrevious}
              whileTap={{ scale: 0.9 }}
              animate={{ opacity: 0.6 }}
              whileHover={{ 
                opacity: 1,
                scale: 1.1
              }}
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
            </motion.button>
            <motion.button
              className="absolute right-4 md:right-8 text-white p-3 hover:bg-white/20 rounded-full transition-colors z-50 group backdrop-blur-sm bg-black/30"
              onClick={handleNext}
              whileTap={{ scale: 0.9 }}
              animate={{ opacity: 0.6 }}
              whileHover={{ 
                opacity: 1,
                scale: 1.1
              }}
              aria-label="Next image"
            >
              <ChevronRightIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
            </motion.button>
          </>
        )}

        {/* Image container */}
        <motion.div
          className="relative w-full h-full flex items-center justify-center"
          initial={{ 
            scale: 0.8, 
            x: clickPosition.x, 
            y: clickPosition.y 
          }}
          animate={{ 
            scale: 1,
            x: 0,
            y: 0
          }}
          exit={{ 
            scale: 0.8,
            x: clickPosition.x,
            y: clickPosition.y
          }}
          transition={{ type: "spring", damping: 25, stiffness: 120 }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <motion.img
            key={currentIndex}
            src={images[currentIndex].url}
            alt={images[currentIndex].title || "Image"}
            className="max-h-[90vh] max-w-[90vw] object-contain select-none rounded-lg shadow-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            draggable={false}
          />
        </motion.div>

        {/* Bottom controls container */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
          {/* Image counter */}
          {images.length > 1 && (
            <motion.div 
              className="bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              {currentIndex + 1} / {images.length}
            </motion.div>
          )}

          {/* Display link button */}
          {currentImage.displayLink && (
            <motion.button
              className="cursor-pointer bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm flex items-center gap-2 hover:bg-black/70 transition-colors"
              onClick={handleOpenLink}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>View Source</span>
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 