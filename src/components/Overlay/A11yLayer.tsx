"use client";

import { hotspots } from "@/data/story/hotspots";
import { questions } from "@/data/story/questions";
import { sceneById } from "@/data/story/scenes";
import { openHotspot } from "@/systems/StoryEngine/engine";
import { useStory } from "@/systems/StoryEngine/store";

import styles from "./A11yLayer.module.css";

/**
 * Accessibility: a live region that speaks the story as it happens, and a
 * keyboard list of every object in the current space (Tab to reach it).
 */
export function A11yLayer() {
  const scene = useStory((s) => s.currentScene);
  const beatId = useStory((s) => s.activeBeat);
  const hold = useStory((s) => s.holdLine);
  const question = useStory((s) => s.questionOpen);
  const phase = useStory((s) => s.phase);
  const story = sceneById[scene];
  const beat = beatId ? story?.beats.find((b) => b.id === beatId) : undefined;
  const q = question && story?.question ? questions[story.question] : undefined;

  const say = q?.prompt
    ? `${q.prompt} Choices: ${q.options.map((o) => o.label).join(", ")}.`
    : hold
      ? hold.text
      : beat
        ? [...beat.lines, beat.sub].filter(Boolean).join(" ")
        : story
          ? `Chapter ${story.chapter.index}: ${story.chapter.title}.`
          : "";

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {phase === "explore" ? say : ""}
      </div>
      {phase === "explore" && story && story.hotspots.length > 0 && (
        <nav className={styles.objects} aria-label="Objects in this space">
          <p className={styles.head}>In this space</p>
          <ul>
            {story.hotspots.map((id) => {
              const h = hotspots[id];
              if (!h) return null;
              return (
                <li key={id}>
                  <button type="button" onClick={() => openHotspot(id)}>
                    <span>{h.verb}</span> {h.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
}
