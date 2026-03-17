"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ParallaxBgProps {
  /** Unsplash (or any) image URL */
  src: string;
  /** How many px the image travels over the full scroll range of the section */
  strength?: number;
  /** CSS background for the overlay layer — gradient string */
  overlay: string;
  /** backgroundPosition base value */
  position?: string;
  /** Fade the top edge into this colour (hex/rgba). Smooth blend with previous section. */
  fadeTop?: string;
  /** Fade the bottom edge into this colour (hex/rgba). Smooth blend with next section. */
  fadeBottom?: string;
  /** Height of the top/bottom fade in px (default 220) */
  fadeSize?: number;
}

/**
 * Scroll-linked parallax background.
 *
 * Renders the image taller than its container by 2×strength so it can shift
 * vertically without ever showing a gap, then uses Framer Motion's
 * useScroll+useTransform to drive a smooth Y offset as the section scrolls
 * through the viewport. Works on iOS Safari (unlike background-attachment:fixed).
 */
export function ParallaxBg({
  src,
  strength = 55,
  overlay,
  position = "center",
  fadeTop,
  fadeBottom,
  fadeSize = 220,
}: ParallaxBgProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track when the section enters/leaves the viewport
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Map scroll progress → vertical shift: image moves slower than page = parallax
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Image — extends beyond container top/bottom so parallax never shows gaps */}
      <motion.div
        style={{
          y,
          position: "absolute",
          left: 0,
          right: 0,
          top: -strength,
          bottom: -strength,
          backgroundImage: `url('${src}')`,
          backgroundSize: "cover",
          backgroundPosition: position,
          willChange: "transform",
        }}
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0" style={{ background: overlay }} />

      {/* Top edge fade — blends into previous section */}
      {fadeTop && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{
            height: fadeSize,
            background: `linear-gradient(to bottom, ${fadeTop} 0%, transparent 100%)`,
            zIndex: 2,
          }}
        />
      )}

      {/* Bottom edge fade — blends into next section */}
      {fadeBottom && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{
            height: fadeSize,
            background: `linear-gradient(to top, ${fadeBottom} 0%, transparent 100%)`,
            zIndex: 2,
          }}
        />
      )}
    </div>
  );
}
