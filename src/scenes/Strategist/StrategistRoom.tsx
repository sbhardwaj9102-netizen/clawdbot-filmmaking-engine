"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  type InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
} from "three";

import { Clickable } from "@/components/InteractiveObject/Hotspot";
import { M } from "@/components/World/materials";
import { GlassWall } from "@/components/World/props/Architecture";
import { Binder, Chair, Lamp, Table, UIScreen } from "@/components/World/props/Furniture";
import { Globe } from "@/components/World/props/Live";
import { T, themedInk } from "@/components/World/themed";
import { chartTexture, gradientTexture, rand, textTexture, windowsTexture } from "@/lib/canvasTextures";
import { clamp } from "@/lib/math";
import { CHAIN, chainTexture } from "@/lib/storyTextures";
import { STAGE } from "@/systems/Experience/choreography";
import { rt } from "@/systems/Experience/runtime";
import { useExperience } from "@/systems/Experience/store";
import { goExplore } from "@/systems/Experience/tour";

/**
 * ROOM 2 — THE STRATEGIST
 * A glass office above a city: the long table with the academic work on it,
 * a globe tracing India, Singapore and the UAE, and a wall display that
 * walks from production to finance one link at a time.
 */
export function StrategistRoom() {
  const strategy = useExperience((s) => s.mode === "explore" && s.section === "strategy");
  return (
    <group>
      <Shell />
      <City />
      <Clickable id="table" label="Strategy" verb="Open" active={strategy} labelAt={[STAGE.table.x, 1.8, STAGE.table.z]} onSelect={() => goExplore("strategy")}>
        <Workspace />
        <FinanceDisplay />
      </Clickable>
      <group position={[STAGE.globe.x, 0, STAGE.globe.z]}>
        <mesh material={M.blackMetal()} position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.22, 0.3, 1, 20]} />
        </mesh>
        <Globe
          position={[0, 1.95, 0]}
          radius={0.85}
          points={[
            { lat: 25.24, lon: 86.98 },
            { lat: 1.35, lon: 103.82 },
            { lat: 25.2, lon: 55.27 },
          ]}
        />
      </group>
    </group>
  );
}

function Shell() {
  const title = useMemo(() => textTexture("THE STRATEGIST", { font: "mono", size: 120, tracking: 0.3, w: 2048, h: 256, color: "#ffffff" }), []);
  const plaque = useMemo(
    () => textTexture("MASTER OF GLOBAL BUSINESS — GLOBAL FINANCE · SP JAIN", { font: "mono", size: 56, tracking: 0.16, w: 2048, h: 256, color: "#ffffff" }),
    [],
  );
  return (
    <group>
      {/* raised floor */}
      <mesh material={T.platform()} position={[19.2, 0.03, -2.4]} receiveShadow>
        <boxGeometry args={[13.6, 0.06, 10.4]} />
      </mesh>
      <GlassWall w={13.6} h={5.4} panes={7} position={[19.2, 0.06, -7.6]} />
      {/* the wall above the glass, up into the dark */}
      <mesh material={T.wallCool()} position={[19.2, 5.46 + 4.3, -7.7]}>
        <boxGeometry args={[13.8, 8.6, 0.2]} />
      </mesh>
      {/* the end wall, with the room's name */}
      <mesh material={T.wallCool()} position={[26.1, 7, -2.3]} rotation-y={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[10.8, 14]} />
      </mesh>
      <mesh material={themedInk(title, "#ece6da", "#1d2530", 0.6)} position={[26.05, 5.55, -2.3]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[5.2, 0.65]} />
      </mesh>
      <mesh material={themedInk(plaque, "#bcd0ff", "#2f5f9e", 0.75)} position={[26.05, 4.95, -2.3]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[4.6, 0.575]} />
      </mesh>
      {/* a ceiling beam line over the table */}
      <mesh material={T.trim()} position={[18.6, 5.5, -2.2]}>
        <boxGeometry args={[6, 0.08, 0.12]} />
      </mesh>
      {[-1.6, 0, 1.6].map((dx) => (
        <Lamp key={dx} position={[STAGE.table.x + dx, 3.9, STAGE.table.z]} drop={1.6} color="#ffe7c8" shaftLength={2.6} />
      ))}
    </group>
  );
}

