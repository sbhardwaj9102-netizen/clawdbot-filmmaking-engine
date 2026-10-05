import type { WorldLayout } from "../types";

/**
 * FINANCE IT — a glass room at night with the city around it. A long table of
 * budget documents and research on the right; analysis screens on the left.
 */
export const financeLayout: WorldLayout = {
  path: [
    { id: "entry", p: [0, 0] },
    { id: "glass", p: [0, -5.5] },
    { id: "table", p: [0, -10.5] },
    { id: "screens", p: [0, -15.5] },
    { id: "end", p: [0, -19] },
  ],
  exits: {
    film: { p: [-5.5, -19.6], dir: [-1, 0], via: [[-1.8, -19.4]] },
    make: { p: [-5.5, -19.6], dir: [-1, 0], via: [[-1.8, -19.4]] },
    business: { p: [5.5, -19.6], dir: [1, 0], via: [[1.8, -19.4]] },
    build: { p: [5.5, -19.6], dir: [1, 0], via: [[1.8, -19.4]] },
    career: { p: [0, -22.4], dir: [0, -1] },
    onward: { p: [0, -22.4], dir: [0, -1] },
    default: { p: [5.5, -19.6], dir: [1, 0], via: [[1.8, -19.4]] },
  },
  hotspots: {
    "fin-budget": { object: [2.75, 0.84, -9.3], mark: [1.25, -9.3], size: [0.9, 0.5], shot: { pos: [0.4, 2.0, -8.0], target: [2.75, 0.84, -9.3], fov: 34 } },
    "fin-research": { object: [2.75, 0.84, -12.2], mark: [1.25, -12.2], size: [0.9, 0.5], shot: { pos: [0.4, 2.0, -10.9], target: [2.75, 0.84, -12.2], fov: 34 } },
    "fin-model": { object: [-4.3, 2.0, -11], mark: [-1.8, -11], size: [3.2, 1.8] },
    "fin-tools": { object: [-4.3, 1.7, -16.4], mark: [-1.8, -16.4], size: [2.2, 1.4] },
  },
  anchors: {
    make: [-3.8, 1.9, -21.2],
    build: [3.8, 1.9, -21.2],
    onward: [0, 1.9, -23],
    center: [0, 1.5, -22],
  },
  shots: {
    question: { pos: [0, 3.2, -12.4], target: [0, 1.4, -21.8], fov: 54 },
  },
  palette: {
    fog: "#060a12",
    fogDensity: 0.018,
    sky: "#24324d",
    ground: "#06080c",
    ambient: 0.5,
    floor: "#151a22",
    floorRoughness: 0.18,
    accent: "#8fb5ff",
    exposure: 1.08,
    bloom: 0.9,
  },
  key: { dir: [-0.4, -0.6, -0.6], color: "#8ea6d8", intensity: 0.5 },
  lights: [
    { kind: "spot", pos: [2.6, 6, -10.8], target: [2.75, 0.8, -10.8], color: "#ffe2c0", intensity: 55, angle: 0.5, penumbra: 0.85 },
    { kind: "spot", pos: [-1, 6, -12], target: [-4.3, 1.8, -12.5], color: "#cfe0ff", intensity: 30, angle: 0.55, penumbra: 0.85 },
    { kind: "spot", pos: [0, 6.5, -2], target: [0, 0, -4], color: "#bcd0ff", intensity: 24, angle: 0.6, penumbra: 0.9 },
    { kind: "point", pos: [-3.5, 2, -11], color: "#7fb2e5", intensity: 10, distance: 7 },
    { kind: "point", pos: [0, 3, -21], color: "#9fc0ff", intensity: 8, distance: 9 },
    { kind: "point", pos: [2.75, 1.4, -11], color: "#ffcf94", intensity: 3, distance: 4 },
  ],
  textures: [],
};
