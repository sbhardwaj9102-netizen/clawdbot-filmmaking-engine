"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, type Mesh, MeshBasicMaterial } from "three";

import { Hotspot } from "@/components/InteractiveObject/Hotspot";
import { ChoiceObject } from "@/components/StoryChoice/ChoiceObject";
import { LightShaft } from "@/components/World/LightShaft";
import { M } from "@/components/World/materials";
import { Cases, CinemaCamera, Clapperboard, FilmLight, Tripod } from "@/components/World/props/Film";
import { Binder, Lamp, Paper, ScaleModel, Table } from "@/components/World/props/Furniture";
import { Column, SlidingDoor, Truss, Wall } from "@/components/World/props/Architecture";
import { since, useWorldEvent } from "@/components/World/WorldContext";
import { screenplayTexture } from "@/lib/canvasTextures";
import { rt } from "@/systems/SceneManager/director";
import { clamp, damp, smoothstep } from "@/systems/SceneManager/space";
import { getStory } from "@/systems/StoryEngine/store";

/**
 * ARRIVAL — the studio. Black; a seam of light; a door that opens; a soundstage
 * powering up around a figure who walks to a table with a script on it.
 * When the story asks what comes after the story, three objects on the table
 * light up — and so do three doorways out into the dark.
 */
const PORTALS: { k: string; pos: [number, number, number]; rot: number; color: string }[] = [
  { k: "make", pos: [-13, 0, -3], rot: Math.PI / 2, color: "#ffb36b" },
  { k: "finance", pos: [2.4, 0, -17], rot: 0, color: "#8fb5ff" },
  { k: "build", pos: [13, 0, -3], rot: -Math.PI / 2, color: "#ffe0a3" },
];

