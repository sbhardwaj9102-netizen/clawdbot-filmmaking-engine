"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CapsuleGeometry,
  Color,
  DoubleSide,
  type InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  type Points,
  ShaderMaterial,
  SphereGeometry,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { M } from "../materials";

type V3 = [number, number, number];

function seeded(seed: number) {
  let s = seed * 7919 + 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Silhouette figures (instanced) — crews, guests, teams. `visible` 0–1 fades them in by scale. */
export function Crowd({
  spots,
  color = "#0c0c0e",
  visible,
  seed = 1,
}: {
  spots: { x: number; z: number; yaw?: number }[];
  color?: string;
  visible?: { current: number };
  seed?: number;
}) {
  const ref = useRef<InstancedMesh>(null);
  const geo = useMemo(() => {
    // a person in silhouette: torso, shoulders, arms, legs, head
    const parts = [];
    const torso = new CapsuleGeometry(0.17, 0.42, 4, 10);
    torso.scale(1.05, 1, 0.6);
    torso.translate(0, 1.22, 0);
    parts.push(torso);
    const hips = new CapsuleGeometry(0.14, 0.1, 4, 10);
    hips.scale(1.1, 1, 0.65);
    hips.translate(0, 0.9, 0);
    parts.push(hips);
    for (const x of [-0.085, 0.085]) {
      const leg = new CapsuleGeometry(0.068, 0.72, 4, 8);
      leg.translate(x, 0.45, 0);
      parts.push(leg);
    }
    for (const x of [-0.235, 0.235]) {
      const arm = new CapsuleGeometry(0.045, 0.56, 4, 8);
      arm.rotateZ(x > 0 ? -0.08 : 0.08);
      arm.translate(x, 1.12, 0);
      parts.push(arm);
    }
    const neck = new CapsuleGeometry(0.045, 0.06, 2, 6);
    neck.translate(0, 1.55, 0);
    parts.push(neck);
    const head = new SphereGeometry(0.1, 12, 10);
    head.scale(0.9, 1.12, 1);
    head.translate(0, 1.68, 0);
    parts.push(head);
    return mergeGeometries(parts)!;
  }, []);
  const mat = useMemo(() => new MeshStandardMaterial({ color, roughness: 0.9 }), [color]);
  const data = useMemo(() => {
    const r = seeded(seed);
    return spots.map((s) => ({ ...s, h: 0.92 + r() * 0.16, d: r() * 0.6, sway: r() * 6.28 }));
  }, [spots, seed]);
  const o = useMemo(() => new Object3D(), []);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const v = visible ? visible.current : 1;
    const t = performance.now() / 1000;
    data.forEach((p, i) => {
      const k = Math.min(1, Math.max(0, v * 1.6 - p.d));
      o.position.set(p.x, 0, p.z);
      o.rotation.set(0, (p.yaw ?? 0) + Math.sin(t * 0.4 + p.sway) * 0.08, 0);
      o.scale.set(k, p.h * k, k);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, data.length]} castShadow frustumCulled={false} />;
}

/** Strings of warm bulbs hung in catenaries between points. `on` 0–1 brightness. */
export function StringLights({ strands, on, color = "#ffcf8a", per = 24 }: { strands: [V3, V3][]; on?: { current: number }; color?: string; per?: number }) {
  const ref = useRef<InstancedMesh>(null);
  const geo = useMemo(() => new SphereGeometry(0.035, 6, 5), []);
  const base = useMemo(() => new Color(color), [color]);
  const mat = useMemo(() => new MeshBasicMaterial({ color: base.clone().multiplyScalar(3), toneMapped: false }), [base]);
  const count = strands.length * per;
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new Object3D();
    let i = 0;
    for (const [a, b] of strands) {
      for (let k = 0; k < per; k++) {
        const t = k / (per - 1);
        const sag = Math.sin(t * Math.PI) * 0.9;
        o.position.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag, a[2] + (b[2] - a[2]) * t);
        o.updateMatrix();
        m.setMatrixAt(i++, o.matrix);
      }
    }
    m.instanceMatrix.needsUpdate = true;
  }, [strands, per]);
  useFrame(() => {
    const v = on ? on.current : 1;
    mat.color.copy(base).multiplyScalar(0.05 + v * 3.2);
  });
  return <instancedMesh ref={ref} args={[geo, mat, count]} frustumCulled={false} raycast={() => null} />;
}

/** Round banquet table with a cloth and a candle. */
export function RoundTable({ position, candle = { current: 1 } }: { position?: V3; candle?: { current: number } }) {
  const flame = useRef<MeshBasicMaterial>(null);
  useFrame(() => {
    if (flame.current) flame.current.color.setRGB(1, 0.75, 0.45).multiplyScalar(candle.current * (2.6 + Math.sin(performance.now() / 90) * 0.3));
  });
  return (
    <group position={position}>
      <mesh material={M.tinted("#d9d2c4", 0.95, 0)} position={[0, 0.38, 0]} receiveShadow>
        <cylinderGeometry args={[0.85, 0.95, 0.76, 28, 1, true]} />
      </mesh>
      <mesh material={M.tinted("#e4ddcf", 0.9, 0)} position={[0, 0.765, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.01, 28]} />
      </mesh>
      <mesh material={M.gold()} position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.03, 0.05, 0.16, 10]} />
      </mesh>
      <mesh position={[0, 0.96, 0]}>
        <sphereGeometry args={[0.025, 8, 6]} />
        <meshBasicMaterial ref={flame} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Stage platform with a lit front edge. */
