import { events } from "@/data/worlds/events";
import { smoothstep } from "@/systems/SceneManager/space";

import type { LightSpec, Palette, WorldLayout } from "../types";

/**
 * EVENTS — a venue that transforms as you walk through it:
 * empty (work lights) → setup (truss, tables, crew) → live (warm, full, the wall lit).
 * Path is evenly spaced so the phases sit at u = 0.25 / 0.5 / 0.75.
 */
export const setupK = (u: number) => smoothstep(0.28, 0.55, u);
export const liveK = (u: number) => smoothstep(0.6, 0.82, u);

const cold: Palette = {
  fog: "#0b0c10",
  fogDensity: 0.03,
  sky: "#2a3140",
  ground: "#0a0a0c",
  ambient: 0.85,
  floor: "#2a2b2f",
  floorRoughness: 0.32,
  accent: "#dfe8ff",
  exposure: 1.05,
  bloom: 0.6,
};
const warm: Palette = {
  fog: "#140a05",
  fogDensity: 0.028,
  sky: "#5a3a22",
  ground: "#120804",
  ambient: 0.45,
  floor: "#2a1d14",
  floorRoughness: 0.28,
  accent: "#ffbf7a",
  exposure: 1.1,
  bloom: 1,
};

function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

function paletteAt(u: number): Palette {
  const t = liveK(u);
  return {
    fog: mix(cold.fog, warm.fog, t),
    fogDensity: cold.fogDensity + (warm.fogDensity - cold.fogDensity) * t,
    sky: mix(cold.sky, warm.sky, t),
    ground: mix(cold.ground, warm.ground, t),
    ambient: cold.ambient + (warm.ambient - cold.ambient) * t,
    floor: mix(cold.floor, warm.floor, t),
    floorRoughness: 0.3,
    accent: t > 0.5 ? warm.accent : cold.accent,
    exposure: cold.exposure + (warm.exposure - cold.exposure) * t,
    bloom: cold.bloom + (warm.bloom - cold.bloom) * t,
  };
}

function lightsAt(u: number): LightSpec[] {
  const s = setupK(u);
  const l = liveK(u);
  return [
    { kind: "spot", pos: [0, 9, -18], target: [0, 1.2, -26.5], color: "#ffcf9a", intensity: 15 + 70 * l, angle: 0.55, penumbra: 0.8 },
    { kind: "spot", pos: [-6, 8, -6], target: [-6, 0, -10], color: "#e6eeff", intensity: 45 * (1 - l), angle: 0.8, penumbra: 0.6 },
    { kind: "spot", pos: [6, 8, -14], target: [6, 0, -16], color: "#e6eeff", intensity: 45 * (1 - l), angle: 0.8, penumbra: 0.6 },
    { kind: "spot", pos: [-5, 7, -24], target: [2, 2, -27], color: "#ff9d5c", intensity: 50 * l, angle: 0.35, penumbra: 0.6 },
    { kind: "point", pos: [0, 3, -28], color: "#ffb36b", intensity: 4 + 30 * l, distance: 14 },
    { kind: "point", pos: [-6, 4.5, -14], color: "#ffcf8a", intensity: 14 * l, distance: 12 },
    { kind: "point", pos: [6, 4.5, -10], color: "#ffcf8a", intensity: 14 * l, distance: 12 },
    { kind: "point", pos: [0, 2, -6], color: "#dfe8ff", intensity: 6 * (1 - s * 0.5), distance: 9 },
  ];
}

export const eventsLayout: WorldLayout = {
  path: [
    { id: "entry", p: [0, 0] },
    { id: "empty", p: [0, -5] },
    { id: "setup", p: [0, -10] },
    { id: "live", p: [0, -15] },
    { id: "stage", p: [0, -20] },
  ],
  exits: {
    finance: { p: [-7, -19.2], dir: [-1, 0], via: [[-2, -19.6]] },
    money: { p: [-7, -19.2], dir: [-1, 0], via: [[-2, -19.6]] },
    production: { p: [7, -19.2], dir: [1, 0], via: [[2, -19.6]] },
    plan: { p: [7, -19.2], dir: [1, 0], via: [[2, -19.6]] },
    career: { p: [-7, -22.6], dir: [-1, 0], via: [[-1.6, -21.2]] },
    onward: { p: [-7, -22.6], dir: [-1, 0], via: [[-1.6, -21.2]] },
    default: { p: [-7, -19.2], dir: [-1, 0], via: [[-2, -19.6]] },
  },
  hotspots: {
    "evt-house": { object: [-3.2, 1.4, -2.4], mark: [-1.5, -2.4], size: [1.4, 1.6] },
    "evt-vendors": { object: [-4.6, 1.0, -7], mark: [-1.9, -7], size: [2, 1.4] },
    "evt-setup": { object: [4.6, 1.0, -9], mark: [1.9, -9], size: [2.4, 1.2] },
    "evt-deadlines": { object: [-4.6, 1.6, -12.8], mark: [-1.9, -12.8], size: [1.8, 1.6] },
    "evt-manpower": { object: [4.6, 1.2, -14], mark: [1.9, -14], size: [2, 1.6] },
    "evt-live": { object: [0, 2.9, -28.6], mark: [0, -21.4], size: [8, 4.2], shot: { pos: [0.6, 2.6, -17.5], target: [0, 2.6, -28.6], fov: 42 } },
  },
  anchors: {
    money: [-5, 1.9, -20.4],
    plan: [5, 1.9, -20.4],
    onward: [-3.2, 1.9, -23.2],
    center: [0, 2, -27],
  },
  shots: {
    question: { pos: [0, 3.8, -12.5], target: [0, 1.8, -23.5], fov: 54 },
  },
  palette: cold,
  paletteAt,
  key: { dir: [0.3, -0.85, -0.3], color: "#cfd8ff", intensity: 0.3 },
  lights: lightsAt(0),
  lightsAt,
  textures: [
    ...events.pillars.flatMap((p) => p.media.map((m) => m.src)),
    ...events.venue.map((m) => m.src),
    ...events.gallery.map((m) => m.src),
  ],
};
