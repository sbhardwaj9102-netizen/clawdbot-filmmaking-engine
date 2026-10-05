import { projects } from "@/data/projects";
import { profile } from "@/data/profile";

import type { WorldLayout } from "../types";

/** Video village monitors, one per project, in a shallow arc. */
export const MONITOR_X = [-3.3, -1.1, 1.1, 3.3];
export const MONITOR_Z = -21.3;

const monitorHotspots = Object.fromEntries(
  projects.slice(0, 4).map((p, i) => [
    `monitor-${p.scene}`,
    {
      object: [MONITOR_X[i], 1.47, MONITOR_Z + Math.abs(MONITOR_X[i]) * 0.08] as [number, number, number],
      mark: [MONITOR_X[i] * 0.78, -19.6] as [number, number],
      size: [1.6, 1.0] as [number, number],
    },
  ]),
);

/**
 * MAKE IT — a working soundstage: camera on a dolly lining up on a lit set,
 * a stills wall, an edit bay, and video village where each film plays on a monitor.
 */
export const filmLayout: WorldLayout = {
  path: [
    { id: "entry", p: [0, 0] },
    { id: "dolly", p: [0, -6.5] },
    { id: "boards", p: [0.3, -13] },
    { id: "village", p: [0, -18.6] },
  ],
  exits: {
    production: { p: [7, -18.4], dir: [1, 0], via: [[3, -18.4]] },
    made: { p: [7, -18.4], dir: [1, 0], via: [[3, -18.4]] },
    career: { p: [-7, -16.4], dir: [-1, 0], via: [[-2.6, -16.8]] },
    onward: { p: [-7, -16.4], dir: [-1, 0], via: [[-2.6, -16.8]] },
    default: { p: [7, -18.4], dir: [1, 0], via: [[3, -18.4]] },
  },
  hotspots: {
    "reel-camera": { object: [-3.3, 1.3, -6.2], mark: [-1.7, -6.2], size: [1.0, 1.0] },
    "stills-board": { object: [3.75, 1.7, -13], mark: [2.0, -13], size: [2.8, 1.7] },
    "edit-bay": { object: [-3.9, 1.1, -14.2], mark: [-2.1, -14.2], size: [1.8, 1.0] },
    ...monitorHotspots,
  },
  anchors: {
    story: [-4.7, 1.9, -18.4],
    made: [4.7, 1.9, -18.4],
    onward: [-6.8, 1.9, -15.6],
    center: [0, 1.4, -21],
  },
  shots: {
    question: { pos: [0, 3.7, -10.6], target: [0, 1.3, -19.6], fov: 54 },
  },
  palette: {
    fog: "#0b0806",
    fogDensity: 0.03,
    sky: "#2c241a",
    ground: "#0b0806",
    ambient: 0.35,
    floor: "#2c2723",
    floorRoughness: 0.36,
    accent: "#e2a25e",
    exposure: 1.05,
    bloom: 0.8,
  },
  key: { dir: [-0.3, -0.8, -0.4], color: "#ffcf9a", intensity: 0.35 },
  lights: [
    { kind: "spot", pos: [2.8, 2.6, -3.0], target: [6.4, 1.0, -6.6], color: "#ffd0a0", intensity: 45, angle: 0.55, penumbra: 0.7 },
    { kind: "spot", pos: [0, 7.5, -20.2], target: [0, 0, -20.2], color: "#ffd8b0", intensity: 50, angle: 0.5, penumbra: 0.85 },
    { kind: "spot", pos: [0.4, 6.5, -11.5], target: [3.75, 1.7, -13], color: "#fff0dc", intensity: 32, angle: 0.36, penumbra: 0.8 },
    { kind: "spot", pos: [-1.2, 6.2, -6.0], target: [-3.3, 0.8, -6.2], color: "#ffcf9a", intensity: 26, angle: 0.4, penumbra: 0.8 },
    { kind: "point", pos: [7.6, 2.0, -6.6], color: "#9fb8ff", intensity: 9, distance: 7 },
    { kind: "point", pos: [0, 3.2, -24.2], color: "#a9c7ff", intensity: 10, distance: 10 },
    { kind: "point", pos: [-3.8, 1.7, -14.0], color: "#ffcf94", intensity: 4, distance: 4 },
  ],
  textures: [
    ...projects.map((p) => p.cover.src),
    profile.reel.src,
    ...projects[0].sections.find((s) => s.kind === "stills")!.media.slice(0, 4).map((m) => m.src),
  ],
};
