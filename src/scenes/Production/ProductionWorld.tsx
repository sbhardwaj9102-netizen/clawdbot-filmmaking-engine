"use client";

import { useFrame } from "@react-three/fiber";
import { type ReactNode, useMemo, useRef } from "react";
import { MeshBasicMaterial, MeshStandardMaterial } from "three";

import { Hotspot } from "@/components/InteractiveObject/Hotspot";
import { M, signMaterial } from "@/components/World/materials";
import { Sign, Wall } from "@/components/World/props/Architecture";
import { Cases } from "@/components/World/props/Film";
import { Binder, Board, Doc, Pinned, Table, UIScreen } from "@/components/World/props/Furniture";
import { Screen } from "@/components/World/props/Photo";
import { Assemble, since, useWorldEvent } from "@/components/World/WorldContext";
import { aster } from "@/data/projects/aster";
import { purple } from "@/data/projects/purple";
import { chartTexture, documentTexture, mapTexture, stripboardTexture, textTexture } from "@/lib/canvasTextures";
import { clamp } from "@/systems/SceneManager/space";

import { PROD_STATIONS } from "./layout";

const sec = (p: typeof aster, k: string) => p.sections.find((s) => s.kind === k)!;

/**
 * PRODUCTION — MAKING IT HAPPEN. A command center where the walk passes under
 * three signs (IDEA → PLAN → EXECUTION) between eight working stations.
 */
export function ProductionWorld() {
  return (
    <group>
      <Assemble>
        <Wall position={[-7.2, 0, -12]} rotation={[0, Math.PI / 2, 0]} w={30} h={7} material="dark" />
        <Wall position={[7.2, 0, -12]} rotation={[0, -Math.PI / 2, 0]} w={30} h={7} material="dark" />
        <Wall position={[0, 0, -27.5]} w={14.6} h={7} opening={{ w: 6.4, h: 4.6 }} material="dark" />
        {/* ceiling light strips */}
        {[-2, -7, -12, -17, -22].map((z) => (
          <mesh key={z} material={M.bulb("#dfe8ff", 0.9)} position={[0, 6.6, z]}>
            <boxGeometry args={[10, 0.04, 0.12]} />
          </mesh>
        ))}
        <mesh material={M.matteBlack()} position={[0, 6.7, -12]} rotation-x={Math.PI / 2}>
          <planeGeometry args={[14.4, 30]} />
        </mesh>
      </Assemble>

      <StageSign text="IDEA" z={-4.6} event="sign-idea" />
      <StageSign text="PLAN" z={-10.6} event="sign-plan" />
      <StageSign text="EXECUTION" z={-16.4} event="sign-execution" />

      {PROD_STATIONS.map((s, i) => (
        <Assemble key={s.id} delay={0.12 + i * 0.07}>
          <Hotspot id={s.id} labelOffset={0.15}>
            <group position={[s.side * 3.5, 0, s.z]} rotation-y={s.side === -1 ? Math.PI / 2 : -Math.PI / 2}>
              <StationBody id={s.id} />
            </group>
          </Hotspot>
        </Assemble>
      ))}
    </group>
  );
}

function StageSign({ text, z, event }: { text: string; z: number; event: string }) {
  const fired = useWorldEvent(event);
  const map = useMemo(() => textTexture(text, { font: "serif", size: 170, tracking: 0.12, w: 2048, h: 400 }), [text]);
  const mat = useMemo(() => {
    const m = signMaterial(map, "#ffffff", 1).clone() as MeshBasicMaterial;
    return m;
  }, [map]);
  const k = useRef(0);
  useFrame((_, dt) => {
    const target = fired ? clamp(since(fired) / 1.2, 0, 1) : 0;
    k.current += (target - k.current) * Math.min(1, dt * 3);
    mat.opacity = 0.18 + 0.82 * k.current;
    mat.color.setScalar(0.6 + k.current * 1.2);
  });
  return (
    <mesh material={mat} position={[0, 4.4, z]} raycast={() => null}>
      <planeGeometry args={[5.4, 5.4 * (400 / 2048)]} />
    </mesh>
  );
}

