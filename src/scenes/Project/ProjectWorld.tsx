"use client";

import { useMemo } from "react";
import { MeshStandardMaterial } from "three";

import { M } from "@/components/World/materials";
import { Hills, Sign, SkyPlane, Wall } from "@/components/World/props/Architecture";
import { Lamp } from "@/components/World/props/Furniture";
import { StringLights } from "@/components/World/props/Live";
import { LightShaft } from "@/components/World/LightShaft";
import { Assemble, useWorld } from "@/components/World/WorldContext";
import { getProject, type Project } from "@/data/projects";
import { canvasTexture } from "@/lib/canvasTextures";

import { endZ, stations } from "./layout";
import { Station } from "./Stations";

/**
 * A FILM'S WORLD — entered through its monitor. The environment is the film's
 * (ASTER: a road through layered hills at dusk; HOUSE OF PURPLE: violet rooms;
 * RANA: dusty arches; GLUTTONY: a crimson banquet hall), and the production
 * material is staged inside it as things you walk up to.
 */
export function ProjectWorld() {
  const { scene } = useWorld();
  const project = getProject(scene.project ?? scene.id)!;
  const placed = stations(project);
  const end = endZ(project);
  return (
    <group>
      <Assemble delay={0}>
        <Environment project={project} end={end} />
      </Assemble>
      <Assemble delay={0.1} from={-1}>
        <Sign
          text={project.titleLines ? project.titleLines.join(" ") : project.title}
          sub={`${project.role} · ${project.format}${project.scale ? ` · ${project.scale}` : ""}`}
          width={project.title.length > 12 ? 9 : 6}
          size={170}
          tracking={0.06}
          position={[0, 4.6, -2]}
          opacity={0.92}
        />
      </Assemble>
      {placed.map((p, i) => (
        <Assemble key={p.section.kind} delay={0.2 + i * 0.12}>
          <Station project={project} placement={p} />
        </Assemble>
      ))}
      {/* end gate */}
      <Assemble delay={0.4}>
        <group position={[0, 0, end - 4.6]}>
          {[-1.6, 1.6].map((x) => (
            <mesh key={x} material={M.bulb(project.accent, 1.4)} position={[x, 2.2, 0]}>
              <boxGeometry args={[0.05, 4.4, 0.05]} />
            </mesh>
          ))}
          <mesh material={M.bulb(project.accent, 1.4)} position={[0, 4.4, 0]}>
            <boxGeometry args={[3.25, 0.05, 0.05]} />
          </mesh>
        </group>
      </Assemble>
    </group>
  );
}

function Environment({ project, end }: { project: Project; end: number }) {
  switch (project.theme) {
    case "aster":
      return <AsterLand end={end} />;
    case "purple":
      return <PurpleHouse end={end} />;
    case "rana":
      return <RanaArches end={end} />;
    case "gluttony":
      return <GluttonyHall end={end} />;
  }
}

/** Ground plane covering the stage floor, so each film has its own terrain. */
function Ground({ color, end, roughness = 0.95 }: { color: string; end: number; roughness?: number }) {
  const mat = useMemo(() => new MeshStandardMaterial({ color, roughness, metalness: 0 }), [color, roughness]);
  return (
    <mesh material={mat} position={[0, 0.004, end / 2]} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[220, 220 + Math.abs(end)]} />
    </mesh>
  );
}

function AsterLand({ end }: { end: number }) {
  const dash = useMemo(
    () =>
      canvasTexture(
        "road-dash",
        64,
        512,
        (ctx, w, h) => {
          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = "rgba(240,225,190,0.55)";
          ctx.fillRect(w / 2 - 3, 0, 6, h * 0.45);
        },
        true,
      ),
    [],
  );
  const dashMat = useMemo(() => {
    const t = dash.clone();
    t.needsUpdate = true;
    t.repeat.set(1, 18);
    return new MeshStandardMaterial({ map: t, transparent: true, roughness: 0.8, depthWrite: false });
  }, [dash]);
  const layers = useMemo(
    () => [
      { z: end - 30, height: 5, color: "#16141b", seed: 1 },
      { z: end - 48, height: 9, color: "#221e29", seed: 2 },
      { z: end - 70, height: 14, color: "#352d3c", seed: 3 },
      { z: end - 95, height: 20, color: "#54464f", seed: 4 },
      { z: end - 125, height: 28, color: "#7a6461", seed: 5, width: 360 },
    ],
    [end],
  );
  return (
    <group>
      <Ground color="#141218" end={end} roughness={0.9} />
      <SkyPlane position={[0, 30, end - 150]} w={600} h={190} top="#26304d" bottom="#d4925e" sun={{ x: 0.52, y: 0.78, color: "rgba(255,214,160,1)", size: 0.22 }} />
      <Hills layers={layers} />
      {/* the road */}
      <mesh material={M.tinted("#0f0f11", 0.85, 0)} position={[0, 0.008, end / 2 - 20]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[4.2, Math.abs(end) + 70]} />
      </mesh>
      <mesh material={dashMat} position={[0, 0.012, end / 2 - 20]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.4, Math.abs(end) + 70]} />
      </mesh>
      {/* low mist banks */}
      {[end - 18, end - 36, end - 60].map((z, i) => (
        <group key={z} position={[i % 2 ? 8 : -8, 0.2, z]} rotation-z={Math.PI / 2}>
          <LightShaft length={60} radius={4} top={4} color="#c9b7c8" opacity={0.05} />
        </group>
      ))}
    </group>
  );
}

