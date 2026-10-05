"use client";

import { useEffect, useRef } from "react";

import { sceneById } from "@/data/story/scenes";
import { choose } from "@/systems/StoryEngine/engine";
import { useStory } from "@/systems/StoryEngine/store";

import { useOptions } from "./options";
import styles from "./QuestionOverlay.module.css";

/**
 * The question, in words, over the world. On desktop the options live in the
 * world itself (and this list is there for keyboard and screen readers); on
 * touch screens the options are shown here as large buttons.
 */
export function QuestionOverlay() {
  const scene = useStory((s) => s.currentScene);
  const open = useStory((s) => s.questionOpen && !s.overlay && !s.transition);
  const nudge = useStory((s) => s.nudge);
  const story = sceneById[scene];
  const { q, options } = useOptions(story?.question);
  const prompt = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!nudge || !prompt.current) return;
    prompt.current.animate([{ transform: "translateY(0)" }, { transform: "translateY(-6px)" }, { transform: "translateY(0)" }], { duration: 500, easing: "ease-out" });
  }, [nudge]);

  if (!open || !q) return null;
  return (
    <section className={styles.wrap} aria-label="Choose where the story goes">
      {q.prompt && (
        <p ref={prompt} className={styles.prompt}>
          {q.prompt}
        </p>
      )}
      <ul className={styles.list} role="list">
        {options.map((o, i) => (
          <li key={o.id}>
            <button type="button" className={styles.option} onClick={() => choose(q.id, o.id)} data-option={o.id}>
              <span className={styles.idx}>{o.id === "onward" ? "→" : String(i + 1).padStart(2, "0")}</span>
              <span className={styles.label}>{o.label}</span>
              {o.hint && <span className={styles.hint}>{o.hint}</span>}
              {o.visited && <span className={styles.visited}>Visited</span>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
