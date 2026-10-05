/**
 * QUALITY TIERS
 * Picks how much the GPU is asked to do. Mobile and low-power devices get
 * simpler geometry, fewer particles, no reflections and no post-processing —
 * the story, avatar and choices stay identical.
 */
export type Tier = "low" | "medium" | "high";

export type QualitySettings = {
  tier: Tier;
  dpr: [number, number];
  shadows: boolean;
  reflector: boolean;
  post: boolean;
  particles: number;
  crowd: number;
  city: number;
  detail: 0 | 1 | 2;
  spots: number;
  points: number;
};

export const QUALITY: Record<Tier, QualitySettings> = {
  low: { tier: "low", dpr: [1, 1.5], shadows: false, reflector: false, post: false, particles: 220, crowd: 36, city: 70, detail: 0, spots: 4, points: 4 },
  medium: { tier: "medium", dpr: [1, 1.6], shadows: false, reflector: false, post: true, particles: 520, crowd: 80, city: 150, detail: 1, spots: 4, points: 4 },
  high: { tier: "high", dpr: [1, 2], shadows: true, reflector: true, post: true, particles: 900, crowd: 130, city: 230, detail: 2, spots: 4, points: 4 },
};

export function detectTier(): Tier {
  if (typeof window === "undefined") return "medium";
  const forced = new URLSearchParams(window.location.search).get("quality");
  if (forced === "low" || forced === "medium" || forced === "high") return forced;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  if (coarse || small || cores <= 2 || memory <= 2) return "low";
  if (cores <= 4 || memory <= 4) return "medium";
  return "high";
}

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export const isTouch = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
