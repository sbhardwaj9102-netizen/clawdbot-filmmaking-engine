"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  type Group,
  type InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
} from "three";

import { textTexture, windowsTexture } from "@/lib/canvasTextures";

import { M, signMaterial } from "../materials";

type V3 = [number, number, number];

export function Column({ position, h = 12, w = 0.8, material }: { position?: V3; h?: number; w?: number; material?: "concrete" | "metal" }) {
  return (
    <mesh position={[position?.[0] ?? 0, h / 2, position?.[2] ?? 0]} material={material === "metal" ? M.darkMetal() : M.concrete()} castShadow receiveShadow>
      <boxGeometry args={[w, h, w]} />
    </mesh>
  );
}

/** A wall segment (along X), optional opening. */
export function Wall({ position, rotation, w = 10, h = 8, t = 0.3, opening, material = "concrete" }: { position?: V3; rotation?: V3; w?: number; h?: number; t?: number; opening?: { w: number; h: number; x?: number }; material?: "concrete" | "dark" | "metal" }) {
  const mat = material === "dark" ? M.concreteDark() : material === "metal" ? M.darkMetal() : M.concrete();
  if (!opening) {
    return (
      <mesh position={[position?.[0] ?? 0, (position?.[1] ?? 0) + h / 2, position?.[2] ?? 0]} rotation={rotation} material={mat} receiveShadow>
        <boxGeometry args={[w, h, t]} />
      </mesh>
    );
  }
  const ox = opening.x ?? 0;
  const left = w / 2 + ox - opening.w / 2;
  const right = w / 2 - ox - opening.w / 2;
  return (
    <group position={position} rotation={rotation}>
      <mesh material={mat} position={[-w / 2 + left / 2, h / 2, 0]} receiveShadow>
        <boxGeometry args={[left, h, t]} />
      </mesh>
      <mesh material={mat} position={[w / 2 - right / 2, h / 2, 0]} receiveShadow>
        <boxGeometry args={[right, h, t]} />
      </mesh>
      <mesh material={mat} position={[ox, opening.h + (h - opening.h) / 2, 0]} receiveShadow>
        <boxGeometry args={[opening.w, h - opening.h, t]} />
      </mesh>
    </group>
  );
}

/** Square box truss along X, instanced diagonals. */
export function Truss({ length = 10, size = 0.3, position, rotation }: { length?: number; size?: number; position?: V3; rotation?: V3 }) {
  const ref = useRef<InstancedMesh>(null);
  const n = Math.floor(length / size);
  const geo = useMemo(() => new BoxGeometry(0.015, Math.hypot(size, size), 0.015), [size]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new Object3D();
    let i = 0;
    for (let k = 0; k < n; k++) {
      const x = -length / 2 + (k + 0.5) * size;
      for (const [y, z, rx, rz] of [
        [0, size / 2, 0, (k % 2 ? 1 : -1) * Math.PI / 4],
        [0, -size / 2, 0, (k % 2 ? -1 : 1) * Math.PI / 4],
        [size / 2, 0, (k % 2 ? 1 : -1) * Math.PI / 4, Math.PI / 2],
        [-size / 2, 0, (k % 2 ? -1 : 1) * Math.PI / 4, Math.PI / 2],
      ] as [number, number, number, number][]) {
        o.position.set(x, y, z);
        o.rotation.set(rx, 0, rz);
        o.updateMatrix();
        m.setMatrixAt(i++, o.matrix);
      }
    }
    m.instanceMatrix.needsUpdate = true;
  }, [n, length, size]);
  return (
    <group position={position} rotation={rotation}>
      {[
        [size / 2, size / 2],
        [size / 2, -size / 2],
        [-size / 2, size / 2],
        [-size / 2, -size / 2],
      ].map(([y, z]) => (
        <mesh key={`${y}${z}`} material={M.brushed()} position={[0, y, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.022, 0.022, length, 6]} />
        </mesh>
      ))}
      <instancedMesh ref={ref} args={[geo, M.brushed(), n * 4]} />
    </group>
  );
}

/** Glass partition with mullions (along X). */
export function GlassWall({ w = 8, h = 5, panes = 4, position, rotation, gapAt }: { w?: number; h?: number; panes?: number; position?: V3; rotation?: V3; gapAt?: number }) {
  const pw = w / panes;
  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: panes }, (_, i) =>
        i === gapAt ? null : (
          <mesh key={i} material={M.glass()} position={[-w / 2 + pw * (i + 0.5), h / 2, 0]}>
            <planeGeometry args={[pw - 0.04, h]} />
          </mesh>
        ),
      )}
      {Array.from({ length: panes + 1 }, (_, i) => (
        <mesh key={`m${i}`} material={M.blackMetal()} position={[-w / 2 + pw * i, h / 2, 0]}>
          <boxGeometry args={[0.05, h, 0.08]} />
        </mesh>
      ))}
      <mesh material={M.blackMetal()} position={[0, h, 0]}>
        <boxGeometry args={[w, 0.08, 0.1]} />
      </mesh>
      <mesh material={M.blackMetal()} position={[0, 0.03, 0]}>
        <boxGeometry args={[w, 0.06, 0.1]} />
      </mesh>
    </group>
  );
}