export function StudioWorld() {
  const door = useRef({ current: 0 }).current;
  const seam = useRef<Mesh>(null);
  const seamMat = useMemo(
    () => new MeshBasicMaterial({ color: new Color("#ffe6c8").multiplyScalar(3), toneMapped: false, transparent: true, blending: AdditiveBlending, depthWrite: false }),
    [],
  );
  const reveal = useWorldEvent("reveal-choices");
  const glowScript = useWorldEvent("script-glow");
  const level = useRef({ make: { current: 0 }, finance: { current: 0 }, build: { current: 0 } }).current;
  const revealK = useRef(0);
  const portals = useRef<(MeshBasicMaterial | null)[]>([]);
  const scriptGlow = useRef<MeshBasicMaterial>(null);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = getStory();
    const t = s.phase === "intro" ? rt.intro.t : 99;
    door.current = smoothstep(3.3, 5.8, t);
    if (seam.current) {
      // a point of light that stretches into the door's seam, then floods as it opens
      const appear = smoothstep(0.7, 1.6, t);
      const stretch = smoothstep(1.3, 2.9, t);
      // the seam widens a little as the leaves part, then gives way to the lit studio behind
      seam.current.scale.set(0.035 + door.current * 0.6, 0.01 + stretch * 0.99, 1);
      seam.current.position.y = 0.02 + (6.5 / 2) * (0.35 + 0.65 * stretch);
      seamMat.opacity = appear * (1 - smoothstep(3.6, 4.6, t)) * (t > 50 ? 0 : 1);
    }
    const r = reveal ? clamp(since(reveal) / 1.8, 0, 1) : 0;
    revealK.current = damp(revealK.current, s.currentChoice && s.transition ? 0.6 : r, 3, dt);
    const keys = ["make", "finance", "build"] as const;
    keys.forEach((k, i) => {
      const m = portals.current[i];
      if (m) m.opacity = revealK.current * (0.35 + level[k].current * 0.65);
    });
    if (scriptGlow.current) {
      const g = glowScript ? clamp(since(glowScript) / 1.5, 0, 1) * (1 - r * 0.6) : 0;
      scriptGlow.current.opacity = g * 0.22;
    }
  });

  const pageMap = useMemo(() => screenplayTexture(), []);

  return (
    <group>
      {/* ── architecture ─────────────────────────────── */}
      <Wall position={[0, 0, 16.3]} w={38} h={13} opening={{ w: 4.6, h: 6.8 }} material="dark" />
      <SlidingDoor position={[0, 0, 16.05]} w={4.4} h={6.5} open={door} />
      <mesh ref={seam} position={[0, 3.25, 16.2]} material={seamMat}>
        <planeGeometry args={[1, 6.5]} />
      </mesh>
      <Wall position={[-19, 0, -2]} rotation={[0, Math.PI / 2, 0]} w={37} h={13} material="dark" />
      <Wall position={[19, 0, -2]} rotation={[0, -Math.PI / 2, 0]} w={37} h={13} material="dark" />
      <Wall position={[0, 0, -20.5]} w={38} h={13} material="dark" />
      {[12, 5, -10, -17].flatMap((z) => [-15.5, 15.5].map((x) => <Column key={`${x}${z}`} position={[x, 0, z]} h={13} w={0.9} />))}
      {/* high windows: cold moonlight */}
      {[-9, -1, 7].map((z) => (
        <group key={z}>
          <mesh position={[-18.8, 9.6, z]} rotation-y={Math.PI / 2} material={M.bulb("#9db6ff", 0.9)}>
            <planeGeometry args={[3.2, 2.2]} />
          </mesh>
          <group position={[-18.6, 10.2, z]} rotation={[0, 0, 0.85]}>
            <LightShaft length={13} radius={2.2} top={1.2} color="#9db6ff" opacity={0.07} />
          </group>
        </group>
      ))}
      {/* lighting grid */}
      {[8, 0, -8, -15].map((z) => (
        <Truss key={z} length={34} position={[0, 10.5, z]} />
      ))}
      <Truss length={30} position={[-13, 9, -2]} rotation={[0, Math.PI / 2, 0]} />
      <Truss length={30} position={[13, 9, -2]} rotation={[0, Math.PI / 2, 0]} />
      {/* hanging fresnels throwing pools of light */}
      {[
        [-7, 0],
        [7, -8],
        [-4, -15],
      ].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 10.2, z]}>
          <mesh material={M.matteBlack()} rotation-x={Math.PI}>
            <cylinderGeometry args={[0.2, 0.17, 0.4, 16]} />
          </mesh>
          <mesh material={M.bulb("#ffd4a4", 3)} position={[0, -0.21, 0]} rotation-x={Math.PI / 2}>
            <circleGeometry args={[0.17, 20]} />
          </mesh>
          <group position={[0, -0.22, 0]}>
            <LightShaft length={10} radius={2.6} top={0.17} color="#ffd4a4" opacity={0.08} />
          </group>
        </group>
      ))}

      {/* caged work lights along the walls — the scale of the room reads in the dark */}
      {[-12, -4, 4, 12].flatMap((z) =>
        [-18.7, 18.7].map((x) => (
          <group key={`${x}${z}`} position={[x, 3.2, z]}>
            <mesh material={M.bulb("#ffc58a", 2.6)}>
              <sphereGeometry args={[0.07, 10, 8]} />
            </mesh>
            <mesh material={M.blackMetal()} position={[x < 0 ? -0.08 : 0.08, 0, 0]}>
              <boxGeometry args={[0.04, 0.22, 0.22]} />
            </mesh>
          </group>
        )),
      )}
      <mesh position={[-18.7, 7.4, 10]} rotation-y={Math.PI / 2} material={M.bulb("#ff4433", 1.6)}>
        <planeGeometry args={[1.2, 0.36]} />
      </mesh>

      {/* ── the far stage: a cyc wall, a set flat, gear ── */}
      <mesh position={[12.5, 3.2, -19.6]} material={M.tinted("#3d434f", 0.95, 0)}>
        <planeGeometry args={[11, 8]} />
      </mesh>
      <group position={[-11, 0, -14]} rotation-y={0.5}>
        <Wall w={5} h={4} t={0.12} opening={{ w: 1.4, h: 2.2, x: 0.8 }} material="concrete" />
        <mesh position={[0.8, 1.6, -0.2]} material={M.bulb("#ffbf7a", 0.4)}>
          <planeGeometry args={[1.4, 2.2]} />
        </mesh>
      </group>
      <Cases position={[-13.5, 0, 6]} rotation={[0, 0.3, 0]} count={3} />
      <Cases position={[13, 0, 3]} rotation={[0, -0.6, 0]} count={2} />
      <FilmLight position={[-6.5, 0, 9]} rotation={[0, 2.5, 0]} height={2.4} tilt={0.35} shaftLength={7} />
      <FilmLight position={[7.5, 0, -12]} rotation={[0, -0.9, 0]} height={2.6} tilt={0.3} color="#cfe0ff" shaftLength={7} />
      <group position={[9, 0, 9]} rotation-y={-2.4}>
        <Tripod height={1.3}>
          <CinemaCamera />
        </Tripod>
      </group>

      {/* ── the production table ─────────────────────── */}
      <Table position={[0, 0, -4.2]} w={3.3} d={1.3} height={0.9} />
      <Lamp position={[0, 7.2, -4.2]} drop={3.2} shaftLength={6.3} />
      <Lamp kind="desk" position={[1.35, 0.9, -4.65]} />
      <mesh material={M.tinted("#151515", 0.4, 0.2)} position={[-1.4, 0.95, -3.85]}>
        <cylinderGeometry args={[0.04, 0.035, 0.1, 14]} />
      </mesh>

      <Hotspot id="script" labelOffset={0.25}>
        <group position={[0, 0.9, -3.75]} rotation-y={0.06}>
          <Paper map={pageMap} position={[0, 0, 0]} stack={60} w={0.215} h={0.28} />
          <mesh material={M.brushed()} position={[0.13, 0.08, 0.05]} rotation={[Math.PI / 2, 0, 0.6]}>
            <cylinderGeometry args={[0.004, 0.004, 0.17, 6]} />
          </mesh>
        </group>
        <mesh position={[0, 0.905, -3.75]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.9, 0.7]} />
          <meshBasicMaterial ref={scriptGlow} color="#ffd8a8" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </Hotspot>

      {/* the three choices */}
      <ChoiceObject question="after-story" option="make" level={level.make}>
        <Clapperboard position={[-1.1, 0.9, -4.35]} rotation={[-0.25, 0.25, 0]} label="MAKE IT" />
      </ChoiceObject>
      <ChoiceObject question="after-story" option="finance" level={level.finance}>
        <Binder kind="Production budget" title="Top sheet" position={[0, 0.9, -4.45]} rotation={[0, -0.05, 0]} />
      </ChoiceObject>
      <ChoiceObject question="after-story" option="build" level={level.build}>
        <ScaleModel position={[1.1, 0.9, -4.35]} rotation={[0, -0.3, 0]} scale={0.9} />
      </ChoiceObject>

      {/* doorways into the dark that answer each choice */}
      {PORTALS.map((p, i) => (
        <group key={p.k} position={p.pos} rotation-y={p.rot}>
          <mesh position={[0, 2.6, 0]}>
            <planeGeometry args={[2.6, 5.2]} />
            <meshBasicMaterial
              ref={(m) => void (portals.current[i] = m)}
              color={new Color(p.color).multiplyScalar(2.2)}
              transparent
              opacity={0}
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
      {/* light falling on each choice object once revealed */}
      {[-1.1, 0, 1.1].map((x) => (
        <RevealShaft key={x} x={x} k={revealK} />
      ))}
    </group>
  );
}

function RevealShaft({ x, k }: { x: number; k: { current: number } }) {
  return (
    <group position={[x, 4.6, -4.4]}>
      <LightShaft length={3.7} radius={0.45} top={0.05} color="#ffe2b8" opacity={0.18} level={k} />
    </group>
  );
}
