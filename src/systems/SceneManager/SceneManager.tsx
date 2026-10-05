"use client";

import { useFrame } from "@react-three/fiber";
import { Suspense, useMemo } from "react";

import { CorridorLayer } from "@/components/Portal/Corridor";
import { ChoiceMarkers } from "@/components/StoryChoice/ChoiceMarkers";
import { WorldProvider } from "@/components/World/WorldContext";
import { sceneById } from "@/data/story/scenes";
import { getLayout } from "@/scenes/layouts";
import { WORLDS } from "@/scenes/registry";
import { type Mounted, useStory } from "@/systems/StoryEngine/store";

import { update } from "./director";

/**
 * SCENE MANAGER — renders whatever worlds the director has mounted, each at
 * its anchor, plus the corridor between them; and ticks the director first
 * thing every frame.
 */
export function SceneManager() {
  const mounted = useStory((s) => s.mounted);
  useFrame((_, dt) => update(dt), -3);
  return (
    <>
      {mounted.map((m) => (
        <WorldInstance key={m.key} m={m} />
      ))}
      <CorridorLayer />
    </>
  );
}

function WorldInstance({ m }: { m: Mounted }) {
  const scene = sceneById[m.scene];
  const layout = getLayout(scene);
  const World = WORLDS[scene.world];
  const ctx = useMemo(() => ({ scene, layout, mountedAt: performance.now() }), [scene, layout]);
  return (
    <group position={[m.anchor.x, 0, m.anchor.z]} rotation-y={m.anchor.yaw}>
      <WorldProvider value={ctx}>
        <Suspense fallback={null}>
          <World />
          <ChoiceMarkers />
        </Suspense>
      </WorldProvider>
    </group>
  );
}
