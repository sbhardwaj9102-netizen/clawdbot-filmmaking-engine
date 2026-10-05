import { Vector3 } from "three";

import type { ShotId } from "@/data/story";
import { livePalette } from "@/scenes/palettes";

/**
 * RUNTIME — the mutable, per-frame side of the experience. Things that change
 * every frame (positions, clocks, light levels) live here rather than in the
 * store, so moving them never re-renders React.
 */
export const rt = {
  /** Seconds into the current tour chapter (frozen while paused). */
  chapterT: 0,
  /** Seconds the page has been running (for idle animation). */
  time: 0,

  /** Camera set-up. `since` is a performance.now() stamp; `blend` is the move's length in seconds. */
  shot: { id: "landing" as ShotId, since: 0, blend: 0, hold: 0 },
  /** Where the camera actually is this frame. */
  camera: { pos: new Vector3(-0.6, 3.5, 13.5), dir: new Vector3(0, 0, -1) },

  /** Satyam. Read by the Avatar component. */
  avatar: {
    pos: new Vector3(-2.2, 0, 2.1),
    yaw: Math.PI,
    /** The heading to settle on when standing. */
    face: Math.PI,
    speed: 0,
    look: null as Vector3 | null,
    reachTarget: null as Vector3 | null,
    /** Where he is heading, and the yaw to settle on there. */
    goal: null as null | { points: Vector3[]; faceYaw: number; speed: number },
  },

  /** PA-1. */
  robot: {
    pos: new Vector3(3.5, 6.5, 6),
    yaw: 0,
    speaking: false,
    /** 0–1, how present he is (he flies in when the tour starts). */
    presence: 0,
    /** Jump straight to his spot next frame (after a cut). */
    snap: false,
  },

  /** Current (smoothed) light level of each room, 0–1. */
  rooms: { producer: 0.3, strategist: 0.1 },

  /** What the set is doing, smoothed (see choreography.envFor). */
  env: { pins: 0, days: 0, fire: 0, strings: 0, shift: 0, door: 0, steps: 0, rack: 0, screen: "hero" as "hero" | "aster" | "purple" | "live" },

  /** The blended look of the stage this frame (theme × room). */
  look: { theme: 0, room: 0, palette: livePalette() },

  /** Pointer in -1…1, for a little parallax in Explore. */
  pointer: { x: 0, y: 0 },

  /** Layout facts the camera needs. `panel`: px covered by a side panel on the right; `sheet`: by a sheet along the bottom. */
  view: { mobile: false, portrait: false, panel: 0, sheet: 0, captionLeft: false },
};

export type Runtime = typeof rt;
