import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import {useEffect} from "react";

export default function GeneratedImageDisplay({ 
  imageUrl, 
  imageDescription, 
  isOpen, 
  onClose,
  clickPosition = { x: 0, y: 0 } 
}) {
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case "Escape":
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;


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
            backgroundImage: imageUrl,
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
        >
          <motion.img
            src={imageUrl}
            alt={imageDescription || "Genrated Image"}
            className="max-h-[90vh] max-w-[90vw] object-contain select-none rounded-lg shadow-2xl text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            draggable={false}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 