function Label({ text, y = 2.85 }: { text: string; y?: number }) {
  return <Sign text={text} font="mono" width={2.1} size={110} tracking={0.24} position={[0, y, 0.15]} opacity={0.75} />;
}

function Desk({ children }: { children?: ReactNode }) {
  return (
    <group>
      <Table w={2.2} d={1.0} height={0.88} material="steel" />
      <group position={[0, 0.88, 0]}>{children}</group>
    </group>
  );
}

function StationBody({ id }: { id: string }) {
  switch (id) {
    case "prod-callsheets":
      return (
        <group>
          <Label text="CALL SHEETS" />
          <Desk>
            <Doc kind="Call sheet" title="ASTER" position={[-0.5, 0, 0.1]} rotation={[0, 0.2, 0]} scale={1.2} stack={30} seed={21} />
            <Doc kind="Call sheet" title="ASTER" position={[-0.05, 0, 0.18]} rotation={[0, -0.1, 0]} scale={1.2} stack={10} seed={22} />
            <Doc kind="Crew list" title="Departments" position={[0.5, 0, 0.05]} rotation={[0, 0.05, 0]} scale={1.2} columns seed={23} />
          </Desk>
          <Board w={1.9} h={1.1} position={[0, 2.0, -0.6]} legs={false} kind="black">
            <Pinned src={sec(aster, "crew").media[0].src} w={0.9} position={[-0.42, 0.05, 0]} />
            <Pinned src={sec(aster, "crew").media[1].src} w={0.75} position={[0.5, 0.0, 0]} />
          </Board>
        </group>
      );
    case "prod-schedules":
      return <Schedules />;
    case "prod-budgets":
      return <Budgets />;
    case "prod-locations":
      return <Locations />;
    case "prod-crew":
      return (
        <group>
          <Label text="CREW" />
          <Desk>
            {Array.from({ length: 6 }, (_, i) => (
              <group key={i} position={[-0.6 + i * 0.24, 0, -0.1]}>
                <mesh material={M.matteBlack()} position={[0, 0.1, 0]}>
                  <boxGeometry args={[0.07, 0.2, 0.04]} />
                </mesh>
                <mesh material={M.matteBlack()} position={[0.02, 0.27, 0]}>
                  <cylinderGeometry args={[0.006, 0.006, 0.14, 5]} />
                </mesh>
                <mesh material={M.bulb("#7cff9a", 1.5)} position={[-0.02, 0.17, 0.021]}>
                  <sphereGeometry args={[0.006, 6, 4]} />
                </mesh>
              </group>
            ))}
          </Desk>
          <Board w={1.9} h={1.1} position={[0, 2.0, -0.6]} legs={false} kind="black">
            <Pinned src={sec(aster, "bts").media[0].src} w={1.1} position={[0, 0.0, 0]} />
          </Board>
        </group>
      );
    case "prod-logistics":
      return (
        <group>
          <Label text="LOGISTICS" />
          <Cases position={[-0.7, 0, -0.2]} count={2} />
          <Cases position={[0.55, 0, -0.35]} rotation={[0, 0.3, 0]} count={1} />
          <Board w={1.9} h={1.1} position={[0, 2.05, -0.75]} legs={false} kind="white">
            <Pinned src={sec(purple, "sets").media[4].src} w={0.9} position={[-0.35, 0.05, 0]} />
            <Doc kind="Logistics" title="Sets 01–04" position={[0.55, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]} scale={1.4} seed={31} />
          </Board>
        </group>
      );
    case "prod-design":
      return <SetModel />;
    case "prod-execution":
      return (
        <group>
          <Label text="EXECUTION" y={3.1} />
          {sec(purple, "fire").media.slice(0, 3).map((m, i) => (
            <group key={m.src} position={[-0.85 + i * 0.85, 0, 0]}>
              <mesh material={M.blackMetal()} position={[0, 0.7, -0.05]}>
                <cylinderGeometry args={[0.02, 0.025, 1.4, 6]} />
              </mesh>
              <mesh material={M.matteBlack()} position={[0, 1.65, -0.04]}>
                <boxGeometry args={[0.8, 0.48, 0.05]} />
              </mesh>
              <Screen src={m.src} w={0.76} h={0.43} position={[0, 1.65, -0.01]} intensity={1} />
            </group>
          ))}
        </group>
      );
    default:
      return null;
  }
}

