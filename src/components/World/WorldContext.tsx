"use client";

import { useFrame } from "@react-three/fiber";
import { createContext, type ReactNode, useContext, useRef } from "react";
import type { Group } from "three";

import type { StoryScene } from "@/data/story/types";
import type { WorldLayout } from "@/scenes/types";
import { useStory } from "@/systems/StoryEngine/store";

export type WorldCtx = { scene: StoryScene; layout: WorldLayout; mountedAt: number };

const Ctx = createContext<WorldCtx | null>(null);

export const WorldProvider = Ctx.Provider;

export function useWorld() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWorld outside a world");
  return v;
}

/** Time (s) since a world event fired in the current scene, or -1. */
export function useWorldEvent(name: string) {
  return useStory((s) => s.worldEvents[name] ?? 0);
}

export const since = (ts: number) => (ts ? (performance.now() - ts) / 1000 : -1);

/**
 * Pieces of a world rise out of the floor and settle when the world appears —
 * the environment assembling itself around the avatar.
 */
export function Assemble({ children, delay = 0, from = -2.5, duration = 1.6 }: { children: ReactNode; delay?: number; from?: number; duration?: number }) {
  const ref = useRef<Group>(null);
  const { mountedAt } = useWorld();
  const reduced = useStory((s) => s.reducedMotion);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const t = (performance.now() - mountedAt) / 1000 - delay;
    const k = reduced ? 1 : Math.min(1, Math.max(0, t / duration));
    const e = 1 - Math.pow(1 - k, 3);
    g.position.y = from * (1 - e);
    g.visible = k > 0;
  });
  return <group ref={ref}>{children}</group>;
}
