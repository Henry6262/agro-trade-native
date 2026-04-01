"use client";
import { useRef, useState } from "react";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Colour of the spotlight radial gradient */
  spotlightColor?: string;
  /** Radius of the spotlight in px */
  radius?: number;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * React Bits – SpotlightCard
 * Wraps any card with a mouse-tracking radial gradient spotlight that
 * follows the cursor, making low-contrast dark cards pop on hover.
 */
export function SpotlightCard({
  children,
  className = "",
  style,
  spotlightColor = "rgba(255,255,255,0.10)",
  radius = 480,
  onMouseEnter,
  onMouseLeave,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={style}
      onMouseMove={onMove}
      onMouseEnter={(e) => { setVisible(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setVisible(false); onMouseLeave?.(e); }}
    >
      {/* Spotlight overlay — sits above bg, below content */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
        style={{
          zIndex: 1,
          opacity: visible ? 1 : 0,
          background: `radial-gradient(${radius}px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 70%)`,
        }}
      />
      {/* Content must be z-10 to sit above the overlay */}
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}
