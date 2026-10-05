"use client";

import { sceneById } from "@/data/story/scenes";
import { useStory } from "@/systems/StoryEngine/store";

import styles from "./BeatLayer.module.css";

/**
 * The narration: lines that appear as the avatar reaches story beats, and the
 * timed lines of a held moment ("EVERYTHING STARTS WITH A STORY.").
 */
export function BeatLayer() {
  const scene = useStory((s) => s.currentScene);
  const beatId = useStory((s) => s.activeBeat);
  const hold = useStory((s) => s.holdLine);
  const hidden = useStory((s) => !!s.hotspot || !!s.transition || s.questionOpen || !!s.overlay || s.phase !== "explore");
  const beat = beatId ? sceneById[scene]?.beats.find((b) => b.id === beatId) : undefined;

  if (hold && !hidden) {
    return (
      <div className={`${styles.layer} ${styles.center}`} aria-hidden>
        <p key={hold.key} className={styles.hold} style={{ animationDuration: `${hold.duration + 0.4}s` }}>
          {hold.text}
        </p>
      </div>
    );
  }
  if (!beat || hidden || !beat.lines.length) return null;
  const style = beat.style ?? "statement";
  return (
    <div className={`${styles.layer} ${styles[style]}`} aria-hidden>
      <div key={beat.id} className={styles.block}>
        {beat.lines.map((l, i) => (
          <span key={l} className={styles.line} style={{ animationDelay: `${0.12 + i * 0.14}s` }}>
            {l}
          </span>
        ))}
        {beat.sub && (
          <span className={styles.sub} style={{ animationDelay: `${0.3 + beat.lines.length * 0.14}s` }}>
            {beat.sub}
          </span>
        )}
      </div>
    </div>
  );
}
