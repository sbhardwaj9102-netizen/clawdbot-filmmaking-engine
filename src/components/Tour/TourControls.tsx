"use client";

import { useEffect, useRef } from "react";

import { Close, Next, Pause, Play, Prev } from "@/components/UI/Icons";
import { chapterIndex, chapters, tourLength } from "@/data/story";
import { rt } from "@/systems/Experience/runtime";
import { useExperience } from "@/systems/Experience/store";
import { tour } from "@/systems/Experience/tour";

import styles from "./TourControls.module.css";

/**
 * The tour's transport: where you are (act, a segmented progress line you
 * can click), pause / back / skip, and a way out at any point.
 */
export function TourControls() {
  const mode = useExperience((s) => s.mode);
  const chapter = useExperience((s) => s.chapter);
  const paused = useExperience((s) => s.paused);
  const ended = useExperience((s) => s.ended);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);

  // the current segment fills on the chapter clock without re-rendering
  useEffect(() => {
    if (mode !== "tour") return;
    let raf = 0;
    const tick = () => {
      const i = chapterIndex[useExperience.getState().chapter];
      const done = useExperience.getState().ended;
      fills.current.forEach((el, k) => {
        if (!el) return;
        const v = done || k < i ? 1 : k > i ? 0 : Math.min(1, rt.chapterT / chapters[k].duration);
        el.style.transform = `scaleX(${v})`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  if (mode !== "tour") return null;
  const i = chapterIndex[chapter];
  const ch = chapters[i];

  return (
    <div className={styles.bar} role="group" aria-label="Tour controls">
      <div className={styles.where}>
        <p className={styles.act}>
          <span>{ended ? "The end" : ch.act}</span>
          <span className={styles.count}>{ended ? "" : `${String(i + 1).padStart(2, "0")} / ${chapters.length}`}</span>
        </p>
        <ol className={styles.track}>
          {chapters.map((c, k) => (
            <li key={c.id} style={{ flexGrow: c.duration / tourLength }}>
              <button type="button" onClick={() => tour.goTo(c.id)} aria-label={`Go to ${c.act}: part ${k + 1}`} aria-current={k === i && !ended ? "step" : undefined}>
                <span ref={(el) => void (fills.current[k] = el)} className={styles.fill} />
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.buttons}>
        <button type="button" className={styles.icon} onClick={tour.prev} aria-label="Previous part" data-action="prev">
          <Prev />
        </button>
        {!ended && (
          <button type="button" className={`${styles.icon} ${styles.main}`} onClick={tour.togglePause} aria-label={paused ? "Play" : "Pause"} aria-pressed={paused} data-action="pause">
            {paused ? <Play /> : <Pause />}
          </button>
        )}
        {!ended && (
          <button type="button" className={styles.icon} onClick={tour.next} aria-label="Skip to the next part" data-action="skip">
            <Next />
          </button>
        )}
        <button type="button" className={styles.exit} onClick={tour.exit} data-action="exit">
          <Close />
          <span>Exit tour</span>
        </button>
      </div>
      {paused && <p className={styles.paused} aria-live="polite">Paused</p>}
    </div>
  );
}
