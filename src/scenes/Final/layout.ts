import { finale } from "@/data/story/questions";
import { smoothstep } from "@/systems/SceneManager/space";
import { getStory } from "@/systems/StoryEngine/store";

import type { Palette, WorldLayout } from "../types";

/**
 * FINAL — a long dark hall ending in a huge door. The door opens onto light
 * (its colour set by the visitor's last answer); the avatar walks out into it.
 */
export const DOOR_Z = -14.5;

export function finaleVariant() {
  const id = getStory().choices[finale.questionId];
  return (id && finale.variants[id]) || finale.fallback;
}

const base: Palette = {
  fog: "#070605",
  fogDensity: 0.03,
  sky: "#2a241e",
  ground: "#060504",
  ambient: 0.35,
  floor: "#262422",
  floorRoughness: 0.25,
  accent: "#ffd7a1",
  exposure: 1.0,
  bloom: 0.9,
};

function paletteAt(u: number): Palette {
  const t = smoothstep(0.6, 1, u);
  const sky = finaleVariant().sky;
  const mix = (a: string, b: string, k: number) => {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
    return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
  };
  return {
    ...base,
    fog: mix(base.fog, sky, t * 0.85),
    fogDensity: base.fogDensity + t * 0.03,
    ambient: base.ambient + t * 1.2,
    sky: mix(base.sky, sky, t),
    accent: sky,
    exposure: 1 + t * 0.6,
  };
}

export const finalLayout: WorldLayout = {
  path: [
    { id: "entry", p: [0, 0] },
    { id: "hall", p: [0, -6] },
    { id: "door", p: [0, -11.6] },
    { id: "outside", p: [0, -19.5] },
  ],
  exits: { default: { p: [0, -22], dir: [0, -1] } },
  hotspots: {},
  shots: {
    door: { pos: [1.3, 1.3, -4.2], target: [0, 3.6, -16], fov: 46 },
  },
  palette: base,
  paletteAt,
  key: { dir: [0, -0.3, 1], color: "#ffe6c4", intensity: 0.6 },
  lights: [
    { kind: "spot", pos: [0, 7, DOOR_Z - 4], target: [0, 0, -6], color: "#fff0dc", intensity: 60, angle: 0.6, penumbra: 0.9 },
    { kind: "point", pos: [0, 3, -3], color: "#ffcf94", intensity: 5, distance: 8 },
  ],
  follow: { distance: 5.2, height: 1.7, side: 0.5, lookAhead: 4 },
  textures: [],
};