export function Stage({ w = 12, d = 5, h = 1, position }: { w?: number; d?: number; h?: number; position?: V3 }) {
  return (
    <group position={position}>
      <mesh material={M.matteBlack()} position={[0, h / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      <mesh material={M.bulb("#ffd9a8", 1.6)} position={[0, h - 0.02, d / 2 + 0.005]}>
        <boxGeometry args={[w, 0.02, 0.01]} />
      </mesh>
    </group>
  );
}

/** Fire effect: crossed flame cards with a noise shader, plus rising embers. */
export function Fire({ position, width = 2.4, height = 1.4, intensity }: { position?: V3; width?: number; height?: number; intensity?: { current: number } }) {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        uniforms: { uTime: { value: 0 }, uPower: { value: 1 } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uPower; varying vec2 vUv;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
          float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
            return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
          float fbm(vec2 p){ float v=0.0; float a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5;} return v; }
          void main(){
            vec2 uv = vUv;
            float n = fbm(vec2(uv.x*6.0, uv.y*3.0 - uTime*2.2));
            float shape = smoothstep(0.0, 0.25, uv.x) * smoothstep(1.0, 0.75, uv.x);
            float h = (1.0 - uv.y) * 1.25 - (n - 0.45) * 0.9;
            float f = smoothstep(0.15, 0.65, h * shape);
            vec3 col = mix(vec3(1.0,0.22,0.02), vec3(1.0,0.78,0.35), smoothstep(0.4, 1.0, f));
            col = mix(col, vec3(1.0,0.95,0.8), smoothstep(0.85, 1.0, f));
            gl_FragColor = vec4(col * 2.2 * uPower, f * uPower);
          }
        `,
      }),
    [],
  );
  const embers = useMemo(() => {
    const g = new BufferGeometry();
    const n = 90;
    const p = new Float32Array(n * 3);
    const s = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      p[i * 3] = (Math.random() - 0.5) * width;
      p[i * 3 + 1] = Math.random() * height * 3;
      p[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
      s[i] = Math.random();
    }
    g.setAttribute("position", new BufferAttribute(p, 3));
    g.setAttribute("aSeed", new BufferAttribute(s, 1));
    return g;
  }, [width, height]);
  const emberMat = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uH: { value: height * 3 }, uPower: { value: 1 } },
        vertexShader: /* glsl */ `
          uniform float uTime; uniform float uH; attribute float aSeed; varying float vA;
          void main(){
            vec3 p = position;
            p.y = mod(p.y + uTime * (0.6 + aSeed), uH);
            p.x += sin(uTime * 1.3 + aSeed * 20.0) * 0.15;
            vA = 1.0 - p.y / uH;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (2.0 + aSeed * 3.0) * (8.0 / -mv.z);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uPower; varying float vA;
          void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(1.0, 0.55, 0.15, smoothstep(0.5, 0.0, d) * vA * uPower); }
        `,
      }),
    [height],
  );
  const pts = useRef<Points>(null);
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
    emberMat.uniforms.uTime.value += dt;
    const p = intensity ? intensity.current : 1;
    mat.uniforms.uPower.value = p;
    emberMat.uniforms.uPower.value = p;
  });
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} material={mat} position={[0, height / 2, 0]} rotation-y={(i * Math.PI) / 3} raycast={() => null}>
          <planeGeometry args={[width, height]} />
        </mesh>
      ))}
      <points ref={pts} geometry={embers} material={emberMat} raycast={() => null} />
    </group>
  );
}

/** Wireframe globe with glowing arcs between points (lat/lon in degrees). */
export function Globe({ position, radius = 1.6, points: pins, color = "#9cc3ff" }: { position?: V3; radius?: number; points: { lat: number; lon: number }[]; color?: string }) {
  const g = useRef<Object3D>(null);
  const arcGeo = useMemo(() => {
    const v = (lat: number, lon: number, r: number) => {
      const phi = ((90 - lat) * Math.PI) / 180;
      const th = ((lon + 180) * Math.PI) / 180;
      return [-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th)];
    };
    const pos: number[] = [];
    for (let i = 0; i < pins.length - 1; i++) {
      const a = pins[i];
      const b = pins[i + 1];
      const N = 40;
      for (let k = 0; k < N; k++) {
        for (const t of [k / N, (k + 1) / N]) {
          const lat = a.lat + (b.lat - a.lat) * t;
          const lon = a.lon + (b.lon - a.lon) * t;
          const lift = 1 + Math.sin(t * Math.PI) * 0.18;
          pos.push(...v(lat, lon, radius * lift));
        }
      }
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
    return { geo, pins: pins.map((p) => v(p.lat, p.lon, radius * 1.01) as V3) };
  }, [pins, radius]);
  const lineMat = useMemo(() => new MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.22, toneMapped: false }), [color]);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.12;
  });
  return (
    <group position={position}>
      <group ref={g as never}>
        <mesh material={lineMat}>
          <sphereGeometry args={[radius, 24, 16]} />
        </mesh>
        <lineSegments geometry={arcGeo.geo}>
          <lineBasicMaterial color={new Color("#ffcf8a").multiplyScalar(2)} toneMapped={false} />
        </lineSegments>
        {arcGeo.pins.map((p, i) => (
          <mesh key={i} position={p} material={M.bulb("#ffcf8a", 3)}>
            <sphereGeometry args={[0.04, 8, 6]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Instanced bulbs forming a chandelier ring. */
export function Chandelier({ position, radius = 1.2, on }: { position?: V3; radius?: number; on?: { current: number } }) {
  const strands = useMemo<[V3, V3][]>(() => {
    const out: [V3, V3][] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      out.push([
        [0, 0, 0],
        [Math.sin(a) * radius, -1.2, Math.cos(a) * radius],
      ]);
    }
    return out;
  }, [radius]);
  return (
    <group position={position}>
      <StringLights strands={strands} on={on} per={8} />
    </group>
  );
}
