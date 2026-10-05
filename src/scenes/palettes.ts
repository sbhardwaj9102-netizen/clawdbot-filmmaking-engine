import { Color } from "three";

/**
 * PALETTES — the look of each room in each theme. Dark is a night studio:
 * black, charcoal and navy, lit by warm amber practicals (the producer) and
 * cool glass light (the strategist). Light is the same rooms by day: warm
 * paper-white walls, soft daylight, ink-dark furniture.
 *
 * The stage blends between them every frame: theme (0 dark → 1 light, eased
 * when the visitor switches) and room (0 producer → 1 strategist, from where
 * the camera is).
 */
export type Palette = {
  fog: string;
  fogDensity: number;
  sky: string;
  ground: string;
  ambient: number;
  floor: string;
  floorRoughness: number;
  exposure: number;
  bloom: number;
  key: string;
  keyIntensity: number;
  /** Multiplier for the rig's spot and point lights. */
  practical: number;
  /** Haze and light shafts. */
  haze: number;
  accent: string;
};

export const PALETTES: Record<"dark" | "light", Record<"producer" | "strategist", Palette>> = {
  dark: {
    producer: {
      fog: "#09090b",
      fogDensity: 0.024,
      sky: "#2c3140",
      ground: "#0e0d0c",
      ambient: 0.7,
      floor: "#2c2a26",
      floorRoughness: 0.5,
      exposure: 1.18,
      bloom: 0.85,
      key: "#9fb3d9",
      keyIntensity: 0.9,
      practical: 1,
      haze: 1,
      accent: "#e2a25e",
    },
    strategist: {
      fog: "#080b11",
      fogDensity: 0.02,
      sky: "#34435c",
      ground: "#0b0d11",
      ambient: 0.75,
      floor: "#23262c",
      floorRoughness: 0.32,
      exposure: 1.15,
      bloom: 0.85,
      key: "#b8c8ea",
      keyIntensity: 1,
      practical: 1,
      haze: 0.8,
      accent: "#8fb8ff",
    },
  },
  light: {
    producer: {
      fog: "#e9e3d7",
      fogDensity: 0.013,
      sky: "#fff7ea",
      ground: "#b3aa9b",
      ambient: 2.3,
      floor: "#c6bfb2",
      floorRoughness: 0.7,
      exposure: 0.92,
      bloom: 0.22,
      key: "#fff0d8",
      keyIntensity: 2.6,
      practical: 0.55,
      haze: 0.25,
      accent: "#a85f1a",
    },
    strategist: {
      fog: "#e6eaef",
      fogDensity: 0.011,
      sky: "#f5f8ff",
      ground: "#a9afb6",
      ambient: 2.4,
      floor: "#cdcfd1",
      floorRoughness: 0.42,
      exposure: 0.92,
      bloom: 0.22,
      key: "#ffffff",
      keyIntensity: 2.8,
      practical: 0.55,
      haze: 0.2,
      accent: "#2f5f9e",
    },
  },
};

/** A palette as live values, blended each frame. */
export type LivePalette = {
  fog: Color;
  fogDensity: number;
  sky: Color;
  ground: Color;
  ambient: number;
  floor: Color;
  floorRoughness: number;
  exposure: number;
  bloom: number;
  key: Color;
  keyIntensity: number;
  practical: number;
  haze: number;
  accent: Color;
};

export const livePalette = (): LivePalette => ({
  fog: new Color(),
  fogDensity: 0.02,
  sky: new Color(),
  ground: new Color(),
  ambient: 1,
  floor: new Color(),
  floorRoughness: 0.5,
  exposure: 1,
  bloom: 0.8,
  key: new Color(),
  keyIntensity: 1,
  practical: 1,
  haze: 1,
  accent: new Color(),
});

const c1 = new Color();
const c2 = new Color();
const COLOR_KEYS = ["fog", "sky", "ground", "floor", "key", "accent"] as const;
const NUM_KEYS = ["fogDensity", "ambient", "floorRoughness", "exposure", "bloom", "keyIntensity", "practical", "haze"] as const;

/** Bilinear blend: theme (0 dark → 1 light) × room (0 producer → 1 strategist). */
export function blendPalette(out: LivePalette, theme: number, room: number) {
  const dp = PALETTES.dark.producer;
  const ds = PALETTES.dark.strategist;
  const lp = PALETTES.light.producer;
  const ls = PALETTES.light.strategist;
  for (const k of COLOR_KEYS) {
    c1.set(dp[k]).lerp(c2.set(ds[k]), room);
    const dark = c1.clone();
    c1.set(lp[k]).lerp(c2.set(ls[k]), room);
    out[k].copy(dark).lerp(c1, theme);
  }
  for (const k of NUM_KEYS) {
    const d = dp[k] + (ds[k] - dp[k]) * room;
    const l = lp[k] + (ls[k] - lp[k]) * room;
    out[k] = d + (l - d) * theme;
  }
  return out;
}
