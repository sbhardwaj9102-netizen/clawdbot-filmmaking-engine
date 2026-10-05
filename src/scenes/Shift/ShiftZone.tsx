"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, Color, type Group, type Mesh, MeshBasicMaterial, PlaneGeometry } from "three";

import { Clickable } from "@/components/InteractiveObject/Hotspot";
import { SlidingDoor } from "@/components/World/props/Architecture";
import { T } from "@/components/World/themed";
import { radialTexture } from "@/lib/canvasTextures";
import { clamp, easeInOut } from "@/lib/math";
import { shiftTexture } from "@/lib/storyTextures";
import { STAGE } from "@/systems/Experience/choreography";
import { rt } from "@/systems/Experience/runtime";
import { useExperience } from "@/systems/Experience/store";
import { goExplore } from "@/systems/Experience/tour";

import { useEnvRef } from "../envRef";

/**
 * BETWEEN THE ROOMS
 * The louvre: six slats that turn as Satyam walks past — production strips,
 * then cost bars, then a finance curve (one picture across all six). At the
 * end they turn edge-on and open the way to the door at the back: the
 * production house, as light.
 */

const COUNT = 6;
const SLAT_W = 0.88;
const SLAT_H = 3;
const xs = Array.from({ length: COUNT }, (_, i) => STAGE.door.x + (i - (COUNT - 1) / 2) * 0.9);

export function ShiftZone() {
  const contact = useExperience((s) => s.mode === "explore" && s.section === "contact");
  return (
    <group>
      <Louvre />
      <Clickable id="door" label="Contact" verb="Open" active={contact} labelAt={[STAGE.door.x, 4.4, STAGE.door.z + 0.6]} onSelect={() => goExplore("contact")}>
        <Doorway />
      </Clickable>
    </group>
  );
}

function Louvre() {
  const tex = useMemo(() => ({ production: shiftTexture("production"), business: shiftTexture("business"), finance: shiftTexture("finance") }), []);
  const mats = useMemo(
    () => ({
      production: new MeshBasicMaterial({ map: tex.production, toneMapped: false }),
      business: new MeshBasicMaterial({ map: tex.business, toneMapped: false }),
      finance: new MeshBasicMaterial({ map: tex.finance, toneMapped: false }),
    }),
    [tex],
  );
  // each slat shows its own vertical slice of the picture
  const geos = useMemo(
    () =>
      xs.map((_, i) => {
        const g = new PlaneGeometry(SLAT_W, SLAT_H);
        const uv = g.attributes.uv;
        for (let k = 0; k < uv.count; k++) uv.setX(k, (i + uv.getX(k)) / COUNT);
        uv.needsUpdate = true;
        return g;
      }),
    [],
  );
  const slats = useRef<(Group | null)[]>([]);
  const fronts = useRef<(Mesh | null)[]>([]);
  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.dispose());
      geos.forEach((g) => g.dispose());
    },
    [mats, geos],
  );

  useFrame(() => {
    const p = rt.env.shift;
    const d = rt.env.door;
    const level = 0.5 + 0.5 * Math.max(rt.rooms.producer, rt.rooms.strategist);
    Object.values(mats).forEach((m) => m.color.setScalar(level));
    slats.current.forEach((g, i) => {
      if (!g) return;
      const flip1 = easeInOut(clamp((p - (0.27 + i * 0.03)) / 0.18, 0, 1));
      const flip2 = easeInOut(clamp((p - (0.61 + i * 0.03)) / 0.18, 0, 1));
      const open = easeInOut(clamp(d * 1.25 - i * 0.04, 0, 1));
      const angle = Math.PI * (flip1 + flip2) + (Math.PI / 2) * open;
      g.rotation.y = angle;
      const front = fronts.current[i];
      // the face turned away from us changes picture while hidden
      if (front) front.material = angle >= Math.PI ? mats.finance : mats.production;
    });
  });

  return (
    <group position={[0, 0, STAGE.shiftWall.z]}>
      {/* rails */}
      <mesh material={T.trim()} position={[STAGE.door.x, SLAT_H + 0.42, 0]}>
        <boxGeometry args={[COUNT * 0.9 + 0.3, 0.08, 0.18]} />
      </mesh>
      <mesh material={T.trim()} position={[STAGE.door.x, 0.015, 0]}>
        <boxGeometry args={[COUNT * 0.9 + 0.3, 0.03, 0.18]} />
      </mesh>
      {xs.map((x, i) => (
        <group key={i} ref={(el) => void (slats.current[i] = el)} position={[x, SLAT_H / 2 + 0.3, 0]}>
          <mesh material={T.trim()}>
            <boxGeometry args={[SLAT_W, SLAT_H, 0.08]} />
          </mesh>
          <mesh ref={(el) => void (fronts.current[i] = el)} geometry={geos[i]} material={mats.production} position={[0, 0, 0.042]} />
          <mesh geometry={geos[i]} material={mats.business} position={[0, 0, -0.042]} rotation-y={Math.PI} />
          {/* pivots */}
          <mesh material={T.trim()} position={[0, SLAT_H / 2 + 0.06, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.12, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** A wall between the rooms with a sliding door; light behind it. */
function Doorway() {
  const open = useEnvRef("door");
  const light = useMemo(() => new MeshBasicMaterial({ color: "#000000", toneMapped: false }), []);
  const pool = useMemo(
    () =>
      new MeshBasicMaterial({
        map: radialTexture("rgba(255,226,186,0.85)", "rgba(255,226,186,0)"),
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );
  const warm = useMemo(() => new Color("#fff1dc"), []);
  useEffect(
    () => () => {
      light.dispose();
      pool.dispose();
    },
    [light, pool],
  );
  useFrame(() => {
    const k = open.current;
    light.color.copy(warm).multiplyScalar(0.08 + 2.6 * k);
    pool.opacity = k * (0.9 - 0.5 * rt.look.theme);
  });
  const W = 2.4;
  const H = 4;
  const z = STAGE.door.z;
  const x = STAGE.door.x;
  return (
    <group>
      {/* wall: two piers and a lintel */}
      <mesh material={T.wall()} position={[x - (W / 2 + 1.6), 3, z - 0.15]} receiveShadow>
        <boxGeometry args={[3.2, 6, 0.3]} />
      </mesh>
      <mesh material={T.wall()} position={[x + (W / 2 + 1.6), 3, z - 0.15]} receiveShadow>
        <boxGeometry args={[3.2, 6, 0.3]} />
      </mesh>
      <mesh material={T.wall()} position={[x, H + 1, z - 0.15]}>
        <boxGeometry args={[W, 2, 0.3]} />
      </mesh>
      {/* above it all, up into the dark */}
      <mesh material={T.wall()} position={[x, 10, z - 0.15]}>
        <boxGeometry args={[W + 6.4, 8, 0.3]} />
      </mesh>
      {/* the light beyond */}
      <mesh material={light} position={[x, H / 2, z - 0.5]}>
        <planeGeometry args={[W + 0.2, H + 0.2]} />
      </mesh>
      <SlidingDoor position={[x, 0, z + 0.05]} w={W + 0.25} h={H} open={open} />
      <mesh material={pool} position={[x, 0.012, z + 2.6]} rotation-x={-Math.PI / 2} renderOrder={1}>
        <planeGeometry args={[4.6, 6]} />
      </mesh>
    </group>
  );
}
