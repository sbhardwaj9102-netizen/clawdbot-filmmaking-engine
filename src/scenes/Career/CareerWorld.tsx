"use client";

import { useMemo } from "react";
import { MeshStandardMaterial } from "three";

import { Hotspot } from "@/components/InteractiveObject/Hotspot";
import { LightShaft } from "@/components/World/LightShaft";
import { M } from "@/components/World/materials";
import { Sign, Wall } from "@/components/World/props/Architecture";
import { Clapperboard, FilmLight, Monitor } from "@/components/World/props/Film";
import { Binder, Desk, Lamp, Paper } from "@/components/World/props/Furniture";
import { Globe } from "@/components/World/props/Live";
import { Photo } from "@/components/World/props/Photo";
import { Assemble } from "@/components/World/WorldContext";
import { career, type CareerChapter } from "@/data/career/chapters";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { canvasTexture, chartTexture, FONT, newsprintTexture } from "@/lib/canvasTextures";

import { CHAMBER, chamberSide, chamberZ, MOOD } from "./layout";

/**
 * THE PATH — Journalism → Filmmaking → Production → Global Management →
 * Finance → Producer / Strategist, as six rooms you walk through.
 */
export function CareerWorld() {
  const length = career.length * CHAMBER + 8;
  return (
    <group>
      <Assemble>
        {[-6, 6].map((x) => (
          <Wall key={x} position={[x, 0, -length / 2 + 1]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]} w={length} h={7} material="dark" />
        ))}
        <mesh material={M.matteBlack()} position={[0, 7, -length / 2 + 1]} rotation-x={Math.PI / 2}>
          <planeGeometry args={[12, length]} />
        </mesh>
      </Assemble>
      {career.map((c, i) => (
        <Assemble key={c.id} delay={0.1 + i * 0.1}>
          <Chamber chapter={c} index={i} />
        </Assemble>
      ))}
    </group>
  );
}

function Plaque({ chapter }: { chapter: CareerChapter }) {
  const tex = useMemo(
    () =>
      canvasTexture(`plaque:${chapter.id}`, 720, 900, (ctx, w, h) => {
        ctx.fillStyle = "#0c0c0e";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = MOOD[chapter.mood].accent;
        ctx.font = `500 26px ${FONT.mono}`;
        ctx.fillText(`CHAPTER ${chapter.index}`, 56, 90);
        ctx.fillRect(56, 110, 70, 3);
        ctx.fillStyle = "#ece6da";
        ctx.font = `400 76px ${FONT.serif}`;
        const words = chapter.title.split(" ");
        let line = "";
        let y = 210;
        for (const word of words) {
          if (ctx.measureText(`${line} ${word}`).width > w - 110 && line) {
            ctx.fillText(line, 56, y);
            y += 82;
            line = word;
          } else line = line ? `${line} ${word}` : word;
        }
        ctx.fillText(line, 56, y);
        y += 90;
        ctx.fillStyle = "rgba(236,230,218,.6)";
        ctx.font = `500 22px ${FONT.mono}`;
        for (const t of [chapter.place, chapter.detail, chapter.when].filter(Boolean) as string[]) {
          const parts = t.toUpperCase().match(/.{1,40}(\s|$)/g) ?? [t];
          for (const p of parts) {
            ctx.fillText(p.trim(), 56, y);
            y += 34;
          }
          y += 14;
        }
      }),
    [chapter],
  );
  const mat = useMemo(() => new MeshStandardMaterial({ map: tex, emissive: "#fff", emissiveMap: tex, emissiveIntensity: 0.5, roughness: 0.8 }), [tex]);
  return (
    <group>
      <mesh material={M.blackMetal()} position={[0, 1.55, -0.05]}>
        <boxGeometry args={[1.5, 1.9, 0.08]} />
      </mesh>
      <mesh material={mat} position={[0, 1.55, 0]}>
        <planeGeometry args={[1.4, 1.75]} />
      </mesh>
    </group>
  );
}

function Chamber({ chapter, index }: { chapter: CareerChapter; index: number }) {
  const z = chamberZ(index);
  const side = chamberSide(index);
  const mood = MOOD[chapter.mood];
  const rot = side === -1 ? Math.PI / 2 : -Math.PI / 2;
  return (
    <group>
      {/* gate */}
      <group position={[0, 0, z + CHAMBER / 2]}>
        {[-2.6, 2.6].map((x) => (
          <mesh key={x} material={M.bulb(mood.light, 0.9)} position={[x, 2.4, 0]}>
            <boxGeometry args={[0.04, 4.8, 0.04]} />
          </mesh>
        ))}
        <mesh material={M.bulb(mood.light, 0.9)} position={[0, 4.8, 0]}>
          <boxGeometry args={[5.24, 0.04, 0.04]} />
        </mesh>
        <Sign text={chapter.index} font="mono" width={0.8} size={140} position={[2.2, 5.15, 0]} opacity={0.6} />
      </group>
      {/* the chapter title, large, on the opposite wall */}
      <Sign
        text={chapter.title.toUpperCase()}
        sub={chapter.place}
        font="serif"
        width={6.5}
        size={150}
        tracking={0.06}
        position={[-side * 5.85, 3.6, z]}
        rotation={[0, side === -1 ? -Math.PI / 2 : Math.PI / 2, 0]}
        opacity={0.85}
      />
      {/* the readable plaque */}
      <Hotspot id={`career-${chapter.id}`}>
        <group position={[side * 3.7, 0, z]} rotation-y={rot}>
          <Plaque chapter={chapter} />
        </group>
      </Hotspot>
      {/* set dressing per chapter */}
      <group position={[side * 4.6, 0, z - 2.6]} rotation-y={rot}>
        <Dressing chapter={chapter} />
      </group>
    </group>
  );
}

