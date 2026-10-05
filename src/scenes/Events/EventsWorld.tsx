"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";

import { Hotspot } from "@/components/InteractiveObject/Hotspot";
import { M } from "@/components/World/materials";
import { Sign, Truss, Wall } from "@/components/World/props/Architecture";
import { Cases, FilmLight } from "@/components/World/props/Film";
import { Board, Doc, Pinned, Table } from "@/components/World/props/Furniture";
import { Crowd, RoundTable, Stage, StringLights } from "@/components/World/props/Live";
import { Screen } from "@/components/World/props/Photo";
import { Assemble } from "@/components/World/WorldContext";
import { events } from "@/data/worlds/events";
import { rt } from "@/systems/SceneManager/director";

import { liveK, setupK } from "./layout";

type V3 = [number, number, number];

/**
 * EVENTS — LIVE EXPERIENCES. The venue transforms as the avatar crosses it:
 * an empty hall under work lights; truss rising, tables and crew arriving;
 * then the room goes warm, the guests are there and the wall comes alive.
 */
export function EventsWorld() {
  const k = useRef({ setup: { current: 0 }, live: { current: 0 }, crew: { current: 0 } }).current;
  const truss = useRef<Group>(null);
  const tables = useRef<Group>(null);

  useFrame(() => {
    const u = rt.active?.id === "events" ? rt.avatar.u : 0;
    k.setup.current = setupK(u);
    k.live.current = liveK(u);
    k.crew.current = k.setup.current * (1 - k.live.current);
    if (truss.current) truss.current.position.y = 0.6 + k.setup.current * 5.4;
    if (tables.current) {
      tables.current.children.forEach((c, i) => {
        const t = Math.min(1, Math.max(0, k.setup.current * 1.8 - (i % 7) * 0.08));
        c.scale.setScalar(Math.max(0.001, t));
      });
    }
  });

  const tableSpots = useMemo(() => {
    const out: V3[] = [];
    for (const x of [-9, -6.2, 6.2, 9]) for (const z of [-6, -10, -14, -18, -22]) out.push([x, 0, z]);
    return out;
  }, []);
  const guests = useMemo(
    () =>
      tableSpots.flatMap(([x, , z], ti) =>
        Array.from({ length: 4 }, (_, i) => {
          const a = (i / 4) * Math.PI * 2 + ti;
          return { x: x + Math.sin(a) * 1.35, z: z + Math.cos(a) * 1.35, yaw: a + Math.PI };
        }),
      ),
    [tableSpots],
  );
  const crew = useMemo(
    () => [
      { x: -2.5, z: -24, yaw: 0.4 },
      { x: 2.8, z: -23.5, yaw: -0.3 },
      { x: -7.5, z: -8, yaw: 1.2 },
      { x: 7.6, z: -16, yaw: -1.4 },
      { x: 3.6, z: -26, yaw: 2.4 },
    ],
    [],
  );
  const strands = useMemo<[V3, V3][]>(() => {
    const out: [V3, V3][] = [];
    for (let i = 0; i < 7; i++) {
      const z = -3 - i * 3.6;
      out.push([[-11.5, 7.2, z], [11.5, 7.2, z - 1.2]]);
    }
    return out;
  }, []);

  return (
    <group>
      <Assemble>
        {[-12, 12].map((x) => (
          <group key={x}>
            {[-4, -12, -20].map((z) => (
              <Wall key={z} position={[x, 0, z]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]} w={8} h={9} t={0.3} opening={{ w: 3.2, h: 5.6 }} material="concrete" />
            ))}
          </group>
        ))}
        <Wall position={[0, 0, -30.5]} w={24} h={9} material="dark" />
        <Stage position={[0, 0, -27]} w={12} d={4.6} h={1.0} />
        <Sign text={events.org.toUpperCase()} font="mono" width={7} size={90} tracking={0.22} position={[0, 7.8, -30.3]} opacity={0.45} />
      </Assemble>

      {/* the LED wall comes alive when the event does */}
      <Hotspot id="evt-live">
        <group position={[0, 1.0, -28.6]}>
          <mesh material={M.matteBlack()} position={[0, 2.85, -0.06]}>
            <boxGeometry args={[8.3, 4.7, 0.1]} />
          </mesh>
          <LiveScreen k={k.live} />
        </group>
      </Hotspot>

      {/* truss that rises during setup */}
      <group ref={truss} position={[0, 0.6, -26.5]}>
        <Truss length={13} />
        {[-4.5, -1.5, 1.5, 4.5].map((x) => (
          <group key={x} position={[x, -0.25, 0]}>
            <mesh material={M.matteBlack()} rotation-x={Math.PI}>
              <cylinderGeometry args={[0.13, 0.11, 0.3, 12]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* tables arrive */}
      <group ref={tables}>
        {tableSpots.map((p) => (
          <group key={p.join()} position={p}>
            <RoundTable candle={k.live} />
          </group>
        ))}
      </group>

      <StringLights strands={strands} on={k.live} per={26} />
      <Crowd spots={guests} visible={k.live} color="#0b0908" seed={7} />
      <Crowd spots={crew} visible={k.crew} color="#101216" seed={3} />

      {/* work lights for the empty hall */}
      <FilmLight position={[-8, 0, -4]} rotation={[0, 2.4, 0]} height={3} tilt={0.5} color="#e6eeff" shaftLength={8} />
      <FilmLight position={[8, 0, -15]} rotation={[0, -2.1, 0]} height={3} tilt={0.5} color="#e6eeff" shaftLength={8} />

      {/* stations */}
      <Assemble delay={0.2}>
        <Hotspot id="evt-house">
          <group position={[-3.2, 0, -2.4]} rotation-y={Math.PI / 2}>
            <mesh material={M.blackMetal()} position={[0, 0.7, 0]}>
              <boxGeometry args={[0.05, 1.4, 0.05]} />
            </mesh>
            <mesh material={M.gold()} position={[0, 1.45, 0]}>
              <boxGeometry args={[1.3, 0.5, 0.03]} />
            </mesh>
            <Sign text="JAI MATA DI" sub="Caterers & Event Management · Bhagalpur" font="serif" width={1.25} size={150} position={[0, 1.47, 0.02]} color="#1a1208" />
          </group>
        </Hotspot>
        <Hotspot id="evt-vendors">
          <group position={[-4.6, 0, -7]} rotation-y={Math.PI / 2}>
            <Cases position={[-0.6, 0, 0]} count={2} />
            <Cases position={[0.5, 0, -0.2]} rotation={[0, 0.4, 0]} count={1} />
            <Board w={1.6} h={0.9} position={[0, 2.0, -0.6]} legs={false} kind="black">
              {events.pillars[0].media.map((m, i) => (
                <Pinned key={m.src} src={m.src} w={0.66} position={[-0.36 + i * 0.72, 0, 0]} />
              ))}
            </Board>
          </group>
        </Hotspot>
        <Hotspot id="evt-setup">
          <group position={[4.6, 0, -9]} rotation-y={-Math.PI / 2}>
            <Table w={2.6} d={0.8} height={0.9} material="steel" />
            {[-0.9, -0.3, 0.3, 0.9].map((x) => (
              <group key={x} position={[x, 0.9, 0]}>
                <mesh material={M.brushed()} position={[0, 0.06, 0]}>
                  <boxGeometry args={[0.5, 0.1, 0.32]} />
                </mesh>
                <mesh material={M.brushed()} position={[0, 0.14, 0]} rotation-z={Math.PI / 2}>
                  <cylinderGeometry args={[0.16, 0.16, 0.5, 14, 1, true, 0, Math.PI]} />
                </mesh>
              </group>
            ))}
            <Pinned src={events.pillars[1].media[0].src} w={0.8} position={[0, 1.9, -0.45]} />
          </group>
        </Hotspot>
        <Hotspot id="evt-deadlines">
          <group position={[-4.6, 0, -12.8]} rotation-y={Math.PI / 2}>
            <Board w={1.8} h={1.2} position={[0, 1.65, 0]} kind="white">
              <Doc kind="Run of show" title="Timeline" position={[-0.45, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]} scale={1.5} columns seed={61} />
              <Pinned src={events.pillars[2].media[0].src} w={0.75} position={[0.45, 0.05, 0]} />
            </Board>
          </group>
        </Hotspot>
        <Hotspot id="evt-manpower">
          <group position={[4.6, 0, -14]} rotation-y={-Math.PI / 2}>
            <Board w={1.6} h={0.95} position={[0, 2.0, -0.4]} legs={false} kind="black">
              <Pinned src={events.pillars[3].media[0].src} w={0.85} position={[0, 0, 0]} />
            </Board>
            <Crowd spots={[{ x: -0.6, z: 0, yaw: 0.3 }, { x: 0.2, z: 0.3, yaw: -0.2 }, { x: 0.8, z: -0.1, yaw: -0.5 }]} color="#101114" seed={9} />
          </group>
        </Hotspot>
      </Assemble>
    </group>
  );
}

function LiveScreen({ k }: { k: { current: number } }) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.scale.set(1, Math.max(0.001, k.current), 1);
  });
  return (
    <group position={[0, 2.85, 0]}>
      <group ref={g}>
        <Screen src={events.gallery[0].src} w={8} h={4.5} intensity={1.1} />
      </group>
    </group>
  );
}
