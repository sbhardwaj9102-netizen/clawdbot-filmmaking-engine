"use client";

import { useEffect, useRef } from "react";

/** A running 24fps camera timecode — HH:MM:SS:FF. */
export function Timecode({ className, start = 0 }: { className?: string; start?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now() - start * 1000;
    let last = -1;
    const tick = (now: number) => {
      const frames = Math.floor(((now - t0) / 1000) * 24);
      if (frames !== last && ref.current) {
        last = frames;
        const ff = frames % 24;
        const s = Math.floor(frames / 24);
        const p = (n: number) => String(n).padStart(2, "0");
        ref.current.textContent = `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}:${p(ff)}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start]);
  return (
    <span ref={ref} className={className} aria-hidden>
      00:00:00:00
    </span>
  );
}
