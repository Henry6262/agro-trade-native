"use client";
import { motion } from "framer-motion";

interface BorderBeamProps {
  /** Accent colour of the beam */
  color?: string;
  /** Seconds to cross the card once */
  duration?: number;
  /** Width of the travelling beam as CSS value */
  beamWidth?: string;
  /** Optional delay before first animation */
  delay?: number;
}

/**
 * React Bits – BorderBeam
 * A glowing line that sweeps across the top edge of a card.
 * Place this as the first child of a `relative overflow-hidden rounded-*` card.
 */
export function BorderBeam({
  color = "#E8C870",
  duration = 5,
  beamWidth = "55%",
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      className="pointer-events-none absolute top-0 inset-x-0 h-px overflow-hidden rounded-t-[inherit]"
      style={{ zIndex: 3 }}
    >
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          width: beamWidth,
          height: "100%",
          background: `linear-gradient(90deg, transparent, ${color}CC, transparent)`,
          filter: `blur(0.5px) drop-shadow(0 0 5px ${color})`,
        }}
        initial={{ left: `-${beamWidth}` }}
        animate={{ left: ["-55%", "155%"] }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 0.5,
        }}
      />
    </div>
  );
}
