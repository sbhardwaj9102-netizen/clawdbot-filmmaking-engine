"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

import { EASE } from "@/lib/motion";
import styles from "./motion.module.css";

/** A hairline that draws itself across the column. */
export function Line({ delay = 0, className, origin = "left" }: { delay?: number; className?: string; origin?: "left" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 1 });
  return (
    <motion.div
      ref={ref}
      className={`${styles.line} ${className ?? ""}`}
      style={{ transformOrigin: origin }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: inView ? 1 : 0 }}
      transition={{ duration: 1.6, ease: EASE, delay }}
    />
  );
}
