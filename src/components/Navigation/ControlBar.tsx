"use client";

import { useEffect, useState } from "react";

import { profile } from "@/data/profile";
import { sceneById } from "@/data/story/scenes";
import { asset } from "@/lib/assets";
import { back, setSound, skipIntro } from "@/systems/StoryEngine/engine";
import { useStory } from "@/systems/StoryEngine/store";

import styles from "./ControlBar.module.css";

/**
 * The persistent, minimal control — always in reach, never in the way.
 * Top: who this is, which chapter, and the recruiter shortcuts
 * (Quick mode · Resume · Sound · Menu). Bottom: back, what to do next,
 * auto-walk, and the journey so far.
 */
export function ControlBar() {
  const phase = useStory((s) => s.phase);
  const scene = useStory((s) => s.currentScene);
  const history = useStory((s) => s.history.length);
  const sound = useStory((s) => s.sound);
  const auto = useStory((s) => s.autoWalk);
  const progress = useStory((s) => s.progress);
  const atEnd = useStory((s) => s.atEnd);
  const question = useStory((s) => s.questionOpen);
  const hotspot = useStory((s) => s.hotspot);
  const transition = useStory((s) => s.transition);
  const contact = useStory((s) => s.contactOpen);
  const [touch, setTouch] = useState(false);

  useEffect(() => setTouch(window.matchMedia("(pointer: coarse)").matches), []);

  if (phase === "boot" || phase === "ready") return null;
  const story = sceneById[scene];
  const walkWord = touch ? "Swipe up to walk" : "Scroll to walk";
  let hint = walkWord;
  if (phase === "intro") hint = "";
  else if (transition) hint = "";
  else if (hotspot?.status === "open") hint = touch ? "Swipe to keep walking" : "Scroll to keep walking";
  else if (question) hint = "Choose";
  else if (atEnd && story?.next) hint = touch ? "Swipe to continue" : "Scroll to continue";
  else if (story?.auto) hint = "";

  return (
    <div className={`${styles.bar} ${contact ? styles.hidden : ""}`}>
      <header className={styles.top}>
        <div className={styles.id}>
          <span className={styles.name}>{profile.name}</span>
          {story && phase === "explore" && (
            <span className={styles.chapter} key={scene}>
              {story.chapter.index} — {story.chapter.title}
            </span>
          )}
        </div>
        <nav className={styles.actions} aria-label="Shortcuts">
          <button type="button" onClick={() => useStory.setState({ overlay: "quick" })} data-shortcut="quick">
            <span className={styles.long}>Quick mode</span>
            <span className={styles.short}>Quick</span>
          </button>
          <a href={asset(profile.resumePdf)} download>
            Resume ↓
          </a>
          <button type="button" onClick={() => useStory.setState({ contactOpen: true, overlay: null })} data-shortcut="contact">
            Contact
          </button>
          <button type="button" onClick={() => setSound(!sound)} aria-pressed={sound} className={styles.hideSm}>
            Sound {sound ? "on" : "off"}
          </button>
          <button type="button" onClick={() => useStory.setState({ overlay: "menu" })} aria-haspopup="dialog" aria-label="Menu" className={styles.menu}>
            <span aria-hidden className={styles.burger}>
              <i />
              <i />
            </span>
            <span className={styles.long} aria-hidden>
              Menu
            </span>
          </button>
        </nav>
      </header>

      <footer className={styles.bottom}>
        <div className={styles.left}>
          {phase === "intro" ? (
            <button type="button" onClick={skipIntro}>
              Skip intro →
            </button>
          ) : (
            history > 0 &&
            !transition && (
              <button type="button" onClick={back}>
                ← Back
              </button>
            )
          )}
        </div>
        <p className={styles.hint} aria-hidden>
          {hint && (
            <>
              <span className={styles.tick} />
              {hint}
            </>
          )}
        </p>
        <div className={styles.right}>
          {phase === "explore" && !story?.auto && (
            <button type="button" onClick={() => useStory.setState({ autoWalk: !auto })} aria-pressed={auto}>
              {auto ? "❚❚ Auto-walk" : "▶ Auto-walk"}
            </button>
          )}
          <span className={styles.progress} role="img" aria-label={`Journey ${Math.round(progress * 100)} percent`}>
            <span style={{ transform: `scaleX(${progress})` }} />
          </span>
        </div>
      </footer>
    </div>
  );
}
