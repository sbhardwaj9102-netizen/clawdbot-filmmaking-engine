"use client";

import { useMemo } from "react";

import { Hotspot } from "@/components/InteractiveObject/Hotspot";
import { LightShaft } from "@/components/World/LightShaft";
import { M } from "@/components/World/materials";
import { Column, Sign, Truss, Wall } from "@/components/World/props/Architecture";
import { Cases, CinemaCamera, Clapperboard, DirectorChair, Dolly, DollyTrack, FilmLight, Monitor } from "@/components/World/props/Film";
import { Board, Chair, Desk, Lamp, Pinned, UIScreen } from "@/components/World/props/Furniture";
import { Screen } from "@/components/World/props/Photo";
import { Assemble } from "@/components/World/WorldContext";
import { projects } from "@/data/projects";
import { profile } from "@/data/profile";
import { timelineTexture } from "@/lib/canvasTextures";

import { MONITOR_X, MONITOR_Z } from "./layout";

/**
 * MAKE IT — the film world. The avatar walks past a camera on a dolly lining
 * up on a lit set, a wall of stills, an edit bay, to video village where each
 * of the four films plays on its own monitor. Step up to one to enter it.
 */
export function FilmSetWorld() {
  const timeline = useMemo(() => timelineTexture(5), []);
  const timeline2 = useMemo(() => timelineTexture(9), []);
  const stills = projects[0].sections.find((s) => s.kind === "stills")!.media.slice(0, 4);

  return (
    <group>
      {/* stage shell, read mostly as darkness */}
      <Assemble delay={0}>
        <Wall position={[-13, 0, -12]} rotation={[0, Math.PI / 2, 0]} w={30} h={11} material="dark" />
        <Wall position={[0, 0, -27.5]} w={26} h={11} material="dark" />
        {[-4, -12, -20].map((z) => (
          <Truss key={z} length={24} position={[0, 8, z]} />
        ))}
        {[-2, -11, -20].map((z) => (
          <Column key={z} position={[-11.5, 0, z]} h={11} w={0.7} material="metal" />
        ))}
        <Sign text="STAGE 2" font="mono" width={3} position={[-12.8, 6.5, -9]} rotation={[0, Math.PI / 2, 0]} opacity={0.35} size={120} tracking={0.3} />
      </Assemble>

      {/* the set being lit: a room corner with a window and a practical */}
      <Assemble delay={0.15}>
        <group position={[6.6, 0, -6.6]} rotation-y={-0.15}>
          <Wall position={[0, 0, -2.2]} w={5} h={3.4} t={0.12} opening={{ w: 1.3, h: 1.6, x: 0.8 }} material="concrete" />
          <mesh position={[0.8, 1.6, -2.35]} material={M.bulb("#a9c2ff", 1.1)}>
            <planeGeometry args={[1.3, 1.6]} />
          </mesh>
          <Wall position={[2.45, 0, 0]} rotation={[0, Math.PI / 2, 0]} w={4.4} h={3.4} t={0.12} material="concrete" />
          <mesh material={M.tinted("#3b2a22", 1, 0)} position={[0, 0.01, -0.3]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[3.2, 2.4]} />
          </mesh>
          <Chair position={[-0.6, 0, -0.6]} rotation={[0, 0.6, 0]} />
          <Lamp kind="desk" position={[0.9, 0, -1.6]} />
          <group position={[0.8, 2.2, -2.3]} rotation={[-0.7, 0, 0]}>
            <LightShaft length={3.5} radius={1.1} top={0.7} color="#a9c2ff" opacity={0.09} />
          </group>
        </group>
        <FilmLight position={[2.8, 0, -3.0]} rotation={[0, 2.1, 0]} height={2.5} tilt={0.3} shaftLength={5.5} />
        <FilmLight position={[2.6, 0, -10.2]} rotation={[0, 0.6, 0]} height={2.2} tilt={0.25} color="#cfe0ff" shaftLength={5} />
      </Assemble>

      {/* camera on the dolly — WATCH the reel */}
      <Assemble delay={0.3}>
        <DollyTrack position={[-3.3, 0, -6.5]} length={8} />
        <Hotspot id="reel-camera">
          <Dolly position={[-3.3, 0, -6.3]} rotation={[0, Math.PI / 2 - 0.12, 0]}>
            <CinemaCamera />
          </Dolly>
        </Hotspot>
        <Cases position={[-5.2, 0, -3.4]} rotation={[0, 0.4, 0]} count={2} />
      </Assemble>

      {/* stills wall */}
      <Assemble delay={0.45}>
        <Hotspot id="stills-board">
          <Board position={[3.75, 1.7, -13]} rotation={[0, -Math.PI / 2, 0]} w={2.9} h={1.6} kind="black">
            {stills.map((m, i) => (
              <Pinned key={m.src} src={m.src} w={0.62} aspect={2.39} position={[-1.05 + (i % 2) * 0.7, 0.42 - Math.floor(i / 2) * 0.42, 0]} />
            ))}
            {projects.slice(1).map((p, i) => (
              <Pinned key={p.slug} src={p.cover.src} w={0.5} position={[0.82, 0.5 - i * 0.45, 0]} />
            ))}
          </Board>
        </Hotspot>
      </Assemble>

      {/* edit bay */}
      <Assemble delay={0.55}>
        <Hotspot id="edit-bay">
          <group position={[-3.9, 0, -14.2]} rotation-y={Math.PI / 2}>
            <Desk w={1.9} d={0.8} />
            <UIScreen map={timeline} position={[-0.42, 0.9, -0.15]} rotation={[0, 0.12, 0]} w={0.8} h={0.45} />
            <UIScreen map={timeline2} position={[0.45, 0.9, -0.15]} rotation={[0, -0.12, 0]} w={0.8} h={0.45} />
            <Chair position={[0, 0, 0.6]} rotation={[0, Math.PI, 0]} />
          </group>
        </Hotspot>
      </Assemble>

      {/* video village: one monitor per film */}
      <Assemble delay={0.7}>
        {projects.slice(0, 4).map((p, i) => (
          <Hotspot key={p.slug} id={`monitor-${p.scene}`} labelOffset={0.25}>
            <Monitor
              src={p.cover.src}
              title={p.title.length > 16 ? "HOUSE OF PURPLE" : p.title}
              position={[MONITOR_X[i], 0, MONITOR_Z + Math.abs(MONITOR_X[i]) * 0.08]}
              rotation={[0, -MONITOR_X[i] * 0.07, 0]}
              w={1.5}
              h={0.84}
              standHeight={1.05}
            />
          </Hotspot>
        ))}
        <DirectorChair position={[-1.8, 0, -17.2]} rotation={[0, Math.PI + 0.2, 0]} label="PRODUCER" />
        <DirectorChair position={[2.2, 0, -16.8]} rotation={[0, Math.PI - 0.3, 0]} />
        <Clapperboard position={[4.8, 0, -20.5]} rotation={[-0.2, -0.5, 0]} label="SCENE 1" />
        <Lamp position={[0, 7.4, -20.6]} drop={1} shaftLength={6.2} />
      </Assemble>

      {/* the reel projected on the back wall */}
      <Assemble delay={0.9}>
        <Screen src={profile.reel.src} video={profile.reel.video} w={9} h={5.06} position={[0, 3.6, -27.3]} intensity={0.55} />
        <Sign text="REEL" font="mono" width={2} position={[-5.2, 1.2, -27.2]} opacity={0.3} size={110} tracking={0.4} />
      </Assemble>
    </group>
  );
}
