"use client";

import { Close } from "@/components/UI/Icons";
import { ROBOT } from "@/data/story";
import { useExperience } from "@/systems/Experience/store";
import { tour } from "@/systems/Experience/tour";

import styles from "./RobotDialogue.module.css";

/**
 * PA-1's subtitles. Every line is on screen whether or not sound is on;
 * the visitor can dismiss a line at any time.
 */
export function RobotDialogue() {
  const line = useExperience((s) => s.robotLine);
  const mode = useExperience((s) => s.mode);
  const ended = useExperience((s) => s.ended);
  if (!line || mode === "landing") return null;
  return (
    <aside className={`${styles.wrap} ${mode === "explore" ? styles.explore : ""} ${ended ? styles.end : ""}`} aria-label={`${ROBOT.name} says`} key={line.key}>
      <div className={styles.bubble}>
        <RobotFace />
        <div className={styles.text}>
          <p className={styles.name}>
            {ROBOT.name} <span>· {ROBOT.role}</span>
          </p>
          <p className={styles.line}>{line.text}</p>
        </div>
        <button type="button" className={styles.skip} onClick={tour.skipLine} aria-label="Skip this line" data-action="skip-line">
          <Close />
        </button>
      </div>
    </aside>
  );
}

/** A tiny drawing of PA-1: shell, visor, two eyes that blink while it talks. */
export function RobotFace({ size = 40 }: { size?: number }) {
  return (
    <svg className={styles.face} width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <rect x="4" y="7" width="32" height="26" rx="10" className={styles.shell} />
      <rect x="9" y="14" width="22" height="11" rx="4" className={styles.visor} />
      <rect x="13" y="17.5" width="5" height="4" rx="1.5" className={styles.eye} />
      <rect x="22" y="17.5" width="5" height="4" rx="1.5" className={styles.eye} />
      <path d="M27 7 L29 2.5" className={styles.antenna} />
      <circle cx="29.3" cy="2.4" r="1.6" className={styles.eye} />
    </svg>
  );
}
