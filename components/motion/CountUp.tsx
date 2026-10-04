"use client";

import { animate, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

type Props = { value: number; pad?: number; duration?: number; delay?: number; className?: string };

/** Counts from zero when it scrolls into view. Renders the final value for no-JS / SEO. */
export function CountUp({ value, pad = 2, duration = 2.2, delay = 0, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const fmt = (n: number) => String(Math.round(n)).padStart(pad, "0");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!inView) {
      el.textContent = fmt(0);
      return;
    }
    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = fmt(v);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value]);

  return (
    <span ref={ref} className={className} aria-label={String(value)}>
      {fmt(value)}
    </span>
  );
}
