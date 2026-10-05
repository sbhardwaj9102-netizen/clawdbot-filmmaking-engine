"use client";

import type { ChapterId, WorkId } from "@/data/story";
import { tex } from "@/lib/assets";
import { useExperience } from "@/systems/Experience/store";

import styles from "./Backdrop2D.module.css";

/**
 * Without WebGL (or if the 3D stage fails) the story still plays: the same
 * tour, captions, PA-1 and Explore, over still images with a slow drift.
 */
const CHAPTER_ART: Partial<Record<ChapterId, string>> = {
  intro: "/assets/site/hero.jpg",
  who: "/assets/site/portrait.jpg",
  job: "/assets/aster/production.jpg",
  aster: "/assets/aster/cover.jpg",
  purple: "/assets/purple/cover.jpg",
  live: "/assets/events/venue-live.jpg",
};
const WORK_ART: Record<WorkId, string> = {
  aster: "/assets/aster/cover.jpg",
  purple: "/assets/purple/cover.jpg",
  live: "/assets/events/venue-live.jpg",
  more: "/assets/rana/cover.jpg",
};

export function Backdrop2D() {
  const webgl = useExperience((s) => s.webgl);
  const mode = useExperience((s) => s.mode);
  const chapter = useExperience((s) => s.chapter);
  const ended = useExperience((s) => s.ended);
  const section = useExperience((s) => s.section);
  const work = useExperience((s) => s.work);
  if (webgl) return null;

  let art: string | null = "/assets/site/hero.jpg";
  if (mode === "tour") art = ended ? null : (CHAPTER_ART[chapter] ?? null);
  if (mode === "explore") art = section === "work" ? WORK_ART[work] : section === "about" ? "/assets/site/portrait.jpg" : null;
  const key = `${mode}:${chapter}:${section}:${work}:${ended}`;

  return (
    <div className={styles.backdrop} aria-hidden>
      {art ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={key} src={tex(art)} alt="" className={styles.art} />
      ) : (
        <div key={key} className={styles.room} />
      )}
    </div>
  );
}
