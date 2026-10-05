import { profile } from "@/data/profile";

import type { WorldLayout } from "../types";

/**
 * ABOUT — a quiet room. One desk, one chair, one large screen. The avatar
 * stops in front of the screen; the file on the desk is the resume.
 */
export const aboutLayout: WorldLayout = {
  path: [
    { id: "entry", p: [0, 0] },
    { id: "screen", p: [0, -5.2] },
    { id: "desk", p: [0, -8.6] },
  ],
  exits: {
    final: { p: [-6.2, -9.4], dir: [-1, 0], via: [[-2.4, -9.0]] },
    default: { p: [-6.2, -9.4], dir: [-1, 0], via: [[-2.4, -9.0]] },
  },
  hotspots: {
    "about-screen": { object: [0, 3.0, -13.3], mark: [0, -9.4], size: [7.4, 4.2], shot: { pos: [0.4, 2.2, -6.2], target: [0, 2.9, -13.3], fov: 46 } },
    "about-resume": { object: [2.5, 0.8, -9.0], mark: [1.4, -8.7], size: [0.9, 0.6], shot: { pos: [0.6, 1.9, -7.3], target: [2.5, 0.8, -9.0], fov: 34 } },
  },
  anchors: {
    make: [-2.9, 1.45, -11.2],
    scale: [0, 1.45, -11.6],
    build: [2.9, 1.45, -11.2],
    center: [0, 2.6, -13.3],
  },
  shots: {
    question: { pos: [0.3, 2.3, -4.6], target: [0, 2.2, -12.4], fov: 50 },
  },
  palette: {
    fog: "#0a0a0b",
    fogDensity: 0.025,
    sky: "#2a2a30",
    ground: "#0a0908",
    ambient: 0.4,
    floor: "#2b2a29",
    floorRoughness: 0.4,
    accent: "#ece6da",
    exposure: 1.0,
    bloom: 0.6,
  },
  key: { dir: [0.2, -0.95, -0.2], color: "#e8e2d6", intensity: 0.4 },
  lights: [
    { kind: "spot", pos: [2.4, 5.6, -8.4], target: [2.5, 0.75, -9.0], color: "#ffe3c0", intensity: 34, angle: 0.4, penumbra: 0.85 },
    { kind: "spot", pos: [0, 6, -2], target: [0, 0, -7], color: "#e8e2d6", intensity: 16, angle: 0.6, penumbra: 0.9 },
    { kind: "point", pos: [0, 2.6, -11.5], color: "#cfd8ff", intensity: 10, distance: 8 },
  ],
  textures: [profile.portrait.src],
};
