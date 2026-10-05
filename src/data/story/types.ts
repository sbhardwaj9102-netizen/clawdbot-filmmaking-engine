import type { Media, PanelContent } from "../types";

/**
 * STORY MODEL
 * ------------------------------------------------------------------
 * The story is data. Scenes, beats, questions and object behaviours live in
 * /src/data/story and never touch rendering code. A scene names the world it
 * plays in; the world (in /src/scenes) owns geometry, paths and camera shots.
 * Beats reference the world's named waypoints, so either side can change
 * without rewriting the other.
 */

export type SceneId =
  | "studio"
  | "film"
  | "aster"
  | "purple"
  | "rana"
  | "gluttony"
  | "production"
  | "events"
  | "finance"
  | "business"
  | "career"
  | "about"
  | "final";

export type WorldId =
  | "studio"
  | "filmset"
  | "project"
  | "production"
  | "events"
  | "finance"
  | "business"
  | "career"
  | "about"
  | "final";

/** A waypoint id in the world's path, or a 0–1 position along it. */
export type Mark = string | number;

export type HoldLine = {
  text: string;
  sub?: string;
  /** Seconds the line stays up. */
  duration: number;
  /** World event fired when the line appears (worlds react to these). */
  event?: string;
};

export type Beat = {
  id: string;
  at: Mark;
  until?: Mark;
  lines: string[];
  sub?: string;
  style?: "title" | "statement" | "caption" | "slug";
  /** Named camera shot (defined by the world) held while the beat is active. */
  shot?: string;
  /** World event fired when the beat is reached. */
  event?: string;
  /** Pauses the walk here and plays these lines in sequence. */
  hold?: HoldLine[];
};

export type ChoiceOption = {
  id: string;
  label: string;
  hint?: string;
  next: SceneId;
};

export type Question = {
  id: string;
  prompt?: string;
  sub?: string;
  options: ChoiceOption[];
  /** Converging exit, shown once enough worlds have been visited. */
  onward?: { label: string; hint?: string; next: SceneId; minVisited: number };
};

export type StoryScene = {
  id: SceneId;
  world: WorldId;
  /** Project slug/scene for project worlds. */
  project?: string;
  chapter: { index: string; title: string; subtitle?: string };
  beats: Beat[];
  /** Interactive objects present in this scene (ids from hotspots.ts). */
  hotspots: string[];
  question?: string;
  /** Continue here when the path ends and there is no question. */
  next?: SceneId;
  /** Counts as one of the primary worlds for convergence and progress. */
  primary?: boolean;
  /** The avatar walks on its own (finale). */
  auto?: boolean;
};

export type HotspotVerb = "VIEW" | "ENTER" | "OPEN" | "WATCH" | "EXPLORE" | "READ";

export type HotspotAction =
  | { type: "panel"; content: PanelContent }
  | { type: "project"; scene: SceneId }
  | { type: "media"; items: Media[] }
  | { type: "resume" };

export type HotspotDef = {
  id: string;
  verb: HotspotVerb;
  label: string;
  action: HotspotAction;
  /** Avatar reaches toward the object when it opens. */
  reach?: boolean;
};
