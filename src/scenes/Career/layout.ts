import { career, type CareerMood } from "@/data/career/chapters";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { clamp } from "@/systems/SceneManager/space";

import type { LightSpec, Palette, V2, V3, WorldLayout } from "../types";

/**
 * THE PATH — the career as a walk through rooms. Each chapter is a 9 m chamber
 * with its own light and set dressing; the palette shifts as you cross each gate.
 */
export const CHAMBER = 9;
export const chamberZ = (i: number) => -(6 + i * CHAMBER);
export const chamberSide = (i: number) => (i % 2 === 0 ? -1 : 1) as -1 | 1;
const END = -(3 + career.length * CHAMBER) - 2;

export const MOOD: Record<CareerMood, { fog: string; light: string; accent: string; floor: string }> = {
  journalism: { fog: "#0c0d10", light: "#e8ecf4", accent: "#e8ecf4", floor: "#25272b" },
  film: { fog: "#100a05", light: "#ffc58a", accent: "#e2a25e", floor: "#2a2219" },
  production: { fog: "#0d0906", light: "#ffd9b0", accent: "#ffcf94", floor: "#28221d" },
  global: { fog: "#050914", light: "#9cc3ff", accent: "#b8955a", floor: "#141a26" },
  finance: { fog: "#04080f", light: "#8fb5ff", accent: "#8fb5ff", floor: "#121822" },
  now: { fog: "#0a0806", light: "#ffe6c4", accent: "#ece6da", floor: "#262321" },
};

const n = career.length;
const pathPts: { id: string; p: V2 }[] = [{ id: "entry", p: [0, 0] }, ...career.map((_, i) => ({ id: `c${i}`, p: [0, -(3 + i * CHAMBER)] as V2 })), { id: "end", p: [0, END] }];
function chamberAt(u: number) {
  const z = u * END;
  return clamp((-z - 3) / CHAMBER, 0, n - 1);
}

function hexMix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

function paletteAt(u: number): Palette {
  const c = chamberAt(u);
  const i = Math.floor(c);
  const j = Math.min(n - 1, i + 1);
  const t = clamp((c - i - 0.55) / 0.45, 0, 1);
  const a = MOOD[career[i].mood];
  const b = MOOD[career[j].mood];
  return {
    fog: hexMix(a.fog, b.fog, t),
    fogDensity: 0.03,
    sky: hexMix(a.light, b.light, t),
    ground: "#060606",
    ambient: 0.32,
    floor: hexMix(a.floor, b.floor, t),
    floorRoughness: 0.3,
    accent: t > 0.5 ? b.accent : a.accent,
    exposure: 1.05,
    bloom: 0.85,
  };
}

function lightsAt(u: number): LightSpec[] {
  const c = Math.round(chamberAt(u));
  const out: LightSpec[] = [];
  for (const k of [c - 1, c, c + 1]) {
    if (k < 0 || k >= n) continue;
    const z = chamberZ(k);
    const side = chamberSide(k);
    const m = MOOD[career[k].mood];
    out.push({ kind: "spot", pos: [side * 1.2, 6.5, z + 1], target: [side * 3.6, 1.2, z], color: m.light, intensity: k === c ? 46 : 18, angle: 0.5, penumbra: 0.85 });
    out.push({ kind: "point", pos: [-side * 3, 3.4, z], color: m.light, intensity: k === c ? 10 : 4, distance: 9 });
  }
  return out;
}

const hotspots: WorldLayout["hotspots"] = Object.fromEntries(
  career.map((c, i) => [
    `career-${c.id}`,
    { object: [chamberSide(i) * 3.7, 1.55, chamberZ(i)] as V3, mark: [chamberSide(i) * 1.7, chamberZ(i)] as V2, size: [1.8, 2] as [number, number] },
  ]),
);

export const careerLayout: WorldLayout = {
  path: pathPts,
  exits: {
    about: { p: [0, END - 2], dir: [0, -1] },
    default: { p: [0, END - 2], dir: [0, -1] },
  },
  hotspots,
  palette: paletteAt(0),
  paletteAt,
  key: { dir: [0, -1, -0.2], color: "#bcc8e0", intensity: 0.2 },
  lights: lightsAt(0),
  lightsAt,
  follow: { distance: 4.8, side: 0.9 },
  textures: [profile.reel.src, ...projects.map((p) => p.cover.src)],
};
