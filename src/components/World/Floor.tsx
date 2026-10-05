"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Mesh, MeshStandardMaterial } from "three";

import { concreteTexture } from "@/lib/canvasTextures";
import { rt } from "@/systems/Experience/runtime";

/**
 * The studio floor under both rooms: polished concrete. On capable GPUs it
 * is a blurred reflector (the "wet stage floor" look); elsewhere a glossy PBR
 * floor that picks up the environment. Tinted by the blended palette.
 */
export function Floor({ reflector }: { reflector: boolean }) {
  const mesh = useRef<Mesh>(null);
  const map = useMemo(() => {
    const t = concreteTexture();
    t.repeat.set(24, 12);
    return t;
  }, []);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const mat = m.material as MeshStandardMaterial;
    const p = rt.look.palette;
    // the concrete map is mid-grey; the palette tint is scaled into a sensible albedo
    mat.color.copy(p.floor).multiplyScalar(rt.look.theme > 0.5 ? 1.45 : 2.6);
    mat.roughness = p.floorRoughness;
  });

  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} position={[8, 0, 0]} receiveShadow>
      <planeGeometry args={[140, 70]} />
      {reflector ? (
        <MeshReflectorMaterial
          map={map}
          resolution={512}
          blur={[400, 120]}
          mixBlur={1}
          mixStrength={2.6}
          mixContrast={1.1}
          roughness={0.85}
          depthScale={1}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.3}
          color="#2a2a2c"
          metalness={0.3}
          mirror={0}
        />
      ) : (
        <meshStandardMaterial map={map} color="#2a2a2c" roughness={0.42} metalness={0.2} envMapIntensity={0.8} />
      )}
    </mesh>
  );
}
