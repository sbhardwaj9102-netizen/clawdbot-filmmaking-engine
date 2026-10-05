import { Vector3 } from "three";

import type { ChapterId, SectionId, ShotId, WorkId } from "@/data/story";
import { clamp, smoothstep, yawOf } from "@/lib/math";

import type { Mode } from "./store";

/**
 * CHOREOGRAPHY
 * ------------------------------------------------------------------
 * The stage is one floor with two rooms side by side:
 *
 *   x  -10 ………… 6 | 6 ……… 12 | 12 ………… 26
 *      THE PRODUCER | the shift | THE STRATEGIST
 *
 * For every chapter (tour) or section (explore) this file says where the
 * camera looks, where Satyam stands, how lit each room is, and what the set
 * is doing (pins on the map, the fire, the festoon lights…). Everything is a
 * pure function of state + time, so pausing, skipping back or jumping to a
 * section always lands in a consistent picture.
 */

export const STAGE = {
  producer: { x: -2, z: -1 },
  strategist: { x: 19, z: -1 },
  asterWall: new Vector3(-9.2, 0, -1.2),
  purpleSet: new Vector3(3.6, 0, -5.4),
  fire: new Vector3(3.1, 0, -3.3),
  desk: new Vector3(-2.2, 0, 0.9),
  rack: new Vector3(-6.7, 0, -6.1),
  screen: new Vector3(-1.6, 0, -8.7),
  shiftWall: { z: -3.6, x0: 6.6, x1: 11.4 },
  table: new Vector3(18.6, 0, -2.2),
  display: new Vector3(25.6, 0, -0.4),
  globe: new Vector3(14.2, 0, -4.4),
  door: new Vector3(9, 0, -8.4),
};

type Mark = { pos: Vector3; face: number };
const mark = (x: number, z: number, lookX: number, lookZ: number): Mark => ({
  pos: new Vector3(x, 0, z),
  face: yawOf(lookX - x, lookZ - z),
});

export const MARKS = {
  monitor: mark(-2.2, 2.1, -2.2, 0.8),
  aster: mark(-6.1, 0.1, -9.2, -1.3),
  // at the safety line, left of the fire as we see it
  purple: mark(1.1, -1.6, 3.1, -3.3),
  live: mark(2.75, 2.2, 2.4, -3),
  strategist: mark(16.6, 1.5, 18.6, -2.4),
  display: mark(21.7, 1.25, 25.6, -0.4),
  center: mark(9, 2.4, 9, -8),
  door: mark(9, -5.2, 9, -9),
} satisfies Record<string, Mark>;
export type MarkId = keyof typeof MARKS;

/** Points the walk passes through on the way to a mark (keeps him off the furniture). */
const VIA: Partial<Record<MarkId, Vector3[]>> = {
  strategist: [new Vector3(7, 0, 2.6), new Vector3(12.5, 0, 2.4)],
  center: [new Vector3(12.5, 0, 2.8)],
  monitor: [new Vector3(7, 0, 2.6)],
  aster: [new Vector3(7, 0, 2.6)],
  purple: [new Vector3(7, 0, 2.6)],
  live: [new Vector3(7, 0, 2.6)],
};

export type Setup = {
  shot: ShotId;
  mark: MarkId;
  /** Walking speed toward the mark (m/s). */
  pace: number;
  producer: number;
  strategist: number;
  /** Which side of Satyam (on screen) PA-1 keeps: 1 right, -1 left. Default right. */
  robotSide?: number;
  /** PA-1's hover height (default 1.95 m, about Satyam's eye line). */
  robotHeight?: number;
};

const CHAPTER_SETUP: Record<ChapterId, Setup> = {
  intro: { shot: "establish", mark: "monitor", pace: 1.2, producer: 1, strategist: 0.12 },
  who: { shot: "satyam", mark: "monitor", pace: 1.2, producer: 1, strategist: 0.12 },
  job: { shot: "set", mark: "monitor", pace: 1.2, producer: 1, strategist: 0.15 },
  aster: { shot: "aster", mark: "aster", pace: 1.3, producer: 1, strategist: 0.12 },
  purple: { shot: "purple", mark: "purple", pace: 1.5, producer: 1, strategist: 0.12, robotHeight: 2.3 },
  live: { shot: "live", mark: "live", pace: 1.3, producer: 1, strategist: 0.2 },
  shift: { shot: "shift", mark: "strategist", pace: 1.75, producer: 0.45, strategist: 1 },
  strategist: { shot: "strategist", mark: "strategist", pace: 1.4, producer: 0.25, strategist: 1 },
  finance: { shot: "finance", mark: "display", pace: 1.3, producer: 0.25, strategist: 1, robotHeight: 1.25 },
  combination: { shot: "wide", mark: "center", pace: 1.25, producer: 1, strategist: 1 },
  future: { shot: "future", mark: "door", pace: 1.1, producer: 0.75, strategist: 0.75 },
};

