"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type ReactNode, useMemo, useRef } from "react";
import { type Group, MeshStandardMaterial, type Texture } from "three";

import { useHotspotGlow } from "@/components/InteractiveObject/Hotspot";
import { documentTexture } from "@/lib/canvasTextures";

import { LightShaft } from "../LightShaft";
import { M } from "../materials";
import { Photo } from "./Photo";

type V3 = [number, number, number];

/** Production table: dark-wood top on black steel trestles. Top surface at `height`. */
export function Table({ w = 3, d = 1.2, height = 0.9, position, rotation, material = "wood" }: { w?: number; d?: number; height?: number; position?: V3; rotation?: V3; material?: "wood" | "walnut" | "steel" }) {
  const top = material === "steel" ? M.darkMetal() : material === "walnut" ? M.walnut() : M.darkWood();
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[w, 0.05, d]} radius={0.012} smoothness={2} position={[0, height - 0.025, 0]} material={top} castShadow receiveShadow />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (w / 2 - 0.25), 0, 0]}>
          <mesh material={M.blackMetal()} position={[0, (height - 0.05) / 2, 0]}>
            <boxGeometry args={[0.05, height - 0.05, d * 0.8]} />
          </mesh>
          <mesh material={M.blackMetal()} position={[0, 0.02, 0]}>
            <boxGeometry args={[0.08, 0.04, d * 0.85]} />
          </mesh>
        </group>
      ))}
      <mesh material={M.blackMetal()} position={[0, height * 0.25, 0]}>
        <boxGeometry args={[w - 0.5, 0.04, 0.04]} />
      </mesh>
    </group>
  );
}

/** Simple modern desk with a thin top and slab legs. */
export function Desk({ w = 1.8, d = 0.8, height = 0.76, position, rotation }: { w?: number; d?: number; height?: number; position?: V3; rotation?: V3 }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[w, 0.04, d]} radius={0.01} smoothness={2} position={[0, height - 0.02, 0]} material={M.walnut()} castShadow receiveShadow />
      {[-1, 1].map((s) => (
        <mesh key={s} material={M.blackMetal()} position={[s * (w / 2 - 0.04), (height - 0.04) / 2, 0]}>
          <boxGeometry args={[0.03, height - 0.04, d - 0.06]} />
        </mesh>
      ))}
    </group>
  );
}

export function Chair({ position, rotation }: { position?: V3; rotation?: V3 }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.48, 0.06, 0.46]} radius={0.02} smoothness={2} position={[0, 0.47, 0]} material={M.fabric()} />
      <RoundedBox args={[0.48, 0.42, 0.05]} radius={0.02} smoothness={2} position={[0, 0.74, -0.22]} rotation-x={-0.08} material={M.fabric()} />
      {[
        [-0.2, -0.19],
        [0.2, -0.19],
        [-0.2, 0.19],
        [0.2, 0.19],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} material={M.blackMetal()} position={[x, 0.22, z]}>
          <cylinderGeometry args={[0.012, 0.012, 0.45, 6]} />
        </mesh>
      ))}
    </group>
  );
}

/** A sheet (or stack) of paper lying flat, carrying a canvas texture. */
export function Paper({ map, w = 0.21, h = 0.297, position, rotation = [0, 0, 0], stack = 1 }: { map: Texture; w?: number; h?: number; position?: V3; rotation?: V3; stack?: number }) {
  const mat = useMemo(() => new MeshStandardMaterial({ map, roughness: 0.9 }), [map]);
  const glow = useHotspotGlow();
  useFrame(() => {
    mat.emissive.setScalar(glow.value * 0.18);
  });
  return (
    <group position={position} rotation={rotation}>
      {stack > 1 && (
        <mesh material={M.paper()} position={[0, (stack * 0.0012) / 2, 0]}>
          <boxGeometry args={[w, stack * 0.0012, h]} />
        </mesh>
      )}
      <mesh material={mat} rotation-x={-Math.PI / 2} position={[0, stack * 0.0012 + 0.0008, 0]}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </group>
  );
}

