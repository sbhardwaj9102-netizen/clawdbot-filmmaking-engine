"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { MeshStandardMaterial } from "three";

import { Hotspot, useHotspotGlow } from "@/components/InteractiveObject/Hotspot";
import { M } from "@/components/World/materials";
import { Sign } from "@/components/World/props/Architecture";
import { Monitor } from "@/components/World/props/Film";
import { Board, Pinned, Table } from "@/components/World/props/Furniture";
import { Crowd, Fire } from "@/components/World/props/Live";
import { Photo } from "@/components/World/props/Photo";
import type { Project, ProjectSection } from "@/data/projects";
import { canvasTexture, FONT, mapTexture, stripboardTexture } from "@/lib/canvasTextures";

import type { StationPlacement } from "./layout";

/**
 * Stations — each section of a project, staged as a physical thing in its world.
 * Station-local space: the station faces +Z (toward the path), origin on the floor.
 */
export function Station({ project, placement }: { project: Project; placement: StationPlacement }) {
  const { section, side, z } = placement;
  const id = `${project.scene}-${section.kind}`;
  const rot = side === -1 ? Math.PI / 2 : -Math.PI / 2;
  const accent = project.accent;
  return (
    <Hotspot id={id} labelOffset={0.2}>
      <group position={[side * 3.3, 0, z]} rotation-y={rot}>
        <StationBody project={project} section={section} accent={accent} />
        <Sign
          text={section.title.toUpperCase()}
          sub={section.kicker}
          font="mono"
          width={2.2}
          size={110}
          tracking={0.22}
          position={[0, 3.25, 0.2]}
          opacity={0.85}
        />
      </group>
    </Hotspot>
  );
}

function numberFact(section: ProjectSection, re: RegExp, fallback: number) {
  const f = section.facts?.find((x) => re.test(x.label));
  const n = f ? parseInt(f.value, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function StationBody({ project, section, accent }: { project: Project; section: ProjectSection; accent: string }) {
  switch (section.kind) {
    case "production":
      return <Slate project={project} section={section} accent={accent} />;
    case "locations":
      return <MapTable section={section} accent={accent} />;
    case "schedule":
      return <Stripboard section={section} />;
    case "crew":
      return <CrewBriefing section={section} />;
    case "bts":
      return <Clothesline section={section} />;
    case "stills":
      return <FrameWall section={section} />;
    case "sets":
      return <SetRooms section={section} />;
    case "fire":
      return <FireSequence section={section} />;
    case "video":
      return <Monitor src={section.media[0].src} video={section.media[0].video} position={[0, 0, 0]} w={1.8} h={1.01} />;
    default:
      return <Photo src={section.media[0]?.src ?? project.cover.src} w={1.6} position={[0, 1.6, 0]} />;
  }
}

/** The film's slate: title and the facts that are known, on a tall lit panel. */
function Slate({ project, section, accent }: { project: Project; section: ProjectSection; accent: string }) {
  const tex = useMemo(
    () =>
      canvasTexture(`slate-panel:${project.slug}`, 640, 1000, (ctx, w, h) => {
        ctx.fillStyle = "#0d0d0f";
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(236,230,218,.18)";
        ctx.lineWidth = 2;
        ctx.strokeRect(24, 24, w - 48, h - 48);
        ctx.fillStyle = accent;
        ctx.font = `500 22px ${FONT.mono}`;
        ctx.fillText(`${project.number} — ${project.format.toUpperCase()}`, 56, 92);
        ctx.fillStyle = "#ece6da";
        const lines = project.titleLines ?? [project.title];
        ctx.font = `400 ${lines.length > 1 ? 66 : 120}px ${FONT.serif}`;
        lines.forEach((l, i) => ctx.fillText(l, 52, 210 + i * 76));
        let y = lines.length > 1 ? 420 : 380;
        ctx.fillStyle = "rgba(236,230,218,.2)";
        ctx.fillRect(56, y - 40, w - 112, 1);
        for (const f of section.facts ?? project.facts) {
          ctx.fillStyle = "rgba(236,230,218,.55)";
          ctx.font = `500 20px ${FONT.mono}`;
          ctx.fillText(f.label.toUpperCase(), 56, y);
          ctx.fillStyle = "#ece6da";
          ctx.font = `400 46px ${FONT.serif}`;
          ctx.fillText(f.value, 56, y + 54);
          y += 120;
        }
      }),
    [project, section, accent],
  );
  const mat = useMemo(() => new MeshStandardMaterial({ map: tex, emissive: "#ffffff", emissiveMap: tex, emissiveIntensity: 0.55, roughness: 0.7 }), [tex]);
  const glow = useHotspotGlow();
  useFrame(() => {
    mat.emissiveIntensity = 0.45 + glow.value * 0.35;
  });
  return (
    <group>
      <mesh material={M.matteBlack()} position={[-0.55, 1.35, -0.06]}>
        <boxGeometry args={[1.5, 2.6, 0.1]} />
      </mesh>
      <mesh material={mat} position={[-0.55, 1.35, 0]}>
        <planeGeometry args={[1.4, 2.19]} />
      </mesh>
      {section.media[0] && <Photo src={section.media[0].src} w={1.3} position={[1.05, 1.65, -0.1]} rotation={[0, -0.25, 0]} frame="black" />}
      {section.media[1] && <Photo src={section.media[1].src} w={0.9} position={[1.15, 0.85, 0.05]} rotation={[0, -0.25, 0]} frame="print" />}
    </group>
  );
}

/** Map table with numbered pins; location prints stand behind it like transparencies. */
function MapTable({ section, accent }: { section: ProjectSection; accent: string }) {
  const pins = numberFact(section, /location/i, section.media.length);
  const map = useMemo(() => mapTexture(pins, 11, accent), [pins, accent]);
  const mat = useMemo(() => new MeshStandardMaterial({ map, emissive: "#ffffff", emissiveMap: map, emissiveIntensity: 0.35, roughness: 0.8 }), [map]);
  return (
    <group>
      <Table w={2.1} d={1.3} height={0.92} material="steel" />
      <mesh material={mat} position={[0, 0.93, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1.95, 1.2]} />
      </mesh>
      {section.media.slice(0, 4).map((m, i) => (
        <group key={m.src} position={[-1.5 + i * 1.0, 0, -1.2 - Math.abs(i - 1.5) * 0.25]} rotation-y={(1.5 - i) * 0.12}>
          <mesh material={M.blackMetal()} position={[0, 0.9, -0.02]}>
            <cylinderGeometry args={[0.012, 0.012, 1.8, 6]} />
          </mesh>
          <Photo src={m.src} w={0.92} position={[0, 1.75, 0]} frame="none" brightness={0.95} />
        </group>
      ))}
    </group>
  );
}

/** A stripboard on the wall — one block per shoot day. */
function Stripboard({ section }: { section: ProjectSection }) {
  const days = numberFact(section, /day/i, 4);
  const map = useMemo(() => stripboardTexture(days), [days]);
  const mat = useMemo(() => new MeshStandardMaterial({ map, emissive: "#ffffff", emissiveMap: map, emissiveIntensity: 0.4, roughness: 0.6 }), [map]);
  return (
    <group>
      <Board w={2.8} h={1.5} position={[0, 1.7, 0]} kind="black">
        <mesh material={mat} position={[0, 0, 0.003]}>
          <planeGeometry args={[2.7, 1.35]} />
        </mesh>
      </Board>
      {section.media[0] && <Pinned src={section.media[0].src} w={0.7} position={[1.75, 1.2, 0.05]} rotation={[0, -0.2, 0]} />}
    </group>
  );
}

/** A crew briefing: lightboxes of the unit and a ring of silhouettes. */
function CrewBriefing({ section }: { section: ProjectSection }) {
  const spots = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const a = -0.9 + (i / 5) * 1.8;
        return { x: Math.sin(a) * 1.5, z: -0.4 + Math.cos(a) * 0.9 - 0.4, yaw: Math.PI + a * 0.8 };
      }),
    [],
  );
  return (
    <group>
      {section.media.slice(0, 2).map((m, i) => (
        <Photo key={m.src} src={m.src} w={1.35} position={[-0.75 + i * 1.5, 2.0, -1.4]} rotation={[0, (0.5 - i) * 0.3, 0]} frame="black" />
      ))}
      <Crowd spots={spots} color="#0e0e11" seed={4} />
    </group>
  );
}

