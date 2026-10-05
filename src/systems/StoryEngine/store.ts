"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type { HoldLine, SceneId } from "@/data/story/types";
import type { Media } from "@/data/types";
import type { Tier } from "@/systems/Quality/quality";

/**
 * STORY STATE
 * ------------------------------------------------------------------
 * The visitor's journey (what they chose, where they've been) plus the
 * discrete UI state that React renders. Anything that changes every frame
 * (avatar position, camera) lives in the director's mutable runtime instead,
 * so React only re-renders when the story actually moves.
 */

export type TransitionKind = "walk" | "dive" | "cut";
export type Overlay = null | "quick" | "resume" | "menu";

export type Mounted = { key: number; scene: SceneId; anchor: { x: number; z: number; yaw: number } };
export type Corridor = { key: number; x: number; z: number; yaw: number; length: number; from: string; to: string };

export type Journey = {
  currentScene: SceneId;
  previousScene: SceneId | null;
  history: SceneId[];
  currentChoice: { question: string; option: string } | null;
  choices: Record<string, string>;
  visitedScenes: SceneId[];
  selectedProjects: string[];
  progress: number;
};

export type StoryState = Journey & {
  phase: "boot" | "ready" | "intro" | "explore";
  mounted: Mounted[];
  corridor: Corridor | null;
  transition: { kind: TransitionKind; from: SceneId; to: SceneId } | null;
  dive: { phase: "push" | "expand" | "reveal"; image: string; rect: { x: number; y: number; w: number; h: number } } | null;
  fade: number;
  letterbox: boolean;
  chapterAt: number;

  activeBeat: string | null;
  holdLine: (HoldLine & { key: number }) | null;
  questionOpen: boolean;
  atEnd: boolean;
  nudge: number;

  hotspot: { id: string; status: "approach" | "open" } | null;
  hovered: string | null;
  nearby: string[];
  worldEvents: Record<string, number>;

  overlay: Overlay;
  quickSection: string | null;
  lightbox: { items: Media[]; index: number } | null;
  contactOpen: boolean;

  sound: boolean;
  reducedMotion: boolean;
  autoWalk: boolean;
  tier: Tier;
  webgl: boolean;

  set: (partial: Partial<StoryState>) => void;
  fire: (event: string) => void;
};

export const initialJourney: Journey = {
  currentScene: "studio",
  previousScene: null,
  history: [],
  currentChoice: null,
  choices: {},
  visitedScenes: [],
  selectedProjects: [],
  progress: 0,
};

export const useStory = create<StoryState>()(
  subscribeWithSelector((set) => ({
    ...initialJourney,
    phase: "boot",
    mounted: [],
    corridor: null,
    transition: null,
    dive: null,
    fade: 0,
    letterbox: true,
    chapterAt: 0,

    activeBeat: null,
    holdLine: null,
    questionOpen: false,
    atEnd: false,
    nudge: 0,

    hotspot: null,
    hovered: null,
    nearby: [],
    worldEvents: {},

    overlay: null,
    quickSection: null,
    lightbox: null,
    contactOpen: false,

    sound: false,
    reducedMotion: false,
    autoWalk: false,
    tier: "medium",
    webgl: true,

    set: (partial) => set(partial),
    fire: (event) => set((s) => ({ worldEvents: { ...s.worldEvents, [event]: performance.now() } })),
  })),
);

export const getStory = () => useStory.getState();
