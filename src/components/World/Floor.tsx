"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, type Mesh, type MeshStandardMaterial } from "three";

import { concreteTexture } from "@/lib/canvasTextures";
import { rt } from "@/systems/SceneManager/director";

/**
 * The ground everywhere: polished concrete. On capable GPUs it is a real
 * blurred reflector (the "wet stage floor" look); elsewhere a glossy PBR floor
 * that picks up the environment. Tinted per world and kept centred
 * under the avatar.
 */
export function Floor({ reflector }: { reflector: boolean }) {
  const mesh = useRef<Mesh>(null);
  const map = useMemo(() => {
    const t = concreteTexture();
    t.repeat.set(70, 70);
    return t;
  }, []);
  const target = useMemo(() => new Color(), []);

  useFrame((_, dt) => {
    const sc = rt.active;
    const m = mesh.current;
    if (!sc || !m) return;
    // keep the slab under the avatar; snap by whole tiles so the texture never swims
    const tile = 400 / 70;
    m.position.x = Math.round(rt.avatar.pos.x / tile) * tile;
    m.position.z = Math.round(rt.avatar.pos.z / tile) * tile;
    const mat = m.material as MeshStandardMaterial;
    const pal = sc.layout.paletteAt ? sc.layout.paletteAt(rt.avatar.u) : sc.layout.palette;
    // the concrete map is mid-grey; the palette tint is scaled into a sensible albedo
    target.set(pal.floor).multiplyScalar(3.4);
    mat.color.lerp(target, 1 - Math.exp(-1.5 * Math.min(dt, 0.05)));
    mat.roughness = pal.floorRoughness;
  }, -1);

  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[400, 400]} />
      {reflector ? (
        <MeshReflectorMaterial
          map={map}
          resolution={512}
          blur={[400, 120]}
          mixBlur={1}
          mixStrength={3.2}
          mixContrast={1.1}
          roughness={0.85}
          depthScale={1}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.3}
          color="#2a2a2c"
          metalness={0.35}
          mirror={0}
        />
      ) : (
        <meshStandardMaterial map={map} color="#2a2a2c" roughness={0.42} metalness={0.25} envMapIntensity={0.8} />
      )}
    </mesh>
  );
}
