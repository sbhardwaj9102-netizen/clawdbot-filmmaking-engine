import type { SceneId } from "@/data/story/types";
import { sceneById } from "@/data/story/scenes";

import { initialJourney, type Journey, useStory } from "./store";

/**
 * The journey is remembered between visits (choices, visited worlds, opened
 * films) so a returning visitor can continue where they left off.
 * Storage can be unavailable (private mode, blocked) — everything degrades to
 * a fresh journey.
 */
const KEY = "sb.journey.v1";

export function loadJourney(): Journey | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<Journey>;
    if (!data.currentScene || !sceneById[data.currentScene as SceneId]) return null;
    return { ...initialJourney, ...data } as Journey;
  } catch {
    return null;
  }
}

export function clearJourney() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}

let started = false;

/** Writes the journey whenever one of its fields changes. */
export function startPersistence() {
  if (started) return;
  started = true;
  useStory.subscribe(
    (s) => ({
      currentScene: s.currentScene,
      previousScene: s.previousScene,
      history: s.history,
      currentChoice: s.currentChoice,
      choices: s.choices,
      visitedScenes: s.visitedScenes,
      selectedProjects: s.selectedProjects,
      progress: s.progress,
    }),
    (journey) => {
      // The studio is set up behind the loader before anyone enters; that must
      // not overwrite the journey a returning visitor may want to continue.
      const phase = useStory.getState().phase;
      if (phase === "boot" || phase === "ready") return;
      try {
        window.localStorage.setItem(KEY, JSON.stringify(journey));
      } catch {
        /* storage unavailable */
      }
    },
    { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
  );
}
