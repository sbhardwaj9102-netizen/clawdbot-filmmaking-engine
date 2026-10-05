"use client";

import {
  AdditiveBlending,
  Color,
  DoubleSide,
  type Material,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Texture,
} from "three";

/**
 * Shared materials. Worlds reuse these instead of creating their own so a scene
 * swap never compiles new shaders mid-journey. Never dispose them.
 *
 * Palette: black · charcoal · deep navy · warm amber · muted gold · soft white.
 */
export const COLORS = {
  black: "#050506",
  charcoal: "#16171a",
  graphite: "#222326",
  navy: "#0d1626",
  amber: "#e2a25e",
  gold: "#b8955a",
  white: "#ece6da",
  paper: "#e6dfd0",
};

const cache = new Map<string, Material>();

function make<T extends Material>(key: string, create: () => T): T {
  let m = cache.get(key) as T | undefined;
  if (!m) {
    m = create();
    cache.set(key, m);
  }
  return m;
}

export const M = {
  concrete: () => make("concrete", () => new MeshStandardMaterial({ color: "#4b4946", roughness: 0.92, metalness: 0 })),
  concreteDark: () => make("concreteDark", () => new MeshStandardMaterial({ color: "#2f2e2d", roughness: 0.95, metalness: 0 })),
  darkMetal: () => make("darkMetal", () => new MeshStandardMaterial({ color: "#3a3b3f", roughness: 0.42, metalness: 0.85 })),
  blackMetal: () => make("blackMetal", () => new MeshStandardMaterial({ color: "#1c1d20", roughness: 0.5, metalness: 0.6 })),
  brushed: () => make("brushed", () => new MeshStandardMaterial({ color: "#5a5c61", roughness: 0.32, metalness: 0.95 })),
  gold: () => make("gold", () => new MeshStandardMaterial({ color: "#9c7a45", roughness: 0.35, metalness: 0.9 })),
  darkWood: () => make("darkWood", () => new MeshStandardMaterial({ color: "#3a2a1f", roughness: 0.62, metalness: 0.05 })),
  walnut: () => make("walnut", () => new MeshStandardMaterial({ color: "#4a3324", roughness: 0.55, metalness: 0.05 })),
  fabric: () => make("fabric", () => new MeshStandardMaterial({ color: "#2c2c31", roughness: 1, metalness: 0 })),
  rubber: () => make("rubber", () => new MeshStandardMaterial({ color: "#0a0a0b", roughness: 0.8, metalness: 0 })),
  paper: () => make("paper", () => new MeshStandardMaterial({ color: COLORS.paper, roughness: 0.9, metalness: 0 })),
  cork: () => make("cork", () => new MeshStandardMaterial({ color: "#5a4632", roughness: 1, metalness: 0 })),
  glass: () =>
    make(
      "glass",
      () =>
        new MeshPhysicalMaterial({
          color: "#a9c4d8",
          roughness: 0.06,
          metalness: 0.1,
          transparent: true,
          opacity: 0.12,
          envMapIntensity: 1.6,
          side: DoubleSide,
          depthWrite: false,
        }),
    ),
  lens: () => make("lens", () => new MeshStandardMaterial({ color: "#0b0d12", roughness: 0.08, metalness: 0.9, envMapIntensity: 2 })),
  screenOff: () => make("screenOff", () => new MeshStandardMaterial({ color: "#050608", roughness: 0.2, metalness: 0.5 })),
  matteBlack: () => make("matteBlack", () => new MeshStandardMaterial({ color: "#1a1a1d", roughness: 0.85, metalness: 0.1 })),
  /** Emissive bulbs and practical lights. */
  bulb: (color = "#ffd8a6", intensity = 3) =>
    make(`bulb:${color}:${intensity}`, () => new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity), toneMapped: false })),
  glow: (color: string, opacity = 0.5) =>
    make(
      `glow:${color}:${opacity}`,
      () =>
        new MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          blending: AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        }),
    ),
  tinted: (color: string, roughness = 0.7, metalness = 0.1) =>
    make(`tinted:${color}:${roughness}:${metalness}`, () => new MeshStandardMaterial({ color, roughness, metalness })),
};

/** An image shown as a lit print / backlit transparency (unlit so it reads clearly in dark rooms). */
export function imageMaterial(map: Texture, brightness = 0.92) {
  return make(
    `img:${map.uuid}:${brightness}`,
    () => new MeshBasicMaterial({ map, color: new Color(brightness, brightness, brightness), toneMapped: false }),
  );
}

/** A screen showing an image: emissive, so it glows and blooms a little. */
export function screenMaterial(map: Texture, intensity = 1.15) {
  return make(
    `screen:${map.uuid}:${intensity}`,
    () =>
      new MeshStandardMaterial({
        color: "#000000",
        emissive: "#ffffff",
        emissiveMap: map,
        emissiveIntensity: intensity,
        roughness: 0.3,
        metalness: 0.2,
      }),
  );
}

/** Paper / signage carrying a canvas texture. */
export function printMaterial(map: Texture, transparent = false) {
  return make(
    `print:${map.uuid}:${transparent}`,
    () => new MeshStandardMaterial({ map, roughness: 0.85, metalness: 0, transparent, alphaTest: transparent ? 0.02 : 0 }),
  );
}

/** Self-lit lettering (signs, labels floating in haze). */
export function signMaterial(map: Texture, color = "#ffffff", opacity = 1) {
  return make(
    `sign:${map.uuid}:${color}:${opacity}`,
    () =>
      new MeshBasicMaterial({
        map,
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        toneMapped: false,
      }),
  );
}
