"use client";
import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface BlurTextProps {
  text: string;
  /** Tailwind / CSS classes applied to the wrapper element */
  className?: string;
  /** Inline styles applied to the wrapper element */
  style?: React.CSSProperties;
  /** Delay between each word in ms */
  delay?: number;
  /** Direction words enter from */
  direction?: "up" | "down";
}

/**
 * React Bits – BlurText
 * Each word blurs + fades in staggered on scroll.
 * Drop-in replacement for a plain <h2> or <p> when you want a scroll-triggered
 * blur→sharp reveal instead of a simple FadeInUp.
 */
export function BlurText({
  text,
  className = "",
  style,
  delay = 75,
  direction = "up",
}: BlurTextProps) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const words = text.split(" ");
  const yStart = direction === "up" ? 20 : -20;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`flex flex-wrap gap-x-[0.28em] gap-y-0 ${className}`}
      style={style}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: yStart, filter: "blur(12px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{
            duration: 0.65,
            delay: (i * delay) / 1000,
            ease: [0.25, 0.4, 0.25, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}
