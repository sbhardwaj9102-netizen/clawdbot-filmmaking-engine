"use client";

import { useMemo } from "react";
import { LinearMipmapLinearFilter, SRGBColorSpace, type Texture, TextureLoader } from "three";

import { tex } from "./assets";

/**
 * Texture cache shared by both rooms.
 *
 * Textures are created synchronously (three fills them in when the image
 * arrives), so nothing suspends; an image appears the moment it loads.
 * `preloadTextures` / `texturesLoaded` are there for anything that wants to wait.
 */
const loader = typeof window !== "undefined" ? new TextureLoader() : null;
const cache = new Map<string, { texture: Texture; ready: Promise<void>; loaded: boolean }>();

function entry(src: string) {
  const url = tex(src);
  let e = cache.get(url);
  if (!e && loader) {
    let resolve!: () => void;
    const ready = new Promise<void>((r) => (resolve = r));
    const texture = loader.load(
      url,
      () => {
        e!.loaded = true;
        resolve();
      },
      undefined,
      () => {
        // A missing image must never stall the journey.
        e!.loaded = true;
        resolve();
      },
    );
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    texture.minFilter = LinearMipmapLinearFilter;
    e = { texture, ready, loaded: false };
    cache.set(url, e);
  }
  return e!;
}

export const getTexture = (src: string) => entry(src).texture;

export const preloadTextures = (srcs: string[]) => Promise.all(srcs.map((s) => entry(s).ready)).then(() => undefined);

export const texturesLoaded = (srcs: string[]) => srcs.every((s) => entry(s).loaded);

export function useTex(src: string) {
  return useMemo(() => getTexture(src), [src]);
}
