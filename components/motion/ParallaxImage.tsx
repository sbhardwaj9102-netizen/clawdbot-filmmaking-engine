"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import { EASE } from "@/lib/motion";
import type { Asset } from "@/lib/types";
import { Media } from "./Media";
import styles from "./motion.module.css";

type Props = {
  asset: Asset;
  className?: string;
  /** Parallax travel as a fraction of the frame height. */
  speed?: number;
  /** Wipe the frame open from the bottom when it enters. */
  reveal?: boolean;
  /** Settle from a slight push-in while scrolling into view. */
  zoom?: boolean;
  priority?: boolean;
  children?: React.ReactNode;
  innerClassName?: string;
  style?: React.CSSProperties;
};

/** The standard photograph on this site: masked reveal, parallax, slow settle. */
export function ParallaxImage({ asset, className, speed = 0.1, reveal = true, zoom = true, priority, children, innerClassName, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${-speed * 100}%`, `${speed * 100}%`]);
  const base = 1 + speed * 2.2;
  const scale = useTransform(scrollYProgress, [0, 0.55], zoom ? [base + 0.12, base] : [base, base]);

  // Note: the observer watches the unclipped outer frame — Chromium reports a
  // fully clip-path'd element as not intersecting.
  return (
    <div ref={ref} className={`${styles.frame} ${className ?? ""}`} style={style}>
      <motion.div
        className={styles.clip}
        initial={reveal ? { clipPath: "inset(100% 0% 0% 0%)" } : false}
        animate={reveal ? { clipPath: inView ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)" } : undefined}
        transition={{ duration: 1.7, ease: EASE }}
      >
        <motion.div className={`${styles.parallaxInner} ${innerClassName ?? ""}`} style={{ y, scale }}>
          <Media asset={asset} priority={priority} />
        </motion.div>
      </motion.div>
      {children}
    </div>
  );
}