/** Behind-the-scenes prints hung on a wire between two poles. */
function Clothesline({ section }: { section: ProjectSection }) {
  const items = section.media.slice(0, 6);
  const span = 4.2;
  const g = useRef<Array<{ rotation: { z: number } } | null>>([]);
  useFrame(({ clock }) => {
    g.current.forEach((el, i) => {
      if (el) el.rotation.z = Math.sin(clock.elapsedTime * 0.8 + i) * 0.03;
    });
  });
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} material={M.blackMetal()} position={[(s * span) / 2, 1.15, 0]}>
          <cylinderGeometry args={[0.02, 0.025, 2.3, 8]} />
        </mesh>
      ))}
      <mesh material={M.brushed()} position={[0, 2.22, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.004, 0.004, span, 4]} />
      </mesh>
      {items.map((m, i) => {
        const x = -span / 2 + 0.38 + (i * (span - 0.76)) / Math.max(1, items.length - 1);
        return (
          <group key={m.src} position={[x, 2.2, 0]} ref={(el) => void (g.current[i] = el)}>
            <Photo src={m.src} w={0.6} position={[0, -0.22, 0]} border={0.025} />
            <mesh material={M.tinted("#3a2a1a", 0.8, 0)} position={[0, -0.02, 0.01]}>
              <boxGeometry args={[0.03, 0.06, 0.02]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Stills as a lit wall of frames. */
function FrameWall({ section }: { section: ProjectSection }) {
  const items = section.media;
  const wide = items.length > 4;
  const cols = 4;
  const fw = 1.12;
  const aspect = wide ? 2.39 : 16 / 9;
  const rows = Math.ceil(items.length / cols);
  const fh = fw / aspect;
  return (
    <group>
      <mesh material={M.matteBlack()} position={[0, 2.0, -0.08]}>
        <boxGeometry args={[cols * (fw + 0.12) + 0.2, rows * (fh + 0.14) + 0.3, 0.08]} />
      </mesh>
      {items.map((m, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        return <Photo key={m.src} src={m.src} w={fw} aspect={aspect} frame="none" position={[(c - (cols - 1) / 2) * (fw + 0.12), 2.0 + ((rows - 1) / 2 - r) * (fh + 0.14), 0]} />;
      })}
    </group>
  );
}

/** Four constructed sets as four lit rooms. */
function SetRooms({ section }: { section: ProjectSection }) {
  const rooms = section.media.filter((m) => /^SET/.test(m.label ?? "")).slice(0, 4);
  const rest = section.media.filter((m) => !rooms.includes(m));
  const rw = 1.1;
  return (
    <group>
      {rooms.map((m, i) => (
        <group key={m.src} position={[(i - 1.5) * (rw + 0.12), 0, -0.3]}>
          <mesh material={M.tinted("#18121f", 0.9, 0)} position={[0, 1.5, -0.55]}>
            <boxGeometry args={[rw + 0.1, 1.9, 0.05]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} material={M.tinted("#120d18", 0.9, 0)} position={[(s * (rw + 0.1)) / 2, 1.5, -0.1]}>
              <boxGeometry args={[0.05, 1.9, 0.9]} />
            </mesh>
          ))}
          <mesh material={M.tinted("#120d18", 0.9, 0)} position={[0, 2.47, -0.1]}>
            <boxGeometry args={[rw + 0.15, 0.05, 0.9]} />
          </mesh>
          <Photo src={m.src} w={rw} h={1.55} position={[0, 1.4, -0.52]} frame="none" />
          <mesh material={M.bulb("#ffcf94", 2)} position={[0.3, 2.2, -0.2]}>
            <sphereGeometry args={[0.025, 8, 6]} />
          </mesh>
          <Sign text={m.label ?? ""} font="mono" width={0.7} size={90} tracking={0.3} position={[0, 0.5, 0.36]} opacity={0.6} />
        </group>
      ))}
      {rest.slice(0, 2).map((m, i) => (
        <Pinned key={m.src} src={m.src} w={0.6} position={[2.75, 1.7 - i * 0.55, 0]} rotation={[0, -0.3, 0]} />
      ))}
    </group>
  );
}

/** A controlled fire: a hut frame burning behind a marked exclusion line, extinguishers on standby. */
function FireSequence({ section }: { section: ProjectSection }) {
  const stripes = useMemo(
    () =>
      canvasTexture("hazard", 256, 32, (ctx, w, h) => {
        ctx.fillStyle = "#e8c12e";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#111";
        for (let x = -32; x < w; x += 32) {
          ctx.beginPath();
          ctx.moveTo(x, h);
          ctx.lineTo(x + 16, 0);
          ctx.lineTo(x + 32, 0);
          ctx.lineTo(x + 16, h);
          ctx.fill();
        }
      }),
    [],
  );
  const flame = useRef({ current: 1 }).current;
  useFrame(({ clock }) => {
    flame.current = 0.85 + Math.sin(clock.elapsedTime * 7) * 0.08 + Math.sin(clock.elapsedTime * 13.3) * 0.05;
  });
  return (
    <group>
      {/* hut frame */}
      <group position={[0, 0, -1.6]}>
        {[-0.9, 0.9].map((x) => (
          <group key={x}>
            <mesh material={M.darkWood()} position={[x, 0.9, 0.45]} rotation-z={x > 0 ? 0.45 : -0.45}>
              <boxGeometry args={[0.07, 2.0, 0.07]} />
            </mesh>
            <mesh material={M.darkWood()} position={[x, 0.9, -0.45]} rotation-z={x > 0 ? 0.45 : -0.45}>
              <boxGeometry args={[0.07, 2.0, 0.07]} />
            </mesh>
          </group>
        ))}
        <mesh material={M.darkWood()} position={[0, 1.78, 0]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.04, 0.04, 1.1, 6]} />
        </mesh>
        <Fire width={1.8} height={1.5} position={[0, 0.02, 0]} intensity={flame} />
      </group>
      {/* exclusion line */}
      <mesh position={[0, 0.012, 0.15]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[3.6, 0.12]} />
        <meshStandardMaterial map={stripes} roughness={0.8} />
      </mesh>
      {/* extinguishers on standby */}
      {[-1.5, 1.5].map((x) => (
        <group key={x} position={[x, 0, 0.45]}>
          <mesh material={M.tinted("#a8231b", 0.4, 0.3)} position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.6, 14]} />
          </mesh>
          <mesh material={M.blackMetal()} position={[0, 0.64, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 0.08, 8]} />
          </mesh>
        </group>
      ))}
      {section.media.slice(0, 3).map((m, i) => (
        <Photo key={m.src} src={m.src} w={0.7} position={[2.35, 2.1 - i * 0.48, -0.3]} rotation={[0, -0.35, 0]} frame="black" />
      ))}
    </group>
  );
}
