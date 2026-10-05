"use client";

import type { SceneId } from "@/data/story/types";
import { audio } from "@/systems/AudioManager/audio";
import {
  back,
  choose,
  closeHotspot,
  debugState,
  go,
  jump,
  openHotspot,
  playIntro,
  skipIntro,
  startAt,
  walk,
} from "@/systems/SceneManager/director";

import { clearJourney, loadJourney } from "./persistence";
import { getStory, initialJourney, useStory } from "./store";

/**
 * STORY ENGINE — the public API the interface talks to. Narrative state lives
 * in the store; spatial work (walking, transitions, camera) is delegated to the
 * SceneManager's director.
 */
export { back, choose, closeHotspot, go, jump, openHotspot, skipIntro, walk };

/** Mount the studio behind the loader so its shaders compile before the visitor enters. */
export function prepare() {
  if (getStory().mounted.length) return;
  startAt("studio", { intro: true, hold: true });
}

export function savedJourney() {
  const j = loadJourney();
  return j && j.visitedScenes.length > 1 ? j : null;
}

/** ENTER: start the opening, or resume a saved journey / deep link with a cut. */
export function enter(opts: { resume?: boolean; target?: SceneId | null; sound: boolean }) {
  audio.setEnabled(opts.sound);
  useStory.setState({ sound: opts.sound });
  if (opts.target) {
    startAt(opts.target, { intro: false });
    return;
  }
  if (opts.resume) {
    const j = loadJourney();
    if (j) {
      const scene = j.currentScene === "final" ? "about" : j.currentScene;
      useStory.setState({ ...j, currentScene: scene });
      startAt(scene, { intro: false });
      return;
    }
  }
  clearJourney();
  useStory.setState({ ...initialJourney, visitedScenes: ["studio"], progress: 1 / 7 });
  playIntro();
}

/** Start over from the black screen. */
export function restart() {
  clearJourney();
  useStory.setState({ ...initialJourney, overlay: null, contactOpen: false, lightbox: null, hotspot: null, fade: 1 });
  window.setTimeout(() => {
    startAt("studio", { intro: true });
  }, 500);
}

export function setSound(on: boolean) {
  audio.setEnabled(on);
  useStory.setState({ sound: on });
}

export function setReducedMotion(on: boolean) {
  useStory.setState({ reducedMotion: on });
  document.documentElement.classList.toggle("reduce-motion", on);
}

export { debugState };