function PurpleHouse({ end }: { end: number }) {
  const zs = useMemo(() => Array.from({ length: Math.ceil(Math.abs(end) / 6) + 1 }, (_, i) => -2 - i * 6), [end]);
  return (
    <group>
      <Ground color="#1b1422" end={end} roughness={0.5} />
      {[-6.4, 6.4].map((x) => (
        <group key={x}>
          {zs.map((z, i) => (
            <Wall
              key={z}
              position={[x, 0, z]}
              rotation={[0, Math.PI / 2, 0]}
              w={6}
              h={4.6}
              t={0.2}
              opening={i % 2 ? { w: 1.4, h: 2.6, x: 0 } : undefined}
              material="concrete"
            />
          ))}
        </group>
      ))}
      {zs.filter((_, i) => i % 2).map((z) => (
        <group key={z}>
          <mesh material={M.bulb("#b9a2ff", 1.2)} position={[-6.55, 1.3, z]} rotation-y={Math.PI / 2}>
            <planeGeometry args={[1.4, 2.6]} />
          </mesh>
          <mesh material={M.bulb("#ffc98f", 0.9)} position={[6.55, 1.3, z]} rotation-y={-Math.PI / 2}>
            <planeGeometry args={[1.4, 2.6]} />
          </mesh>
        </group>
      ))}
      {zs.filter((_, i) => i % 2 === 0).map((z) => (
        <Lamp key={z} position={[0, 4.4, z]} drop={0.6} color="#ffc28a" shaftLength={4.2} />
      ))}
      <mesh material={M.tinted("#2a1d3a", 0.95, 0)} position={[0, 4.62, end / 2]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[13, Math.abs(end) + 12]} />
      </mesh>
    </group>
  );
}

function RanaArches({ end }: { end: number }) {
  const zs = useMemo(() => Array.from({ length: Math.ceil(Math.abs(end) / 4.5) + 1 }, (_, i) => -1 - i * 4.5), [end]);
  const sand = M.tinted("#6b5235", 0.95, 0);
  return (
    <group>
      <Ground color="#2a2016" end={end} />
      <SkyPlane position={[0, 25, end - 110]} w={500} h={160} top="#3a2a18" bottom="#c8925a" sun={{ x: 0.4, y: 0.7, color: "rgba(255,200,130,1)", size: 0.18 }} />
      {/* distant fort */}
      <group position={[-10, 0, end - 70]}>
        {[-12, -4, 4, 12].map((x, i) => (
          <mesh key={x} material={M.tinted("#2d2116", 1, 0)} position={[x, 6 + (i % 2) * 3, 0]}>
            <boxGeometry args={[4, 12 + (i % 2) * 6, 4]} />
          </mesh>
        ))}
        <mesh material={M.tinted("#2d2116", 1, 0)} position={[0, 4, 0]}>
          <boxGeometry args={[30, 8, 3]} />
        </mesh>
      </group>
      {[-5.6, 5.6].map((x) =>
        zs.map((z) => (
          <group key={`${x}${z}`} position={[x, 0, z]}>
            <mesh material={sand} position={[0, 2.2, 0]} castShadow>
              <boxGeometry args={[0.7, 4.4, 0.7]} />
            </mesh>
            <mesh material={sand} position={[0, 4.4, -2.25]} rotation-y={Math.PI / 2}>
              <torusGeometry args={[1.9, 0.3, 6, 16, Math.PI]} />
            </mesh>
          </group>
        )),
      )}
    </group>
  );
}

function GluttonyHall({ end }: { end: number }) {
  const len = Math.abs(end) + 6;
  const strands = useMemo<[[number, number, number], [number, number, number]][]>(
    () => Array.from({ length: Math.ceil(len / 6) }, (_, i) => [[-7, 4.2, -2 - i * 6], [7, 4.2, -2 - i * 6]]),
    [len],
  );
  const drape = M.tinted("#4a0f0b", 0.95, 0);
  return (
    <group>
      <Ground color="#1c0907" end={end} roughness={0.4} />
      {[-7.4, 7.4].map((x) => (
        <mesh key={x} material={drape} position={[x, 3, end / 2]} rotation-y={x < 0 ? Math.PI / 2 : -Math.PI / 2}>
          <planeGeometry args={[len + 8, 6]} />
        </mesh>
      ))}
      {/* a long banquet table running the hall */}
      <group position={[0, 0, end - 8]}>
        <mesh material={M.tinted("#e8dfd0", 0.9, 0)} position={[0, 0.76, 0]}>
          <boxGeometry args={[1.6, 0.04, 12]} />
        </mesh>
        <mesh material={M.tinted("#5a120d", 0.9, 0)} position={[0, 0.38, 0]}>
          <boxGeometry args={[1.5, 0.74, 11.8]} />
        </mesh>
        <StringLights strands={[[[0, 1.0, -5.5], [0, 1.0, 5.5]]]} per={14} color="#ffb070" />
      </group>
      <StringLights strands={strands} color="#ff9a5c" per={18} />
    </group>
  );
}
