"use client";

import { motion, useAnimationFrame } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

// A modern, radial, audio-reactive visualizer with a pulsing core glow
export default function WaveformAnimation({
  connected,
  recording,
  audioLevel,
  size = 360,
}) {
  const numBars = 48;
  const radius = Math.max(120, size * 0.38);
  const barThickness = Math.max(3, Math.floor(size * 0.012));
  const barMaxLength = Math.max(28, Math.floor(size * 0.12));
  const baseBarLength = Math.max(8, Math.floor(size * 0.035));

  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);

  // Drive subtle motion even when the user isn't speaking
  useAnimationFrame((t) => {
    const delta = t / 1000; // seconds
    const speed = recording ? 1.6 : connected ? 0.8 : 0.2;
    phaseRef.current = (phaseRef.current + delta * speed) % (Math.PI * 2);
    setPhase(phaseRef.current);
  });

  const bars = useMemo(() => Array.from({ length: numBars }, (_, i) => i), [
    numBars,
  ]);

  const accentFrom = recording
    ? "from-emerald-400/90"
    : connected
    ? "from-indigo-400/80"
    : "from-slate-400/50";
  const accentTo = recording
    ? "to-cyan-400/90"
    : connected
    ? "to-violet-400/80"
    : "to-slate-300/40";

  return (
    <div
      className="relative select-none"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Soft ambient glow */}
      <div
        className={`absolute inset-0 rounded-full blur-2xl opacity-60 bg-gradient-to-br ${accentFrom} ${accentTo}`}
      />

      {/* Outer decorative rings */}
      <div className="absolute inset-0 rounded-full border border-white/10" />
      <div className="absolute inset-4 rounded-full border border-white/10" />
      <div className="absolute inset-8 rounded-full border border-white/10" />

      {/* Bars arranged radially */}
      <div className="absolute inset-0">
        {bars.map((i) => {
          const angle = (i / numBars) * Math.PI * 2;
          const sinOffset = Math.sin(angle + phase);
          const reactive = Math.max(0, Math.min(1, audioLevel));
          const amplitude = recording ? reactive : connected ? 0.35 : 0.15;
          const barLength = baseBarLength + sinOffset * 6 + amplitude * barMaxLength;

          const x = Math.cos(angle) * radius + size / 2;
          const y = Math.sin(angle) * radius + size / 2;
          const rotateDeg = (angle * 180) / Math.PI + 90; // point outward

          return (
            <div
              key={i}
              className="absolute will-change-transform"
              style={{
                left: x,
                top: y,
                transform: `translate(-50%, -100%) rotate(${rotateDeg}deg)`,
              }}
            >
              <motion.div
                style={{
                  width: barThickness,
                  height: Math.max(4, barLength),
                }}
                className={`rounded-full bg-gradient-to-b ${accentFrom} ${accentTo}`}
                animate={{
                  opacity: recording ? 1 : connected ? 0.9 : 0.5,
                }}
                transition={{ duration: 0.25 }}
              />
            </div>
          );
        })}
      </div>

      {/* Pulsing core */}
      <motion.div
        className={`absolute inset-1 rounded-full bg-gradient-to-br ${accentFrom} ${accentTo} opacity-60`}
        style={{ filter: "blur(20px)" }}
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.04, 1],
        }}
        transition={{ duration: recording ? 1.2 : 2, repeat: Infinity }}
      />

      {/* Inner glass disc */}
      <div className="absolute inset-0 rounded-full bg-white/8 backdrop-blur-md border border-white/15" />

      {/* Center pulse indicator that reacts to input level */}
      <motion.div
        className="absolute rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: size * 0.22, height: size * 0.22 }}
        animate={{
          scale: recording ? 1 + audioLevel * 0.25 : connected ? 1.04 : 1,
          boxShadow: recording
            ? `0 0 ${Math.max(20, size * 0.06)}px ${Math.max(
                6,
                size * 0.02
              )}px rgba(16, 185, 129, ${0.35 + audioLevel * 0.25})`
            : connected
            ? `0 0 ${Math.max(18, size * 0.05)}px ${Math.max(
                4,
                size * 0.016
              )}px rgba(99, 102, 241, 0.25)`
            : "none",
        }}
        transition={{ type: "spring", stiffness: 120, damping: 14, mass: 0.6 }}
      >
        <div
          className={`w-full h-full rounded-full border border-white/20 bg-gradient-to-br ${accentFrom} ${accentTo}`}
        />
      </motion.div>
    </div>
  );
}