/** A document lying on a surface (kind/title drawn on it — never invented figures). */
export function Doc({ kind, title, position, rotation, scale = 1, seed, columns, stamp, stack = 1 }: { kind: string; title: string; position?: V3; rotation?: V3; scale?: number; seed?: number; columns?: boolean; stamp?: string; stack?: number }) {
  const map = useMemo(() => documentTexture(kind, title, { seed, columns, stamp }), [kind, title, seed, columns, stamp]);
  return <Paper map={map} position={position} rotation={rotation} w={0.21 * scale} h={0.29 * scale} stack={stack} />;
}

/** A binder lying open, a document inside. */
export function Binder({ kind, title, color = "#13203a", position, rotation, columns = true }: { kind: string; title: string; color?: string; position?: V3; rotation?: V3; columns?: boolean }) {
  const cover = useMemo(() => new MeshStandardMaterial({ color, roughness: 0.6 }), [color]);
  return (
    <group position={position} rotation={rotation}>
      <mesh material={cover} position={[-0.17, 0.006, 0]}>
        <boxGeometry args={[0.32, 0.012, 0.4]} />
      </mesh>
      <mesh material={cover} position={[0.17, 0.006, 0]}>
        <boxGeometry args={[0.32, 0.012, 0.4]} />
      </mesh>
      <Doc kind={kind} title={title} columns={columns} position={[0.17, 0.012, 0]} scale={1.25} stack={20} />
      <Doc kind={kind} title="—" seed={13} position={[-0.17, 0.012, 0]} scale={1.25} stack={12} />
      {[-0.1, 0, 0.1].map((z) => (
        <mesh key={z} material={M.brushed()} position={[0, 0.03, z]} rotation-z={Math.PI / 2}>
          <torusGeometry args={[0.022, 0.004, 6, 14, Math.PI]} />
        </mesh>
      ))}
    </group>
  );
}

/** Architectural scale model: a base with white blocks — the "build it" object. */
export function ScaleModel({ position, rotation, scale = 1 }: { position?: V3; rotation?: V3; scale?: number }) {
  const blocks = useMemo(() => {
    const out: { x: number; z: number; w: number; d: number; h: number }[] = [];
    let s = 3;
    const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 14; i++) {
      out.push({ x: (r() - 0.5) * 0.4, z: (r() - 0.5) * 0.3, w: 0.04 + r() * 0.06, d: 0.04 + r() * 0.06, h: 0.04 + r() * r() * 0.26 });
    }
    return out;
  }, []);
  const white = useMemo(() => new MeshStandardMaterial({ color: "#efeae0", roughness: 0.7 }), []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh material={M.walnut()} position={[0, 0.012, 0]}>
        <boxGeometry args={[0.55, 0.024, 0.42]} />
      </mesh>
      {blocks.map((b, i) => (
        <mesh key={i} material={white} position={[b.x, 0.024 + b.h / 2, b.z]} castShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
        </mesh>
      ))}
    </group>
  );
}

/** A board on an easel / wall: cork or black, with pinned media. */
export function Board({
  w = 2.4,
  h = 1.4,
  position,
  rotation,
  kind = "cork",
  legs = true,
  children,
}: {
  w?: number;
  h?: number;
  position?: V3;
  rotation?: V3;
  kind?: "cork" | "black" | "white";
  legs?: boolean;
  children?: ReactNode;
}) {
  const face = kind === "cork" ? M.cork() : kind === "white" ? M.tinted("#d9d4c8", 0.6, 0) : M.matteBlack();
  return (
    <group position={position} rotation={rotation}>
      <mesh material={M.blackMetal()} position={[0, 0, -0.03]}>
        <boxGeometry args={[w + 0.08, h + 0.08, 0.04]} />
      </mesh>
      <mesh material={face} position={[0, 0, -0.008]}>
        <boxGeometry args={[w, h, 0.01]} />
      </mesh>
      {legs &&
        [-1, 1].map((s) => (
          <mesh key={s} material={M.blackMetal()} position={[s * (w / 2 - 0.15), -h / 2 - 0.45 + 0.02, -0.06]}>
            <boxGeometry args={[0.04, h + 0.9, 0.04]} />
          </mesh>
        ))}
      <group position={[0, 0, 0.002]}>{children}</group>
    </group>
  );
}

