"use client";

import { motion } from "framer-motion";

export default function WaveformAnimation({ connected, recording, audioLevel, size = 120 }) {
  // Increased number of bars to match image
  const numBars = 4;
  
  // Adjusted container style for larger bars
  const containerStyle = {
    width: '400px', // Increased overall width
    height: '180px', // Increased height
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px', // Increased gap between bars
    padding: '20px',
  };

  // Calculate animation properties based on recording state and audio level
  const getAnimationProps = (index) => {
    if (!connected) {
      return {
        scaleY: 0.8,
        opacity: 0.2,
      };
    }
    
    if (!recording) {
      return {
        scaleY: 0.8,
        opacity: 0.8,
      };
    }

    // Create a wave-like effect with phase offset
    const baseScale = 0.4 + audioLevel * 0.6;
    const phaseOffset = index * (Math.PI / numBars);
    
    return {
      scaleY: [
        baseScale * (1 + Math.sin(phaseOffset) * 0.5),
        baseScale * (1 + Math.sin(phaseOffset + Math.PI) * 0.5),
      ],
      opacity: 1,
      transition: {
        repeat: Infinity,
        duration: 1,
        ease: "easeInOut",
      },
    };
  };

  return (
    <div style={containerStyle}>
      {[...Array(numBars)].map((_, i) => (
        <motion.div
          key={i}
          animate={getAnimationProps(i)}
          style={{
            width: '90px', // Increased bar width
            height: '100%',
            backgroundColor: 'black',
            borderRadius: '60px', // Increased border radius for pill shape
            transformOrigin: 'center',
          }}
        />
      ))}
    </div>
  );
} 