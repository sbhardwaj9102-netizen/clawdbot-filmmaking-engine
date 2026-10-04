"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import styles from "./motion.module.css";

type Props = {
  children: (progress: MotionValue<number>) => React.ReactNode;
  className?: string;
  trackClassName?: string;
  /** Rendered inside the pinned viewport, above/below the track. */
  before?: React.ReactNode;
  after?: (progress: MotionValue<number>) => React.ReactNode;
  /** Below this viewport width the track is simply stacked vertically. */
  minWidth?: number;
  id?: string;
};

/**
 * Pins a section and converts vertical scroll into horizontal travel.
 * The section's height is derived from the track's real width, so any
 * number of panels works.
 */
export function HorizontalScroll({ children, className, trackClassName, before, after, minWidth = 0, id }: Props) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, (v) => -v * dist);

  useEffect(() => {
    const measure = () => {
      const on = window.innerWidth >= minWidth;
      setEnabled(on);
      if (track.current) setDist(on ? Math.max(0, track.current.scrollWidth - window.innerWidth) : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [minWidth]);

  if (!enabled) {
    return (
      <section ref={section} className={className} id={id}>
        {before && <div className={styles.stackedBefore}>{before}</div>}
        <div ref={track} className={trackClassName} data-stacked>
          {children(scrollYProgress)}
        </div>
      </section>
    );
  }

  return (
    <section ref={section} id={id} className={`${styles.hsection} ${className ?? ""}`} style={{ height: `calc(100vh + ${dist}px)` }}>
      <div className={styles.hsticky}>
        {before}
        <motion.div ref={track} className={`${styles.htrack} ${trackClassName ?? ""}`} style={{ x }}>
          {children(scrollYProgress)}
        </motion.div>
        {after?.(scrollYProgress)}
      </div>
    </section>
  );
}