function Workspace() {
  const chart = useMemo(() => chartTexture(31, "#8fb8ff", "ANALYSIS"), []);
  return (
    <group>
      <Table position={[STAGE.table.x, 0.06, STAGE.table.z]} w={4.4} d={1.4} height={0.78} material="walnut" />
      {[-1.4, 0, 1.4].map((dx) => (
        <Chair key={`b${dx}`} position={[STAGE.table.x + dx, 0.06, STAGE.table.z - 1.05]} rotation={[0, 0, 0]} />
      ))}
      {[-1.2, 1.2].map((dx) => (
        <Chair key={`f${dx}`} position={[STAGE.table.x + dx, 0.06, STAGE.table.z + 1.05]} rotation={[0, Math.PI, 0]} />
      ))}
      <UIScreen map={chart} w={0.62} h={0.38} position={[STAGE.table.x - 0.3, 0.98, STAGE.table.z - 0.2]} rotation={[0, 0.15, 0]} />
      <Binder kind="ACADEMIC PROJECT" title="ARIHANT PLUS · UAE" color="#1a2a44" position={[STAGE.table.x + 0.9, 0.85, STAGE.table.z + 0.15]} rotation={[0, -0.2, 0]} />
      <Binder kind="ACADEMIC PROJECT" title="INDUSTRY BUSINESS RESEARCH" color="#3a2a1a" position={[STAGE.table.x - 1.4, 0.85, STAGE.table.z + 0.25]} rotation={[0, 0.25, 0]} />
    </group>
  );
}

/** The wall display: production → cost → operations → business → finance, lighting in turn. */
function FinanceDisplay() {
  const base = useMemo(() => chainTexture(false), []);
  const lit = useMemo(() => chainTexture(true), []);
  const W = 5.6;
  const H = (W * CHAIN.h) / CHAIN.w;
  const baseMat = useMemo(() => new MeshBasicMaterial({ map: base, toneMapped: false }), [base]);
  const litMats = useMemo(
    () =>
      CHAIN.words.map(
        () => new MeshBasicMaterial({ map: lit, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }),
      ),
    [lit],
  );
  // one quad per link, mapped onto its box in the lit texture
  const quads = useMemo(
    () =>
      CHAIN.words.map((_, i) => {
        const b = CHAIN.box(i);
        const g = new PlaneGeometry((b.w / CHAIN.w) * W, (b.h / CHAIN.h) * H);
        const uv = g.attributes.uv;
        for (let k = 0; k < uv.count; k++) {
          uv.setXY(k, (b.x + uv.getX(k) * b.w) / CHAIN.w, 1 - (b.y + (1 - uv.getY(k)) * b.h) / CHAIN.h);
        }
        uv.needsUpdate = true;
        const cx = ((b.x + b.w / 2) / CHAIN.w - 0.5) * W;
        const cy = (0.5 - (b.y + b.h / 2) / CHAIN.h) * H;
        return { g, cx, cy };
      }),
    [H],
  );
  useEffect(
    () => () => {
      baseMat.dispose();
      litMats.forEach((m) => m.dispose());
      quads.forEach((q) => q.g.dispose());
    },
    [baseMat, litMats, quads],
  );
  useFrame(() => {
    const level = 0.45 + 0.55 * rt.rooms.strategist;
    baseMat.color.setScalar(level);
    litMats.forEach((m, i) => {
      m.opacity = clamp(rt.env.steps - i, 0, 1);
      m.color.setScalar(level * 1.1);
    });
  });
  return (
    <group position={[STAGE.display.x, 2.35, STAGE.display.z]} rotation-y={-Math.PI / 2}>
      <mesh material={M.matteBlack()} position={[0, 0, -0.05]}>
        <boxGeometry args={[W + 0.2, H + 0.2, 0.08]} />
      </mesh>
      <mesh material={baseMat}>
        <planeGeometry args={[W, H]} />
      </mesh>
      {quads.map((q, i) => (
        <mesh key={i} geometry={q.g} material={litMats[i]} position={[q.cx, q.cy, 0.004]} />
      ))}
    </group>
  );
}

