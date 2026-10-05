"use client";

import { useCallback, useEffect, useRef } from "react";

import { hotspots } from "@/data/story/hotspots";
import { asset } from "@/lib/assets";
import { closeHotspot } from "@/systems/StoryEngine/engine";
import { getStory, useStory } from "@/systems/StoryEngine/store";

import styles from "./Lightbox.module.css";

/** Full-screen viewer for stills and the reel. Arrow keys / swipe to move through a set. */
export function Lightbox() {
  const lb = useStory((s) => s.lightbox);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);

  const close = useCallback(() => {
    useStory.setState({ lightbox: null });
    const hs = getStory().hotspot;
    // a media hotspot (the reel) closes with its viewer; a panel stays open underneath
    if (hs && hs.status === "open" && hotspots[hs.id]?.action.type === "media") closeHotspot();
  }, []);
  const step = useCallback((d: number) => {
    const s = getStory().lightbox;
    if (!s) return;
    useStory.setState({ lightbox: { ...s, index: (s.index + d + s.items.length) % s.items.length } });
  }, []);

  useEffect(() => {
    if (!lb) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Escape") {
        e.stopImmediatePropagation();
        close();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [lb, step, close]);

  if (!lb) return null;
  const item = lb.items[lb.index];
  const many = lb.items.length > 1;
  return (
    <div
      className={styles.box}
      role="dialog"
      aria-modal="true"
      aria-label={item.alt}
      onClick={(e) => e.target === e.currentTarget && close()}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <figure className={styles.figure} key={item.src + lb.index}>
        {item.video ? (
          <video src={asset(item.video)} poster={asset(item.src)} controls autoPlay playsInline loop className={styles.media} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset(item.src)} alt={item.alt} className={styles.media} />
        )}
        <figcaption>
          <span>{item.label ?? ""}</span>
          <span>{item.alt}</span>
          {many && (
            <span>
              {lb.index + 1} / {lb.items.length}
            </span>
          )}
        </figcaption>
      </figure>
      {many && (
        <>
          <button type="button" className={`${styles.nav} ${styles.prev}`} onClick={() => step(-1)} aria-label="Previous">
            ←
          </button>
          <button type="button" className={`${styles.nav} ${styles.next}`} onClick={() => step(1)} aria-label="Next">
            →
          </button>
        </>
      )}
      <button ref={closeBtn} type="button" className={styles.close} onClick={close}>
        Close <kbd>esc</kbd>
      </button>
    </div>
  );
}