/** Night skyline: instanced towers with lit windows, placed on a ring. */
export function Skyline({ count = 150, inner = 40, outer = 140, center = [0, 0, 0] as V3, arc = [0, Math.PI * 2] as [number, number], seed = 5 }: { count?: number; inner?: number; outer?: number; center?: V3; arc?: [number, number]; seed?: number }) {
  const ref = useRef<InstancedMesh>(null);
  const geo = useMemo(() => {
    const g = new BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    return g;
  }, []);
  const mat = useMemo(() => {
    const t = windowsTexture(seed);
    return new MeshStandardMaterial({ color: "#05070b", emissive: new Color("#ffffff"), emissiveMap: t, emissiveIntensity: 1.1, roughness: 0.6, metalness: 0.4 });
  }, [seed]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    let s = seed * 9301;
    const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const o = new Object3D();
    for (let i = 0; i < count; i++) {
      const a = arc[0] + r() * (arc[1] - arc[0]);
      const d = inner + Math.pow(r(), 0.7) * (outer - inner);
      const w = 4 + r() * 10;
      const h = 8 + Math.pow(r(), 1.8) * 70 * (0.5 + d / outer);
      o.position.set(center[0] + Math.sin(a) * d, -0.2, center[2] + Math.cos(a) * d);
      o.rotation.set(0, r() * Math.PI, 0);
      o.scale.set(w, h, 4 + r() * 10);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [count, inner, outer, center, arc, seed]);
  return <instancedMesh ref={ref} args={[geo, mat, count]} frustumCulled={false} />;
}

/** Big sliding door (two leaves), opening 0–1. */
export function SlidingDoor({ w = 4.4, h = 6.5, position, rotation, open }: { w?: number; h?: number; position?: V3; rotation?: V3; open: { current: number } }) {
  const l = useRef<Group>(null);
  const r = useRef<Group>(null);
  useFrame(() => {
    const k = open.current;
    if (l.current) l.current.position.x = -w / 4 - k * (w / 2 + 0.1);
    if (r.current) r.current.position.x = w / 4 + k * (w / 2 + 0.1);
  });
  const leaf = (
    <>
      <mesh material={M.darkMetal()} position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w / 2, h, 0.14]} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} material={M.blackMetal()} position={[0, (h / 6) * (i + 0.5), 0.075]}>
          <boxGeometry args={[w / 2 - 0.1, 0.04, 0.02]} />
        </mesh>
      ))}
    </>
  );
  return (
    <group position={position} rotation={rotation}>
      <group ref={l}>{leaf}</group>
      <group ref={r}>{leaf}</group>
      <mesh material={M.blackMetal()} position={[0, h + 0.15, 0]}>
        <boxGeometry args={[w * 2.2, 0.3, 0.3]} />
      </mesh>
    </group>
  );
}

/** Floating self-lit lettering. */
export function Sign({
  text,
  position,
  rotation,
  width = 4,
  font = "serif",
  color = "#ece6da",
  opacity = 1,
  sub,
  size = 150,
  tracking = 0.08,
  align = "center",
}: {
  text: string;
  position?: V3;
  rotation?: V3;
  width?: number;
  font?: "serif" | "sans" | "mono";
  color?: string;
  opacity?: number;
  sub?: string;
  size?: number;
  tracking?: number;
  align?: "left" | "center";
}) {
  const map = useMemo(() => textTexture(text, { font, size, tracking, sub, w: 2048, h: 400, align }), [text, font, size, tracking, sub, align]);
  const mat = useMemo(() => signMaterial(map, color, opacity), [map, color, opacity]);
  return (
    <mesh position={position} rotation={rotation} material={mat} raycast={() => null}>
      <planeGeometry args={[width, width * (400 / 2048)]} />
    </mesh>
  );
}

/** Layered hill silhouettes receding into haze (ASTER). */
export function Hills({ position, rotation, layers }: { position?: V3; rotation?: V3; layers: { z: number; height: number; color: string; seed: number; width?: number }[] }) {
  const geos = useMemo(
    () =>
      layers.map((L) => {
        const w = L.width ?? 260;
        const shape = new Shape();
        shape.moveTo(-w / 2, -2);
        let s = L.seed * 7919;
        const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
        const steps = 90;
        let y = L.height * 0.6;
        for (let i = 0; i <= steps; i++) {
          const x = -w / 2 + (i / steps) * w;
          y += (r() - 0.5) * L.height * 0.35;
          y = Math.max(L.height * 0.25, Math.min(L.height, y));
          const ridge = y + Math.sin(i * 0.31 + L.seed) * L.height * 0.12;
          shape.lineTo(x, ridge);
        }
        shape.lineTo(w / 2, -2);
        shape.lineTo(-w / 2, -2);
        return new ShapeGeometry(shape, 1);
      }),
    [layers],
  );
  const mats = useMemo(() => layers.map((L) => new MeshBasicMaterial({ color: L.color, fog: true, side: DoubleSide })), [layers]);
  return (
    <group position={position} rotation={rotation}>
      {layers.map((L, i) => (
        <mesh key={i} geometry={geos[i]} material={mats[i]} position={[0, 0, L.z]} raycast={() => null} />
      ))}
    </group>
  );
}

/** A large sky backdrop with a vertical gradient (unaffected by fog). */
export function SkyPlane({ position, rotation, w = 400, h = 120, top, bottom, sun }: { position?: V3; rotation?: V3; w?: number; h?: number; top: string; bottom: string; sun?: { x: number; y: number; color: string; size: number } }) {
  const mat = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 256);
    if (sun) {
      const rg = ctx.createRadialGradient(sun.x * 512, sun.y * 256, 0, sun.x * 512, sun.y * 256, sun.size * 512);
      rg.addColorStop(0, sun.color);
      rg.addColorStop(0.15, sun.color);
      rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, 512, 256);
    }
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return new MeshBasicMaterial({ map: t, fog: false, toneMapped: false, depthWrite: false });
  }, [top, bottom, sun]);
  return (
    <mesh position={position} rotation={rotation} material={mat} renderOrder={-1} raycast={() => null}>
      <planeGeometry args={[w, h]} />
    </mesh>
  );
}