function Dressing({ chapter }: { chapter: CareerChapter }) {
  switch (chapter.mood) {
    case "journalism":
      return <Journalism />;
    case "film":
      return (
        <group>
          <Photo src={profile.reel.src} w={2.6} position={[0, 2.2, -0.6]} frame="black" />
          <group position={[0, 2.25, 6]} rotation-x={Math.PI / 2}>
            <LightShaft length={6.4} radius={1.2} top={0.08} color="#ffd2a0" opacity={0.12} />
          </group>
          {[0, 1, 2].map((i) => (
            <mesh key={i} material={M.blackMetal()} position={[1.6, 0.05 + i * 0.07, 0.4]} rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.3, 0.3, 0.06, 32]} />
            </mesh>
          ))}
        </group>
      );
    case "production":
      return (
        <group>
          {projects.slice(0, 3).map((p, i) => (
            <Monitor key={p.slug} src={p.cover.src} w={0.9} h={0.5} standHeight={1.1 + (i % 2) * 0.25} position={[-1.2 + i * 1.2, 0, 0]} rotation={[0, (1 - i) * 0.25, 0]} />
          ))}
          <Clapperboard position={[1.6, 0, 0.8]} rotation={[-0.3, -0.4, 0]} label="ROLL" />
          <FilmLight position={[-2.2, 0, 1.2]} rotation={[0, 0.8, 0]} height={2.2} tilt={0.3} shaftLength={4} />
        </group>
      );
    case "global":
      return (
        <group>
          <Globe
            position={[0, 2.2, 0]}
            radius={1.25}
            points={[
              { lat: 24.4, lon: 54.4 },
              { lat: 21, lon: 78 },
              { lat: 1.35, lon: 103.8 },
            ]}
          />
          <Sign text="UAE · INDIA · SINGAPORE" font="mono" width={2.4} size={90} tracking={0.2} position={[0, 0.6, 0.4]} opacity={0.6} />
        </group>
      );
    case "finance":
      return <FinanceDressing />;
    case "now":
      return (
        <group>
          {["FILM", "PRODUCTION", "BUSINESS", "FINANCE"].map((w, i) => (
            <group key={w} position={[-1.8 + i * 1.2, 0, 0]}>
              <mesh material={M.glow(["#e2a25e", "#ffd9b0", "#ffe0a3", "#8fb5ff"][i], 0.18)} position={[0, 2.5, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 5, 16, 1, true]} />
              </mesh>
              <Sign text={w} font="mono" width={1.3} size={80} tracking={0.2} position={[0, 0.5, 0.25]} opacity={0.85} />
            </group>
          ))}
        </group>
      );
  }
}

function Journalism() {
  const news = useMemo(() => newsprintTexture(2), []);
  const news2 = useMemo(() => newsprintTexture(8), []);
  return (
    <group>
      <mesh position={[-0.9, 2.3, -0.5]} rotation-y={0.1}>
        <planeGeometry args={[1.4, 1.87]} />
        <meshStandardMaterial map={news} roughness={0.95} side={2} />
      </mesh>
      <mesh position={[0.7, 2.6, -0.7]} rotation-y={-0.15}>
        <planeGeometry args={[1.1, 1.47]} />
        <meshStandardMaterial map={news2} roughness={0.95} side={2} />
      </mesh>
      <Desk w={1.6} d={0.7} position={[0, 0, 0.6]} />
      <group position={[0, 0.76, 0.6]}>
        <Paper map={news} w={0.3} h={0.4} position={[-0.4, 0, 0]} rotation={[0, 0.3, 0]} stack={6} />
        <mesh material={M.blackMetal()} position={[0.35, 0.12, 0]}>
          <cylinderGeometry args={[0.012, 0.03, 0.24, 8]} />
        </mesh>
        <mesh material={M.matteBlack()} position={[0.35, 0.28, 0]}>
          <sphereGeometry args={[0.045, 12, 10]} />
        </mesh>
      </group>
      <Lamp position={[0, 4.6, 0.4]} drop={2} color="#eef2ff" shaftLength={3.6} />
    </group>
  );
}

function FinanceDressing() {
  const chart = useMemo(() => chartTexture(41, "#8fb5ff", "ANALYSIS"), []);
  return (
    <group>
      <mesh material={M.glass()} position={[0, 2.2, -0.4]}>
        <planeGeometry args={[2.6, 2.6]} />
      </mesh>
      <mesh position={[0, 2.2, -0.42]}>
        <planeGeometry args={[2.4, 1.35]} />
        <meshBasicMaterial map={chart} transparent opacity={0.85} toneMapped={false} />
      </mesh>
      <Binder kind="Global finance" title="Notes" position={[0, 0.02, 0.8]} />
    </group>
  );
}