/** Pinned print (a Photo with a pin). */
export function Pinned({ src, w = 0.5, aspect = 16 / 9, position, rotation }: { src: string; w?: number; aspect?: number; position?: V3; rotation?: V3 }) {
  return (
    <group position={position} rotation={rotation}>
      <Photo src={src} w={w} aspect={aspect} border={0.015} />
      <mesh material={M.bulb("#c9452e", 0.8)} position={[0, w / aspect / 2 - 0.02, 0.012]}>
        <sphereGeometry args={[0.012, 8, 6]} />
      </mesh>
    </group>
  );
}

/** Practical lamp: pendant (hanging shade + bulb + light shaft) or desk lamp. */
export function Lamp({ position, color = "#ffcf94", kind = "pendant", drop = 1.4, shaft = true, shaftLength = 3 }: { position?: V3; color?: string; kind?: "pendant" | "desk"; drop?: number; shaft?: boolean; shaftLength?: number }) {
  if (kind === "desk") {
    return (
      <group position={position}>
        <mesh material={M.blackMetal()} position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.08, 0.09, 0.02, 16]} />
        </mesh>
        <mesh material={M.blackMetal()} position={[0, 0.2, -0.02]} rotation-x={0.15}>
          <cylinderGeometry args={[0.008, 0.008, 0.4, 6]} />
        </mesh>
        <group position={[0, 0.4, 0.02]} rotation-x={0.7}>
          <mesh material={M.blackMetal()}>
            <coneGeometry args={[0.08, 0.12, 16, 1, true]} />
          </mesh>
          <mesh material={M.bulb(color, 3)} position={[0, -0.04, 0]}>
            <sphereGeometry args={[0.03, 10, 8]} />
          </mesh>
        </group>
      </group>
    );
  }
  return (
    <group position={position}>
      <mesh material={M.blackMetal()} position={[0, drop / 2, 0]}>
        <cylinderGeometry args={[0.004, 0.004, drop, 4]} />
      </mesh>
      <mesh material={M.blackMetal()} position={[0, 0, 0]}>
        <coneGeometry args={[0.22, 0.22, 24, 1, true]} />
      </mesh>
      <mesh material={M.bulb(color, 3.2)} position={[0, -0.08, 0]}>
        <sphereGeometry args={[0.05, 12, 8]} />
      </mesh>
      {shaft && (
        <group position={[0, -0.08, 0]}>
          <LightShaft length={shaftLength} radius={shaftLength * 0.42} color={color} opacity={0.12} top={0.18} />
        </group>
      )}
    </group>
  );
}

/** Desk / wall screen with a canvas-texture UI. */
export function UIScreen({ map, w = 0.6, h = 0.36, position, rotation, intensity = 1, stand = true }: { map: Texture; w?: number; h?: number; position?: V3; rotation?: V3; intensity?: number; stand?: boolean }) {
  const mat = useMemo(() => new MeshStandardMaterial({ color: "#000", emissive: "#fff", emissiveMap: map, emissiveIntensity: intensity, roughness: 0.3 }), [map, intensity]);
  const glow = useHotspotGlow();
  const g = useRef<Group>(null);
  useFrame(() => {
    mat.emissiveIntensity = intensity * (0.8 + glow.value * 0.4);
  });
  return (
    <group ref={g} position={position} rotation={rotation}>
      <RoundedBox args={[w + 0.03, h + 0.03, 0.03]} radius={0.008} smoothness={2} position={[0, h / 2, -0.018]} material={M.matteBlack()} />
      <mesh material={mat} position={[0, h / 2, 0]}>
        <planeGeometry args={[w, h]} />
      </mesh>
      {stand && (
        <>
          <mesh material={M.blackMetal()} position={[0, -0.06, -0.04]}>
            <boxGeometry args={[0.04, 0.14, 0.02]} />
          </mesh>
          <mesh material={M.blackMetal()} position={[0, -0.13, -0.04]}>
            <boxGeometry args={[0.22, 0.01, 0.14]} />
          </mesh>
        </>
      )}
    </group>
  );
}
