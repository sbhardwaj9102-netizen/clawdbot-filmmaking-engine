import type { WorldLayout } from "../types";

/**
 * THE STUDIO — a huge dark soundstage. The visitor enters through the door
 * behind the avatar (z = 16); a production table with the script waits ahead.
 * The three exits fan out from the table: MAKE IT left, FINANCE IT ahead,
 * BUILD IT right.
 */
export const studioLayout: WorldLayout = {
  path: [
    { id: "start", p: [0, 7] },
    { id: "mid", p: [0, 2.2] },
    { id: "table", p: [0, -2.9] },
  ],
  exits: {
    make: { p: [-4, -3.0], dir: [-1, 0] },
    finance: { p: [2.4, -5.8], dir: [0, -1], via: [[2.4, -3.0]] },
    build: { p: [4, -3.0], dir: [1, 0] },
    default: { p: [2.4, -5.8], dir: [0, -1], via: [[2.4, -3.0]] },
  },
  hotspots: {
    script: {
      object: [0, 0.95, -3.75],
      mark: [0, -2.9],
      size: [0.6, 0.35],
      shot: { pos: [1.0, 1.72, -2.55], target: [-0.12, 0.92, -3.85], fov: 32 },
    },
  },
  anchors: {
    make: [-1.1, 1.5, -4.35],
    finance: [0, 1.5, -4.45],
    build: [1.1, 1.5, -4.35],
    center: [0, 1.0, -4.4],
  },
  shots: {
    script: { pos: [1.05, 1.74, -2.5], target: [-0.15, 0.95, -3.9], fov: 33 },
    question: { pos: [1.3, 3.3, 0.4], target: [0, 0.9, -4.3], fov: 40 },
  },
  choicePillars: false,
  palette: {
    fog: "#07080b",
    fogDensity: 0.032,
    sky: "#1c2436",
    ground: "#0a0806",
    ambient: 0.4,
    floor: "#2a2a2d",
    floorRoughness: 0.34,
    accent: "#e2a25e",
    exposure: 1.0,
    bloom: 0.7,
  },
  key: { dir: [0.35, -0.75, -0.4], color: "#7088c0", intensity: 0.55 },
  lights: [
    { kind: "spot", pos: [0, 7.6, -4.1], target: [0, 0.9, -4.2], color: "#ffd2a0", intensity: 70, angle: 0.36, penumbra: 0.75 },
    { kind: "spot", pos: [0, 6.2, 15], target: [0, 0, 5], color: "#ffe2c4", intensity: 45, angle: 0.55, penumbra: 0.9 },
    { kind: "spot", pos: [-8, 9, 3], target: [-6.5, 0, 0], color: "#ffcf9a", intensity: 40, angle: 0.4, penumbra: 0.8 },
    { kind: "spot", pos: [10, 9, -9], target: [12.5, 1.5, -15.5], color: "#8fb0ff", intensity: 40, angle: 0.5, penumbra: 0.9 },
    { kind: "point", pos: [-10, 3.4, -13], color: "#ffbf7a", intensity: 6, distance: 9 },
    { kind: "point", pos: [9, 2.5, 7], color: "#9fb4e8", intensity: 4, distance: 10 },
    { kind: "point", pos: [0, 2.2, -4.6], color: "#ffcf94", intensity: 2.5, distance: 4 },
  ],
  textures: [],
  intro: [
    { t: 0, pos: [0, 1.7, 27], target: [0, 2.4, 16], fov: 32 },
    { t: 3.0, pos: [0, 1.75, 22.5], target: [0, 2.1, 12], fov: 34 },
    { t: 5.6, pos: [0.3, 2.0, 15.2], target: [0, 1.8, 3], fov: 40 },
    { t: 8.4, pos: [-5.8, 6.4, 10.6], target: [0, 1.0, -1], fov: 44 },
    { t: 11.6, pos: [0.7, 1.95, 11.6], target: [0, 1.25, 4.6], fov: 40 },
  ],
};
