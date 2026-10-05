"use client";

import { asset } from "@/lib/assets";
import { useStory } from "@/systems/StoryEngine/store";

import styles from "./Frame.module.css";

/** Moving film grain. */
export function Grain() {
  return <div className="grain" aria-hidden style={{ backgroundImage: `url(${asset("/assets/site/grain.png")})` }} />;
}

/** 2.39:1 bars that close in for cinematic moments (opening, travel, finale). */
export function Letterbox() {
  const on = useStory((s) => s.letterbox && s.phase !== "boot");
  return (
    <div className={`${styles.letterbox} ${on ? styles.on : ""}`} aria-hidden>
      <span />
      <span />
    </div>
  );
}

/** Fade to / from black for cuts. */
export function Fader() {
  const fade = useStory((s) => s.fade);
  return <div className={styles.fader} style={{ opacity: fade }} aria-hidden />;
}
