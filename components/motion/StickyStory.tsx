"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { EASE_OUT } from "@/lib/motion";
import type { Asset } from "@/lib/types";
import { Media } from "./Media";
import { ParallaxImage } from "./ParallaxImage";
import styles from "./StickyStory.module.css";

export type StoryItem = { title: string; body: string; image: Asset };

function Step({ item, index, onActive, active }: { item: StoryItem; index: number; onActive: (i: number) => void; active: boolean }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });
  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);
  return (
    <li ref={ref} className={styles.step} data-active={active || undefined}>
      <span className={`${styles.stepIndex} label`}>{String(index + 1).padStart(2, "0")}</span>
      <h3 className={`${styles.stepTitle} display`}>{item.title}</h3>
      <p className={styles.stepBody}>{item.body}</p>
      <div className={styles.mobileImage}>
        <ParallaxImage asset={item.image} className={styles.mobileFrame} speed={0.06} />
        {item.image.caption && <span className={`${styles.mobileCaption} label`}>{item.image.caption}</span>}
      </div>
    </li>
  );
}

/**
 * Scrollytelling: a pinned frame crossfades between images while the steps
 * scroll past. A rail across the top shows the whole sequence (A → B → C).
 */
export function StickyStory({ items, rail = true, imageSide = "left" }: { items: StoryItem[]; rail?: boolean; imageSide?: "left" | "right" }) {
  const [active, setActive] = useState(0);
  const current = items[active];

  return (
    <div className={styles.story} data-side={imageSide}>
      <div className={styles.stickyCol}>
        <div className={styles.sticky}>
          {rail && (
            <ol className={`${styles.rail} label`} aria-hidden>
              {items.map((it, i) => (
                <li key={it.title} className={styles.railItem} data-on={i <= active || undefined}>
                  <span>{it.title}</span>
                  {i < items.length - 1 && <span className={styles.railArrow}>→</span>}
                </li>
              ))}
            </ol>
          )}
          <div className={styles.frame}>
            <AnimatePresence initial={false}>
              <motion.div
                key={active}
                className={styles.layer}
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 1.2, ease: EASE_OUT, delay: 0.2 } }}
                transition={{ opacity: { duration: 1.2, ease: EASE_OUT }, scale: { duration: 2.4, ease: EASE_OUT } }}
              >
                <Media asset={current.image} />
              </motion.div>
            </AnimatePresence>
            <div className={styles.shade} />
            <div className={`${styles.meta} label`}>
              <span>{current.image.caption}</span>
              <span>
                {String(active + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>
      </div>
      <ol className={styles.steps}>
        {items.map((it, i) => (
          <Step key={it.title} item={it} index={i} onActive={setActive} active={i === active} />
        ))}
      </ol>
    </div>
  );
}
