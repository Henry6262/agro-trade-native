"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface FadeInUpProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeInUp({ children, delay = 0, duration = 0.6, className }: FadeInUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerChildrenProps {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function StaggerChildren({ children, stagger = 0.12, className, style }: StaggerChildrenProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      variants={{
        visible: { transition: { staggerChildren: stagger } },
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface CountUpProps {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function CountUp({ target, prefix = "", suffix = "", duration = 2, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });
  const [value, setValue] = useState(0);
  const isDecimal = target % 1 !== 0;

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const raw = eased * target;
      setValue(isDecimal ? Math.round(raw * 10) / 10 : Math.round(raw));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, target, duration, isDecimal]);

  const display = isDecimal ? value.toFixed(1) : value.toLocaleString();

  return (
    <span ref={ref} className={className} suppressHydrationWarning>
      {prefix}{display}{suffix}
    </span>
  );
}