function Schedules() {
  const map = useMemo(() => stripboardTexture(4), []);
  const mat = useMemo(() => new MeshStandardMaterial({ map, emissive: "#fff", emissiveMap: map, emissiveIntensity: 0.4 }), [map]);
  return (
    <group>
      <Label text="SCHEDULES" y={3.05} />
      <Board w={2.6} h={1.35} position={[0, 1.75, -0.2]} kind="black" legs={false}>
        <mesh material={mat} position={[0, 0, 0.003]}>
          <planeGeometry args={[2.5, 1.25]} />
        </mesh>
      </Board>
      <Desk>
        <Doc kind="Breakdown" title="Movie Magic" position={[0.4, 0, 0.1]} scale={1.2} columns seed={41} />
      </Desk>
    </group>
  );
}

function Budgets() {
  const chart = useMemo(() => chartTexture(17, "#e2a25e", "BUDGET VS. SCHEDULE"), []);
  return (
    <group>
      <Label text="BUDGETS" />
      <Desk>
        <Binder kind="Production budget" title="Top sheet" position={[-0.45, 0, 0.05]} />
        <UIScreen map={chart} position={[0.55, 0.13, -0.2]} w={0.7} h={0.4} />
      </Desk>
      <mesh material={M.tinted("#0e1626", 0.6, 0.2)} position={[0, 2.1, -0.6]}>
        <boxGeometry args={[1.9, 1.1, 0.05]} />
      </mesh>
      <mesh position={[0, 2.1, -0.57]}>
        <planeGeometry args={[1.8, 1.0]} />
        <meshStandardMaterial map={documentTexture("Cost report", "Above / below the line", { columns: true, seed: 51 })} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Locations() {
  const map = useMemo(() => mapTexture(7, 11, "#e2a25e"), []);
  const mat = useMemo(() => new MeshStandardMaterial({ map, emissive: "#fff", emissiveMap: map, emissiveIntensity: 0.45 }), [map]);
  const locs = sec(aster, "locations").media;
  return (
    <group>
      <Label text="LOCATIONS" y={3.15} />
      <Board w={2.6} h={1.6} position={[0, 1.75, -0.2]} kind="black" legs={false}>
        <mesh material={mat} position={[0, 0, 0.003]}>
          <planeGeometry args={[2.5, 1.5]} />
        </mesh>
      </Board>
      {locs.slice(0, 3).map((m, i) => (
        <Pinned key={m.src} src={m.src} w={0.55} position={[-0.75 + i * 0.75, 0.62, 0.15]} rotation={[-0.3, 0, 0]} />
      ))}
    </group>
  );
}

/** A white-card model of four sets — production design at table scale. */
function SetModel() {
  const white = useMemo(() => new MeshStandardMaterial({ color: "#ebe5da", roughness: 0.75 }), []);
  const sets = sec(purple, "sets").media.slice(0, 4);
  return (
    <group>
      <Label text="PRODUCTION DESIGN" y={3.05} />
      <Desk>
        <mesh material={M.walnut()} position={[0, 0.015, 0]}>
          <boxGeometry args={[1.8, 0.03, 0.8]} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <group key={i} position={[-0.66 + i * 0.44, 0.03, 0]}>
            <mesh material={white} position={[0, 0.12, -0.16]}>
              <boxGeometry args={[0.4, 0.24, 0.01]} />
            </mesh>
            <mesh material={white} position={[-0.195, 0.12, 0]}>
              <boxGeometry args={[0.01, 0.24, 0.32]} />
            </mesh>
            <mesh material={M.bulb("#ffcf94", 1.4)} position={[0.08, 0.2, -0.05]}>
              <sphereGeometry args={[0.012, 6, 4]} />
            </mesh>
          </group>
        ))}
      </Desk>
      <Board w={2.2} h={1.0} position={[0, 2.1, -0.6]} legs={false} kind="black">
        {sets.map((m, i) => (
          <Pinned key={m.src} src={m.src} w={0.46} position={[-0.78 + i * 0.52, 0, 0]} />
        ))}
      </Board>
    </group>
  );
}
