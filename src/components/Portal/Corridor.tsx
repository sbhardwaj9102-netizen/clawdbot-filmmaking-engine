"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BoxGeometry, Color, type Group, MeshBasicMaterial, Vector3 } from "three";

import { rt } from "@/systems/SceneManager/director";
import { type Corridor as CorridorState, useStory } from "@/systems/StoryEngine/store";

/**
 * THE CORRIDOR — travel between worlds. A run of light gates the avatar walks
 * through; each gate warms up as he passes and their colour shifts from the
 * world being left to the world ahead. Fog peaks halfway, where one world is
 * swapped for the next.
 */
const GATES = 7;

export function CorridorLayer() {
  const corridor = useStory((s) => s.corridor);
  if (!corridor) return null;
  return <Corridor key={corridor.key} c={corridor} />;
}

function Corridor({ c }: { c: CorridorState }) {
  const group = useRef<Group>(null);
  const bar = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const from = useMemo(() => new Color(c.from), [c.from]);
  const to = useMemo(() => new Color(c.to), [c.to]);
  const mats = useMemo(
    () =>
      Array.from({ length: GATES }, (_, i) => {
        const col = from.clone().lerp(to, i / (GATES - 1));
        return new MeshBasicMaterial({ color: col, toneMapped: false, transparent: true, opacity: 0.0 });
      }),
    [from, to],
  );
  const runner = useMemo(() => new MeshBasicMaterial({ color: from.clone().lerp(to, 0.5), toneMapped: false, transparent: true, opacity: 0.35 }), [from, to]);
  const local = useMemo(() => new Vector3(), []);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.updateMatrixWorld();
    local.copy(rt.avatar.pos);
    g.worldToLocal(local);
    const along = local.z;
    mats.forEach((m, i) => {
      const z = ((i + 0.5) / GATES) * c.length;
      const d = Math.abs(along - z);
      const base = 0.18 + 0.82 * Math.exp(-(d * d) / 6);
      m.opacity = base;
      m.color.copy(from).lerp(to, i / (GATES - 1)).multiplyScalar(0.6 + base * 2.2);
    });
  });

  return (
    <group ref={group} position={[c.x, 0, c.z]} rotation-y={c.yaw}>
      {Array.from({ length: GATES }, (_, i) => {
        const z = ((i + 0.5) / GATES) * c.length;
        const w = 4.2;
        const h = 4.6;
        return (
          <group key={i} position={[0, 0, z]}>
            <mesh geometry={bar} material={mats[i]} position={[-w / 2, h / 2, 0]} scale={[0.05, h, 0.05]} />
            <mesh geometry={bar} material={mats[i]} position={[w / 2, h / 2, 0]} scale={[0.05, h, 0.05]} />
            <mesh geometry={bar} material={mats[i]} position={[0, h, 0]} scale={[w + 0.05, 0.05, 0.05]} />
          </group>
        );
      })}
      <mesh geometry={bar} material={runner} position={[-1.7, 0.01, c.length / 2]} scale={[0.03, 0.01, c.length]} />
      <mesh geometry={bar} material={runner} position={[1.7, 0.01, c.length / 2]} scale={[0.03, 0.01, c.length]} />
    </group>
  );
}
