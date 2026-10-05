import { ambition } from "@/data/worlds/business";

import type { V2, V3, WorldLayout } from "../types";

/**
 * BUILD IT — an open dark plain with a ring of eight monoliths (the parts of a
 * production business) around a core. Four of them hold real work.
 */
export const RING_CENTER: V2 = [0, -16];
export const RING_RADIUS = 9;

export const NODES = ambition.nodes.map((name, i) => {
  // start a little off-axis so the walk passes between two monoliths
  const a = Math.PI / 8 + (i * Math.PI) / 4;
  const x = RING_CENTER[0] + Math.sin(a) * RING_RADIUS;
  const z = RING_CENTER[1] + Math.cos(a) * RING_RADIUS;
  return { name, a, x, z };
});

const NODE_HOTSPOT: Record<string, string> = {
  "Production infrastructure": "biz-infrastructure",
  Teams: "biz-teams",
  Content: "biz-content",
  Strategy: "biz-strategy",
};

const hotspots: WorldLayout["hotspots"] = {
  "biz-core": { object: [RING_CENTER[0], 1.6, RING_CENTER[1]], mark: [0, -13.4], size: [2.4, 3] },
};
for (const n of NODES) {
  const id = NODE_HOTSPOT[n.name];
  if (!id) continue;
  const toward = [RING_CENTER[0] - n.x, RING_CENTER[1] - n.z];
  const l = Math.hypot(toward[0], toward[1]);
  hotspots[id] = {
    object: [n.x, 2.0, n.z] as V3,
    mark: [n.x + (toward[0] / l) * 2.2, n.z + (toward[1] / l) * 2.2] as V2,
    size: [1.6, 4],
  };
}
export const nodeHotspot = (name: string) => NODE_HOTSPOT[name];

export const businessLayout: WorldLayout = {
  path: [
    { id: "entry", p: [0, 0] },
    { id: "approach", p: [0, -3.6] },
    { id: "ring", p: [0, -7.6] },
    { id: "core", p: [0, -12.6] },
  ],
  exits: {
    film: { p: [-11, -10.2], dir: [-1, 0], via: [[-2.6, -11.2]] },
    work: { p: [-11, -10.2], dir: [-1, 0], via: [[-2.6, -11.2]] },
    finance: { p: [11, -10.2], dir: [1, 0], via: [[2.6, -11.2]] },
    numbers: { p: [11, -10.2], dir: [1, 0], via: [[2.6, -11.2]] },
    career: { p: [0, -26.5], dir: [0, -1], via: [[-2.6, -14.4], [-2.6, -18.4], [0, -20.6]] },
    onward: { p: [0, -26.5], dir: [0, -1], via: [[-2.6, -14.4], [-2.6, -18.4], [0, -20.6]] },
    default: { p: [-11, -10.2], dir: [-1, 0], via: [[-2.6, -11.2]] },
  },
  hotspots,
  anchors: {
    work: [-4.8, 1.9, -10.6],
    numbers: [4.8, 1.9, -10.6],
    onward: [0, 2.6, -20.4],
    center: [0, 1.8, -16],
  },
  shots: {
    question: { pos: [0, 5.2, -3.2], target: [0, 1.4, -15.4], fov: 52 },
  },
  palette: {
    fog: "#04050a",
    fogDensity: 0.022,
    sky: "#141c33",
    ground: "#040406",
    ambient: 0.35,
    floor: "#121318",
    floorRoughness: 0.22,
    accent: "#ffe0a3",
    exposure: 1.05,
    bloom: 1.1,
  },
  key: { dir: [0.1, -0.9, -0.2], color: "#8ea6d8", intensity: 0.25 },
  lights: [
    { kind: "spot", pos: [0, 12, -16], target: [0, 0, -16], color: "#ffe0a3", intensity: 70, angle: 0.62, penumbra: 0.9 },
    { kind: "spot", pos: [0, 6, -2], target: [0, 0, -7], color: "#cfd8ff", intensity: 18, angle: 0.6, penumbra: 0.9 },
    { kind: "point", pos: [0, 2.2, -16], color: "#ffd38a", intensity: 26, distance: 14 },
    { kind: "point", pos: [-7, 3, -10], color: "#8fb5ff", intensity: 8, distance: 10 },
    { kind: "point", pos: [7, 3, -22], color: "#8fb5ff", intensity: 8, distance: 10 },
  ],
  textures: [],
};
