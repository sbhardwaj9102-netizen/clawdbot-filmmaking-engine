"use client";

import { Color, MeshBasicMaterial, MeshStandardMaterial, type Texture } from "three";

/**
 * THEMED MATERIALS — surfaces that change with light/dark mode: walls, the
 * cyclorama, platforms, painted lettering. Each has a dark and a light
 * colour; `applyTheme(k)` blends every one of them (the Atmosphere calls it
 * while the theme eases from one to the other). Props that are physically
 * dark — cameras, stands, the suit — keep their own materials.
 */
type Entry = { mat: MeshStandardMaterial | MeshBasicMaterial; dark: Color; light: Color };
const entries = new Map<string, Entry>();
let last = -1;

export function themed(key: string, dark: string, light: string, roughness = 0.9, metalness = 0) {
  let e = entries.get(key);
  if (!e) {
    e = { mat: new MeshStandardMaterial({ color: dark, roughness, metalness }), dark: new Color(dark), light: new Color(light) };
    entries.set(key, e);
    if (last >= 0) e.mat.color.copy(e.dark).lerp(e.light, last);
  }
  return e.mat as MeshStandardMaterial;
}

/** Self-lit lettering whose ink follows the theme (light ink by night, dark ink by day). */
export function themedInk(map: Texture, dark = "#ece6da", light = "#211d17", opacity = 1) {
  const key = `ink:${map.uuid}:${dark}:${light}:${opacity}`;
  let e = entries.get(key);
  if (!e) {
    const mat = new MeshBasicMaterial({ map, color: dark, transparent: true, opacity, depthWrite: false, toneMapped: false });
    e = { mat, dark: new Color(dark), light: new Color(light) };
    entries.set(key, e);
    if (last >= 0) e.mat.color.copy(e.dark).lerp(e.light, last);
  }
  return e.mat as MeshBasicMaterial;
}

export function applyTheme(k: number) {
  if (Math.abs(k - last) < 0.002) return;
  last = k;
  for (const e of entries.values()) e.mat.color.copy(e.dark).lerp(e.light, k);
}

/** The room surfaces used across the stage. */
export const T = {
  cyc: () => themed("cyc", "#1d1d20", "#ece6da", 0.95),
  wall: () => themed("wall", "#252527", "#e2dccf", 0.92),
  wallCool: () => themed("wallCool", "#1c2028", "#e3e6ea", 0.85),
  trim: () => themed("trim", "#111113", "#b9b1a3", 0.6, 0.2),
  platform: () => themed("platform", "#1a1714", "#d6cdbd", 0.7),
  oak: () => themed("oak", "#3a2c21", "#b89a76", 0.55),
  flat: () => themed("flat", "#4f3d66", "#8d76ab", 0.9),
  flatTrim: () => themed("flatTrim", "#2b2236", "#5d4a75", 0.8),
  canvas: () => themed("canvas", "#2a2622", "#d9d1c3", 1),
};
