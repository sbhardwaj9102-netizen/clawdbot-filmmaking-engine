"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

import { EASE_OUT } from "@/lib/motion";
import styles from "./motion.module.css";

type Props = {
  /** Each entry is rendered as its own masked line. */
  lines: string[];
  as?: "h1" | "h2" | "h3" | "p" | "div" | "span";
  className?: string;
  /** Optional class per line (index-matched), e.g. for an indented second line. */
  lineClassNames?: (string | undefined)[];
  delay?: number;
  stagger?: number;
  duration?: number;
  /** Split each line into characters for a finer title reveal. */
  chars?: boolean;
  /** Start immediately instead of when scrolled into view. */
  play?: boolean;
  amount?: number;
};

/** Lines (or letters) rise out of a hard mask — the site's signature type reveal. */
export function MaskText({
  lines,
  as = "div",
  className,
  lineClassNames,
  delay = 0,
  stagger = 0.11,
  duration = 1.3,
  chars = false,
  play,
  amount = 0.4,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount });
  const show = play ?? inView;
  const Tag = motion[as] as typeof motion.div;
  let charIndex = 0;

  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} className={className} aria-label={lines.join(" ")}>
      {lines.map((line, i) => (
        <span key={i} className={`${styles.maskLine} ${lineClassNames?.[i] ?? ""}`} aria-hidden>
          {chars ? (
            line.split("").map((c, j) => {
              const k = charIndex++;
              return (
                <motion.span
                  key={j}
                  className={styles.maskChar}
                  initial={{ y: "112%" }}
                  animate={show ? { y: "0%" } : { y: "112%" }}
                  transition={{ duration, ease: EASE_OUT, delay: delay + k * 0.035 + i * 0.08 }}
                >
                  {c === " " ? " " : c}
                </motion.span>
              );
            })
          ) : (
            <motion.span
              className={styles.maskInner}
              initial={{ y: "112%" }}
              animate={show ? { y: "0%" } : { y: "112%" }}
              transition={{ duration, ease: EASE_OUT, delay: delay + i * stagger }}
            >
              {line}
            </motion.span>
          )}
        </span>
      ))}
    </Tag>
  );
}
