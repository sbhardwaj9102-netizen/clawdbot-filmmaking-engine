"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

import { EASE_OUT } from "@/lib/motion";

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  amount?: number;
  as?: "div" | "p" | "span" | "li" | "section" | "header";
  play?: boolean;
};

/** Soft fade + rise. Used for supporting copy and meta text. */
export function Reveal({ children, className, delay = 0, y = 28, duration = 1.2, amount = 0.3, as = "div", play }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount });
  const show = play ?? inView;
  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration, ease: EASE_OUT, delay }}
    >
      {children}
    </Tag>
  );
}