const COUNT = 80;

/** The city beyond the glass: lit towers by night, a pale skyline by day; a sky that turns with the theme. */
function City() {
  const ref = useRef<InstancedMesh>(null);
  const geo = useMemo(() => new BoxGeometry(1, 1, 1).translate(0, 0.5, 0), []);
  const mat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#0a0d14",
        emissive: new Color("#ffffff"),
        emissiveMap: windowsTexture(17),
        emissiveIntensity: 1,
        roughness: 0.8,
        metalness: 0.2,
        // a backdrop: crisp beyond the glass rather than swallowed by the studio haze
        fog: false,
      }),
    [],
  );
  const sky = useMemo(
    () =>
      new ShaderMaterial({
        depthWrite: false,
        fog: false,
        uniforms: { uDay: { value: 0 } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uDay; varying vec2 vUv;
          void main(){
            vec3 nightTop = vec3(0.02,0.03,0.06), nightLow = vec3(0.10,0.12,0.18), dusk = vec3(0.42,0.26,0.16);
            vec3 dayTop = vec3(0.62,0.74,0.88), dayLow = vec3(0.92,0.94,0.96);
            vec3 night = mix(nightLow, nightTop, smoothstep(0.0, 0.9, vUv.y)) + dusk * pow(1.0 - vUv.y, 6.0) * 0.6;
            vec3 day = mix(dayLow, dayTop, smoothstep(0.0, 1.0, vUv.y));
            gl_FragColor = vec4(mix(night, day, uDay), 1.0);
          }`,
      }),
    [],
  );
  const glow = useMemo(
    () => new MeshBasicMaterial({ color: "#ffb36b", transparent: true, opacity: 0.12, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
    [],
  );
  // low mist the city stands in, in the room's own air colour
  const haze = useMemo(
    () =>
      new MeshBasicMaterial({
        map: gradientTexture(
          [
            [0, "rgba(255,255,255,0)"],
            [0.55, "rgba(255,255,255,0.55)"],
            [1, "rgba(255,255,255,1)"],
          ],
          "cityhaze",
        ),
        transparent: true,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    [],
  );
  const night = useMemo(() => new Color("#0a0d14"), []);
  const day = useMemo(() => new Color("#aab3bd"), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const r = rand(77);
    const o = new Object3D();
    for (let i = 0; i < COUNT; i++) {
      const x = 19 + (r() - 0.5) * 110;
      const z = -38 - Math.pow(r(), 0.8) * 95;
      const w = 4 + r() * 9;
      const h = 8 + Math.pow(r(), 1.7) * 24 * (0.6 + (-z - 38) / 95);
      o.position.set(x, -0.2, z);
      o.rotation.set(0, r() * 0.4, 0);
      o.scale.set(w, h, 4 + r() * 8);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
      sky.dispose();
      glow.dispose();
      haze.dispose();
    },
    [geo, mat, sky, glow, haze],
  );
  useFrame(() => {
    const d = rt.look.theme;
    sky.uniforms.uDay.value = d;
    mat.color.copy(night).lerp(day, d);
    mat.emissiveIntensity = (1 - d) * (0.2 + 0.3 * rt.rooms.strategist);
    glow.opacity = 0.1 * (1 - d);
    haze.color.copy(rt.look.palette.fog);
  });
  return (
    <group>
      <mesh material={sky} position={[19, 40, -150]} renderOrder={-1}>
        <planeGeometry args={[420, 120]} />
      </mesh>
      <mesh material={glow} position={[19, 6, -40]}>
        <planeGeometry args={[160, 14]} />
      </mesh>
      <instancedMesh ref={ref} args={[geo, mat, COUNT]} frustumCulled={false} raycast={() => null} />
      <mesh material={haze} position={[19, 7, -36]} renderOrder={1}>
        <planeGeometry args={[150, 15]} />
      </mesh>
    </group>
  );
}
