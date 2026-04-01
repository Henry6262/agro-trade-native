"use client";
import { useRef } from "react";

interface MarqueeProps {
  children: React.ReactNode;
  /** Total seconds for one full loop */
  duration?: number;
  /** Gap between items in px */
  gap?: number;
  className?: string;
  /** Pause the scroll on hover */
  pauseOnHover?: boolean;
  /** Direction */
  direction?: "left" | "right";
}

/**
 * React Bits – Marquee
 * Infinite horizontal scroll. Content is duplicated seamlessly.
 * The CSS animation lives in globals.css as @keyframes marquee-left / marquee-right.
 * Fade-out edges are applied via mask-image.
 */
export function Marquee({
  children,
  duration = 30,
  gap = 20,
  className = "",
  pauseOnHover = true,
  direction = "left",
}: MarqueeProps) {
  const inner = useRef<HTMLDivElement>(null);

  function pause() {
    if (pauseOnHover && inner.current) inner.current.style.animationPlayState = "paused";
  }
  function play() {
    if (pauseOnHover && inner.current) inner.current.style.animationPlayState = "running";
  }

  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{
        maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
      onMouseEnter={pause}
      onMouseLeave={play}
    >
      <div
        ref={inner}
        className="flex w-max"
        style={{
          gap: `${gap}px`,
          animation: `${direction === "left" ? "marquee-left" : "marquee-right"} ${duration}s linear infinite`,
        }}
      >
        {/* Original + duplicate for seamless loop */}
        <div className="flex shrink-0" style={{ gap: `${gap}px` }}>
          {children}
        </div>
        <div className="flex shrink-0" aria-hidden="true" style={{ gap: `${gap}px` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
