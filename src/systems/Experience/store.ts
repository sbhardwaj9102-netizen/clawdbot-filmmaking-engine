"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type { ChapterId, SectionId, WorkId } from "@/data/story";
import type { Media } from "@/data/types";
import type { Tier } from "@/systems/Quality/quality";

/**
 * EXPERIENCE STATE
 * ------------------------------------------------------------------
 * The discrete state of the site: which mode the visitor is in, where the
 * tour is, which Explore section is open, theme, sound and overlays. The
 * tour controller is the only thing that moves `chapter`; the rooms, camera
 * and sound read from here (and from the per-frame runtime in runtime.ts).
 */

export type Mode = "landing" | "tour" | "explore";
export type Theme = "dark" | "light";
export type Overlay = null | "quick" | "resume" | "contact";

export type ExperienceState = {
  mode: Mode;

  // the stage
  webgl: boolean;
  stageReady: boolean;
  tier: Tier;
  reducedMotion: boolean;

  // preferences
  theme: Theme;
  sound: boolean;

  // tour
  chapter: ChapterId;
  /** Index of the caption on screen in the current chapter (-1: none yet). */
  caption: number;
  paused: boolean;
  /** The last chapter has played; the end card is up. */
  ended: boolean;

  // PA-1
  robotLine: { key: number; text: string } | null;

  // explore
  section: SectionId;
  work: WorkId;
  hovered: string | null;

  // overlays
  overlay: Overlay;
  lightbox: { items: Media[]; index: number } | null;
};

export const useExperience = create<ExperienceState>()(
  subscribeWithSelector(
    (): ExperienceState => ({
      mode: "landing",
      webgl: true,
      stageReady: false,
      tier: "medium",
      reducedMotion: false,
      theme: "dark",
      sound: false,
      chapter: "intro",
      caption: -1,
      paused: false,
      ended: false,
      robotLine: null,
      section: "about",
      work: "aster",
      hovered: null,
      overlay: null,
      lightbox: null,
    }),
  ),
);

export const getExperience = useExperience.getState;
export const setExperience = useExperience.setState;
