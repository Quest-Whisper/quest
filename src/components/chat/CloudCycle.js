// components/CloudCycle.js
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CloudCycle({
  connected = false,
  recording = false,
  audioLevel = 0,   // 0 → 1
  size = 120,       // px
}) {
  // scale animation when connected/recording
  const scale = connected
    ? recording
      ? 2 + audioLevel * 0.3
      : 2
    : [1, 1.05, 1];
  const scaleTrans = connected
    ? recording
      ? { duration: 0.1 }
      : { duration: 0.5 }
    : { duration: 2.5, repeat: Infinity, ease: "easeInOut" };

  return (
    <div
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* SVG filters: pure noise → tint → blur */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", width: 0, height: 0 }}
      >
        {/* Dense mid-blue layer */}
        <filter id="cloud1">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.02"
            numOctaves="3"
            seed="1"
            result="turb"
          >
            <animate
              attributeName="baseFrequency"
              dur="30s"
              values="0.02 0.02; 0.03 0.015; 0.02 0.02"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feColorMatrix
            in="turb"
            type="matrix"
            values="
              0 0 0 0 0.2
              0 0 0 0 0.5
              0 0 0 0 1.0
              0 0 0 0 0.6
            "
          />
          <feGaussianBlur stdDeviation="3" />
        </filter>

        {/* Lighter highlight layer */}
        <filter id="cloud2">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.01"
            numOctaves="2"
            seed="2"
            result="turb2"
          >
            <animate
              attributeName="baseFrequency"
              dur="40s"
              values="0.008 0.01; 0.012 0.008; 0.008 0.01"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feColorMatrix
            in="turb2"
            type="matrix"
            values="
              0 0 0 0 0.5
              0 0 0 0 0.7
              0 0 0 0 1.0
              0 0 0 0 0.4
            "
          />
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </svg>

      <AnimatePresence>
        <motion.div
          className="rounded-full overflow-hidden relative"
          initial={{ scale: 1, opacity: connected ? 0 : 0.5 }}
          animate={{ scale, opacity: connected ? 1 : [0.5, 0.9, 0.5] }}
          transition={{
            scale: scaleTrans,
            opacity: connected
              ? { duration: 0.5 }
              : { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
          }}
          style={{
            width: size,
            height: size,
            background: connected
              ? "linear-gradient(135deg, #E1F5FE 0%, #81D4FA 100%)"
              : "#0B1D3A",
          }}
        >
          {connected && (
            <>
              {/* mid-blue drifting smoke */}
              <motion.div
                className="absolute inset-0"
                style={{ filter: "url(#cloud1)" }}
                animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
                transition={{
                  duration: 30,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* light-blue drifting highlights */}
              <motion.div
                className="absolute inset-0"
                style={{ filter: "url(#cloud2)" }}
                animate={{ x: [0, -15, 0], y: [0, 10, 0] }}
                transition={{
                  duration: 40,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
