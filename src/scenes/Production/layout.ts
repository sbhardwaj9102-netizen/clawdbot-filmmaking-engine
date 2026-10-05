import { aster } from "@/data/projects/aster";
import { purple } from "@/data/projects/purple";

import type { V2, V3, WorldLayout } from "../types";

/**
 * PRODUCTION — a command center. Eight stations line the walk from IDEA to PLAN
 * to EXECUTION: call sheets, schedules, budgets, locations (left); crew,
 * logistics, production design, execution (right).
 */
export const PROD_STATIONS: { id: string; side: -1 | 1; z: number }[] = [
  { id: "prod-callsheets", side: -1, z: -3.6 },
  { id: "prod-schedules", side: -1, z: -8.6 },
  { id: "prod-budgets", side: -1, z: -13.6 },
  { id: "prod-locations", side: -1, z: -18.4 },
  { id: "prod-crew", side: 1, z: -3.6 },
  { id: "prod-logistics", side: 1, z: -8.6 },
  { id: "prod-design", side: 1, z: -13.6 },
  { id: "prod-execution", side: 1, z: -18.4 },
];

const hotspots = Object.fromEntries(
  PROD_STATIONS.map((s) => [s.id, { object: [s.side * 3.5, 1.35, s.z] as V3, mark: [s.side * 1.7, s.z] as V2, size: [1.8, 1.6] as [number, number] }]),
);

const media = (list: { src: string }[]) => list.map((m) => m.src);

export const productionLayout: WorldLayout = {
  path: [
    { id: "entry", p: [0, 0] },
    { id: "idea", p: [0, -4.6] },
    { id: "plan", p: [0, -10.6] },
    { id: "execution", p: [0, -16.4] },
    { id: "end", p: [0, -21] },
  ],
  exits: {
    film: { p: [-5, -22], dir: [-1, 0], via: [[-1.8, -21.6]] },
    creativity: { p: [-5, -22], dir: [-1, 0], via: [[-1.8, -21.6]] },
    events: { p: [1.8, -24.2], dir: [0, -1], via: [[1.8, -21.8]] },
    execution: { p: [1.8, -24.2], dir: [0, -1], via: [[1.8, -21.8]] },
    finance: { p: [5, -22], dir: [1, 0], via: [[1.8, -21.6]] },
    economics: { p: [5, -22], dir: [1, 0], via: [[1.8, -21.6]] },
    career: { p: [-1.8, -24.2], dir: [0, -1], via: [[-1.8, -21.8]] },
    onward: { p: [-1.8, -24.2], dir: [0, -1], via: [[-1.8, -21.8]] },
    default: { p: [1.8, -24.2], dir: [0, -1], via: [[1.8, -21.8]] },
  },
  hotspots,
  anchors: {
    creativity: [-4.6, 1.9, -22.4],
    execution: [1.9, 1.9, -25],
    economics: [4.6, 1.9, -22.4],
    onward: [-1.9, 1.9, -25],
    center: [0, 1.4, -24],
  },
  shots: {
    question: { pos: [0, 3.6, -14.8], target: [0, 1.3, -23.4], fov: 52 },
  },
  palette: {
    fog: "#06080c",
    fogDensity: 0.03,
    sky: "#1e2a3d",
    ground: "#07080a",
    ambient: 0.45,
    floor: "#1c1f24",
    floorRoughness: 0.3,
    accent: "#e2a25e",
    exposure: 1.05,
    bloom: 0.75,
  },
  key: { dir: [0.2, -0.9, -0.3], color: "#9fb8e8", intensity: 0.45 },
  lights: [
    { kind: "spot", pos: [-1.4, 6.5, -5], target: [-3.5, 1, -6], color: "#ffd8b0", intensity: 42, angle: 0.55, penumbra: 0.85 },
    { kind: "spot", pos: [1.4, 6.5, -5], target: [3.5, 1, -6], color: "#ffd8b0", intensity: 42, angle: 0.55, penumbra: 0.85 },
    { kind: "spot", pos: [-1.4, 6.5, -15], target: [-3.5, 1, -16], color: "#ffe6c8", intensity: 42, angle: 0.55, penumbra: 0.85 },
    { kind: "spot", pos: [1.4, 6.5, -15], target: [3.5, 1, -16], color: "#ffe6c8", intensity: 42, angle: 0.55, penumbra: 0.85 },
    { kind: "point", pos: [0, 1.6, -10.6], color: "#8fb5ff", intensity: 8, distance: 8 },
    { kind: "point", pos: [0, 4, -22], color: "#ffcf94", intensity: 8, distance: 10 },
  ],
  textures: [
    ...media(aster.sections.find((s) => s.kind === "crew")!.media),
    ...media(aster.sections.find((s) => s.kind === "schedule")!.media),
    ...media(aster.sections.find((s) => s.kind === "locations")!.media),
    aster.sections.find((s) => s.kind === "bts")!.media[0].src,
    ...media(purple.sections.find((s) => s.kind === "sets")!.media),
    ...media(purple.sections.find((s) => s.kind === "fire")!.media),
  ],
};
