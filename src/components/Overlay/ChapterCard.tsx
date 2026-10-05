"use client";

import { useEffect, useState } from "react";

import { sceneById } from "@/data/story/scenes";
import { useStory } from "@/systems/StoryEngine/store";

import styles from "./ChapterCard.module.css";

/** A title card whenever a new chapter begins (shown mid-corridor, as the world changes). */
export function ChapterCard() {
  const at = useStory((s) => s.chapterAt);
  const scene = useStory((s) => s.currentScene);
  const phase = useStory((s) => s.phase);
  const [shown, setShown] = useState<{ key: number; scene: string } | null>(null);

  useEffect(() => {
    if (!at || phase !== "explore") return;
    setShown({ key: at, scene });
    const t = setTimeout(() => setShown(null), 3600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at]);

  if (!shown) return null;
  const ch = sceneById[shown.scene as keyof typeof sceneById]?.chapter;
  if (!ch || shown.scene === "studio") return null;
  return (
    <div key={shown.key} className={styles.card} aria-hidden>
      <span className={styles.index}>Chapter {ch.index}</span>
      <span className={styles.rule} />
      <span className={styles.title}>{ch.title}</span>
      {ch.subtitle && <span className={styles.sub}>{ch.subtitle}</span>}
    </div>
  );
}
