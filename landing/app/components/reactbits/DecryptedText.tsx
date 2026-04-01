"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&";

interface DecryptedTextProps {
  text: string;
  /** Class for fully-revealed characters */
  className?: string;
  /** Class for scrambled characters (use a muted colour) */
  encryptedClassName?: string;
  /** Interval between scramble ticks in ms */
  speed?: number;
  /** Whether to trigger on scroll into view or on hover */
  animateOn?: "view" | "hover";
}

/**
 * React Bits – DecryptedText
 * Characters scramble randomly then reveal one-by-one from left to right.
 * Great for taglines on dark backgrounds — gives a crypto/tech feel.
 */
export function DecryptedText({
  text,
  className = "",
  encryptedClassName = "opacity-40",
  speed = 32,
  animateOn = "view",
}: DecryptedTextProps) {
  const [display, setDisplay] = useState(text);
  const [running, setRunning] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const revealRef = useRef(0);
  const hasRun = useRef(false);

  // Indices of non-space chars (revealed left-to-right)
  const nonSpace = text.split("").map((c, i) => (c !== " " ? i : -1)).filter((i) => i >= 0);

  const run = useCallback(() => {
    if (hasRun.current && animateOn === "view") return;
    hasRun.current = true;
    revealRef.current = 0;
    setRunning(true);
    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      revealRef.current = Math.min(revealRef.current + 1, nonSpace.length);
      const revealed = revealRef.current;

      setDisplay(
        text
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            const order = nonSpace.indexOf(i);
            if (order < revealed) return char; // locked in
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          })
          .join("")
      );

      if (revealed >= nonSpace.length) {
        clearInterval(intervalRef.current);
        setDisplay(text);
        setRunning(false);
      }
    }, speed);
  }, [text, speed, animateOn, nonSpace]);

  // View trigger
  useEffect(() => {
    if (animateOn !== "view") return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) run(); },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { observer.disconnect(); clearInterval(intervalRef.current); };
  }, [animateOn, run]);

  // Cleanup on unmount
  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <span
      ref={ref}
      aria-label={text}
      onMouseEnter={animateOn === "hover" ? run : undefined}
    >
      <span aria-hidden="true">
        {display.split("").map((char, i) => {
          const isRevealed = char === text[i];
          return (
            <span key={i} className={running && !isRevealed ? encryptedClassName : className}>
              {char}
            </span>
          );
        })}
      </span>
    </span>
  );
}
