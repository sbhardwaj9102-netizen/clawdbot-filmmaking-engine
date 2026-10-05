"use client";

import { useEffect, useRef, useState } from "react";

import { Moon, SoundOff, SoundOn, Sun } from "@/components/UI/Icons";
import { profile } from "@/data/profile";
import { tourLength } from "@/data/story";
import { setSound, toggleTheme } from "@/systems/Experience/preferences";
import { setExperience, useExperience } from "@/systems/Experience/store";
import { goExplore, tour } from "@/systems/Experience/tour";

import styles from "./Landing.module.css";

/**
 * THE OPENING SHOT
 * The name over a dark studio, two clear choices and two small switches.
 * Nothing to read before you can act. If the stage is still loading when
 * the visitor chooses, the choice waits for it (a few seconds at most).
 */
export function Landing() {
  const mode = useExperience((s) => s.mode);
  const sound = useExperience((s) => s.sound);
  const theme = useExperience((s) => s.theme);
  const ready = useExperience((s) => s.stageReady || !s.webgl);
  const [pending, setPending] = useState<null | "tour" | "explore">(null);
  const tourBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pending) return;
    const go = () => {
      if (pending === "tour") tour.start(0);
      else goExplore("about");
      setPending(null);
    };
    if (ready) {
      go();
      return;
    }
    const t = window.setTimeout(go, 6000);
    return () => window.clearTimeout(t);
  }, [pending, ready]);

  useEffect(() => {
    if (mode === "landing") tourBtn.current?.focus({ preventScroll: true });
  }, [mode]);

  if (mode !== "landing") return null;
  const minutes = Math.round(tourLength / 60);

  return (
    <section className={styles.landing} aria-labelledby="landing-name">
      <div className={styles.scrim} aria-hidden />
      <div className={styles.inner}>
        <p className={`label ${styles.kicker}`}>{profile.disciplines.join(" · ")}</p>
        <h1 id="landing-name" className={styles.name}>
          {profile.name}
        </h1>
        <p className={styles.role}>{profile.title}</p>

        <div className={styles.choices}>
          <button
            ref={tourBtn}
            type="button"
            className="btn btn-primary"
            onClick={() => setPending("tour")}
            aria-busy={pending === "tour"}
            data-action="tour"
          >
            {pending === "tour" ? "Setting the stage…" : "Take the tour"}
            <span className={styles.meta}>~{minutes} min</span>
          </button>
          <button type="button" className="btn" onClick={() => setPending("explore")} aria-busy={pending === "explore"} data-action="explore">
            {pending === "explore" ? "Setting the stage…" : "Explore"}
          </button>
        </div>

        <div className={styles.switches}>
          <button type="button" className="btn btn-quiet" onClick={() => setSound(!sound)} aria-pressed={sound} data-action="sound">
            {sound ? <SoundOn /> : <SoundOff />}
            Sound {sound ? "on" : "off"}
          </button>
          <button type="button" className="btn btn-quiet" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} data-action="theme">
            {theme === "dark" ? <Sun /> : <Moon />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => setExperience({ overlay: "quick" })} data-action="quick">
            Quick view
          </button>
        </div>
      </div>
    </section>
  );
}