const WORK_SHOT: Record<WorkId, ShotId> = {
  aster: "explore-aster",
  purple: "explore-purple",
  live: "explore-live",
  more: "explore-more",
};
const WORK_MARK: Record<WorkId, MarkId> = { aster: "aster", purple: "purple", live: "live", more: "monitor" };

export function setupFor(s: { mode: Mode; chapter: ChapterId; ended: boolean; section: SectionId; work: WorkId }): Setup {
  if (s.mode === "landing") return { shot: "landing", mark: "monitor", pace: 1.2, producer: 0.42, strategist: 0.14 };
  if (s.mode === "tour") {
    if (s.ended) return { shot: "end", mark: "door", pace: 1.1, producer: 0.8, strategist: 0.8 };
    return CHAPTER_SETUP[s.chapter];
  }
  switch (s.section) {
    case "about":
      return { shot: "explore-about", mark: "monitor", pace: 1.4, producer: 1, strategist: 0.15 };
    case "work":
      return { shot: WORK_SHOT[s.work], mark: WORK_MARK[s.work], pace: 1.5, producer: 1, strategist: 0.15 };
    case "strategy":
      return { shot: "explore-strategy", mark: "strategist", pace: 1.8, producer: 0.25, strategist: 1 };
    case "contact":
      return { shot: "explore-contact", mark: "door", pace: 1.6, producer: 0.8, strategist: 0.8 };
  }
}

/** The route from where he is to a mark. */
export function routeTo(from: Vector3, to: MarkId) {
  const end = MARKS[to].pos;
  // only the waypoints that lie between here and there, nearest first
  const pts = (VIA[to] ?? [])
    .filter((p) => (p.x - from.x) * (end.x - p.x) > 0 && Math.abs(p.x - from.x) > 0.8)
    .sort((p, q) => Math.abs(p.x - from.x) - Math.abs(q.x - from.x));
  return [...pts, end];
}

/** What the set is doing. All 0–1 except pins (0–7), days (0–4) and steps (0–5). */
export type Env = {
  pins: number;
  days: number;
  fire: number;
  strings: number;
  shift: number;
  door: number;
  steps: number;
  /** Key art on the producer room's screen. */
  screen: "hero" | "aster" | "purple" | "live";
  /** Highlight on the film monitors rack (RANA · GLUTTONY). */
  rack: number;
};

const OFF: Env = { pins: 0, days: 0, fire: 0, strings: 0, shift: 0, door: 0, steps: 0, screen: "hero", rack: 0 };

export function envFor(s: { mode: Mode; chapter: ChapterId; ended: boolean; section: SectionId; work: WorkId }, t: number): Env {
  if (s.mode === "landing") return OFF;
  if (s.mode === "explore") {
    const base = { ...OFF, pins: 7, days: 4, steps: 5 };
    if (s.section === "work") {
      if (s.work === "aster") return { ...base, screen: "aster" };
      if (s.work === "purple") return { ...base, fire: 1, screen: "purple" };
      if (s.work === "live") return { ...base, strings: 1, screen: "live" };
      return { ...base, rack: 1 };
    }
    if (s.section === "strategy") return { ...base, shift: 1 };
    if (s.section === "contact") return { ...base, shift: 1, door: 1 };
    return base;
  }
  if (s.ended) return { ...OFF, pins: 7, days: 4, steps: 5, shift: 1, door: 1 };

  // the tour: what has happened so far stays (pins stay lit, the wall stays turned)
  const order: ChapterId[] = ["intro", "who", "job", "aster", "purple", "live", "shift", "strategist", "finance", "combination", "future"];
  const i = order.indexOf(s.chapter);
  const past = (c: ChapterId) => i > order.indexOf(c);
  const e: Env = { ...OFF };
  if (past("aster")) {
    e.pins = 7;
    e.days = 4;
  }
  if (past("shift")) e.shift = 1;
  if (past("finance")) e.steps = 5;
  switch (s.chapter) {
    case "job":
      e.rack = smoothstep(1, 3, t) * (1 - smoothstep(8, 10, t));
      break;
    case "aster":
      e.screen = "aster";
      e.pins = clamp((t - 2.6) / 0.42, 0, 7);
      e.days = clamp((t - 6.2) / 0.65, 0, 4);
      break;
    case "purple":
      e.screen = "purple";
      e.fire = smoothstep(1.4, 3.4, t) * (1 - smoothstep(12.6, 14, t));
      break;
    case "live":
      e.screen = "live";
      e.strings = smoothstep(0.2, 2.4, t);
      break;
    case "shift":
      e.strings = 1 - smoothstep(0, 1.6, t);
      e.shift = clamp(t / 7.2, 0, 1);
      break;
    case "finance":
      e.steps = clamp((t - 1) / 0.9, 0, 5);
      break;
    case "combination":
      e.pins = 7;
      e.days = 4;
      e.steps = 5;
      break;
    case "future":
      e.door = smoothstep(1.5, 5.5, t);
      break;
  }
  return e;
}
