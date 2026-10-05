"use client";

import { useEffect, useState } from "react";

import { profile } from "@/data/profile";
import { sceneById } from "@/data/story/scenes";
import type { SceneId } from "@/data/story/types";
import { asset } from "@/lib/assets";
import { enter, savedJourney } from "@/systems/StoryEngine/engine";
import { useStory } from "@/systems/StoryEngine/store";

import styles from "./Loader.module.css";

/**
 * Opening card. Black, one point of light, the name. When the stage is ready:
 * ENTER (sound off by default), or continue a saved journey. Quick Mode and the
 * resume are reachable before anything loads.
 */
export function Loader({ ready }: { ready: boolean }) {
  const phase = useStory((s) => s.phase);
  const webgl = useStory((s) => s.webgl);
  const [progress, setProgress] = useState(0.05);
  const [sound, setSound] = useState(false);
  const [gone, setGone] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [saved, setSaved] = useState<ReturnType<typeof savedJourney>>(null);
  const [target, setTarget] = useState<SceneId | null>(null);

  useEffect(() => {
    setSaved(savedJourney());
    const params = new URLSearchParams(window.location.search);
    const go = (params.get("go") || window.location.hash.slice(1)) as SceneId;
    if (go && sceneById[go]) setTarget(go);
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setProgress((p) => {
        const goal = ready ? 1 : 0.86;
        return p + (goal - p) * (ready ? 0.12 : 0.02);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  useEffect(() => {
    if (phase === "intro" || phase === "explore") {
      setLeaving(true);
      const t = setTimeout(() => setGone(true), 1600);
      return () => clearTimeout(t);
    }
  }, [phase]);

  if (gone || !webgl) return null;
  const canEnter = ready && phase === "ready";

  const go = (opts: { resume?: boolean }) => {
    if (!canEnter) return;
    enter({ ...opts, target: opts.resume ? null : target, sound });
  };

  return (
    <div className={`${styles.loader} ${leaving ? styles.leaving : ""}`} role="dialog" aria-modal="false" aria-label="Satyam Bhardwaj — enter the experience">
      <div className={styles.center}>
        <span className={styles.point} aria-hidden />
        <h1 className={styles.name}>
          <span>{profile.first}</span> <span>{profile.last}</span>
        </h1>
        <p className={styles.title}>{profile.title}</p>
        <p className={styles.disciplines}>{profile.disciplines.join(" · ")}</p>

        <div className={styles.progress} aria-hidden>
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>

        <div className={`${styles.actions} ${canEnter ? styles.show : ""}`}>
          <button type="button" className={styles.enter} onClick={() => go({})} disabled={!canEnter} autoFocus data-cursor="ENTER">
            {target ? `Enter at ${sceneById[target].chapter.title}` : "Enter"}
          </button>
          {saved && !target && (
            <button type="button" className={styles.resume} onClick={() => go({ resume: true })} disabled={!canEnter}>
              Continue where you left off — {sceneById[saved.currentScene]?.chapter.title}
            </button>
          )}
          <button type="button" className={styles.sound} onClick={() => setSound((v) => !v)} aria-pressed={sound}>
            Sound <b>{sound ? "on" : "off"}</b>
          </button>
          <p className={styles.hint}>{canEnter ? "Scroll or swipe to walk · choose with a click or tap" : "Preparing the studio…"}</p>
        </div>
      </div>

      <nav className={styles.quick} aria-label="Recruiter shortcuts">
        <button type="button" onClick={() => useStory.setState({ overlay: "quick" })}>
          Quick mode
        </button>
        <a href={asset(profile.resumePdf)} download>
          Resume (PDF)
        </a>
        <a href={`mailto:${profile.contact.email}`}>Email</a>
      </nav>
    </div>
  );
}
