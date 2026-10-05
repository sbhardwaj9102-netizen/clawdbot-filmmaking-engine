"use client";

import { audio } from "@/systems/AudioManager/audio";

import { getExperience, setExperience, type Theme } from "./store";

/**
 * Visitor preferences: theme (remembered), sound (off on every visit until
 * the visitor turns it on — browsers only allow audio after a click, and we
 * never want to surprise anyone) and reduced motion (from the system, or the
 * toggle).
 */

const THEME_KEY = "sb.theme";

export function readPreferences() {
  const attr = document.documentElement.getAttribute("data-theme");
  const theme: Theme = attr === "light" ? "light" : "dark";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  setExperience({ theme, reducedMotion: reduced });
  document.documentElement.classList.toggle("reduce-motion", reduced);
}

export function setTheme(theme: Theme) {
  setExperience({ theme });
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* storage unavailable: the choice lasts for this visit */
  }
}

export function toggleTheme() {
  setTheme(getExperience().theme === "dark" ? "light" : "dark");
}

/** Call from a click: that's what lets the browser start audio. */
export function setSound(on: boolean) {
  setExperience({ sound: on });
  audio.setEnabled(on);
}

export function toggleSound() {
  setSound(!getExperience().sound);
}

export function setReducedMotion(on: boolean) {
  setExperience({ reducedMotion: on });
  document.documentElement.classList.toggle("reduce-motion", on);
}
