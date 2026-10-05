"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, type DirectionalLight, type HemisphereLight, Object3D, type PointLight, type SpotLight, Vector3 } from "three";

import { damp } from "@/lib/math";
import { STAGE } from "@/systems/Experience/choreography";
import { rt } from "@/systems/Experience/runtime";
import { getExperience } from "@/systems/Experience/store";

/**
 * LIGHT RIG — a fixed set of lights (1 hemisphere, 1 key, 4 spots, 4 points,
 * 1 fill on Satyam). Each has a job on the stage; intensities follow the
 * rooms' light levels, the theme and what the set is doing. The number of
 * lights never changes, so nothing ever recompiles a shader.
 */

type Spot = { pos: Vector3; target: Vector3; color: string; angle: number; penumbra: number; power: number; room: "producer" | "strategist" };
const SPOTS: Spot[] = [
  // 0 — Satyam's key (follows him; colour set per room)
  { pos: new Vector3(), target: new Vector3(), color: "#ffd9b0", angle: 0.42, penumbra: 0.8, power: 120, room: "producer" },
  // 1 — the ASTER wall
  { pos: new Vector3(-5.2, 6.6, 2.6), target: new Vector3(-9.1, 1.5, -1.2), color: "#ffe2bf", angle: 0.5, penumbra: 0.75, power: 150, room: "producer" },
  // 2 — the House of Purple set
  { pos: new Vector3(1.2, 6.4, 0.6), target: STAGE.purpleSet.clone().setY(1.2), color: "#c3a8ff", angle: 0.52, penumbra: 0.7, power: 140, room: "producer" },
  // 3 — the strategist's table
  { pos: new Vector3(17.4, 6.6, 2.4), target: new Vector3(18.6, 0.8, -2.2), color: "#d6e4ff", angle: 0.58, penumbra: 0.85, power: 150, room: "strategist" },
];

export function LightRig({ shadows }: { shadows: boolean }) {
  const scene = useThree((s) => s.scene);
  const hemi = useRef<HemisphereLight>(null);
  const key = useRef<DirectionalLight>(null);
  const fill = useRef<PointLight>(null);
  const spots = useRef<(SpotLight | null)[]>([]);
  const points = useRef<(PointLight | null)[]>([]);
  const targets = useMemo(() => SPOTS.map(() => new Object3D()), []);
  const keyTarget = useMemo(() => new Object3D(), []);
  const tmp = useMemo(() => ({ c: new Color(), warm: new Color("#ffd9b0"), cool: new Color("#e2ecff") }), []);
  const tier = getExperience().tier;

  useEffect(() => {
    targets.forEach((t) => scene.add(t));
    scene.add(keyTarget);
    return () => {
      targets.forEach((t) => scene.remove(t));
      scene.remove(keyTarget);
    };
  }, [scene, targets, keyTarget]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.25);
    const s = getExperience();
    const setupProducer = rt.rooms.producer;
    const setupStrategist = rt.rooms.strategist;
    const p = rt.look.palette;
    const day = rt.look.theme;
    const env = rt.env;
    const a = rt.avatar;
    const lvl = (room: "producer" | "strategist") => (room === "producer" ? setupProducer : setupStrategist);

    if (hemi.current) {
      hemi.current.color.copy(p.sky);
      hemi.current.groundColor.copy(p.ground);
      hemi.current.intensity = p.ambient * 1.6 * (0.45 + 0.55 * Math.max(setupProducer, setupStrategist));
    }

    if (key.current) {
      // moonlight from the back by night, daylight from the front-right by day
      const nx = -6 + 16 * day;
      const nz = -10 + 22 * day;
      key.current.position.set(rt.camera.pos.x * 0.5 + 4 + nx, 16, nz);
      keyTarget.position.set(rt.camera.pos.x * 0.5 + 4, 0, -1);
      key.current.target = keyTarget;
      key.current.color.copy(p.key);
      key.current.intensity = p.keyIntensity * 1.4 * (0.5 + 0.5 * Math.max(setupProducer, setupStrategist));
    }

    for (let i = 0; i < SPOTS.length; i++) {
      const light = spots.current[i];
      const spec = SPOTS[i];
      if (!light) continue;
      if (i === 0) {
        // the key follows Satyam: from above, in front, slightly to his right
        const f = { x: Math.sin(a.yaw), z: Math.cos(a.yaw) };
        light.position.set(a.pos.x + f.x * 2.2 - f.z * 1.2, 5.4, a.pos.z + f.z * 2.2 + f.x * 1.2);
        targets[0].position.set(a.pos.x, 1.1, a.pos.z);
        light.color.copy(tmp.warm).lerp(tmp.cool, rt.look.room);
        const level = Math.max(setupProducer * (1 - rt.look.room), setupStrategist * rt.look.room, 0.35);
        light.intensity = damp(light.intensity, spec.power * level * p.practical, 3, dt);
      } else {
        light.position.copy(spec.pos);
        targets[i].position.copy(spec.target);
        light.color.set(spec.color);
        light.intensity = damp(light.intensity, spec.power * lvl(spec.room) * p.practical, 2.5, dt);
      }
      light.target = targets[i];
      light.angle = spec.angle;
      light.penumbra = spec.penumbra;
    }

    const flicker = 0.82 + 0.18 * Math.sin(rt.time * 13.1) * Math.sin(rt.time * 7.3 + 1.1);
    const pts: [number, number, number, string, number, number][] = [
      // x, y, z, colour, candela, range
      [-2.2, 2.7, 0.3, "#ffcf94", 22 * setupProducer, 6],
      [STAGE.fire.x, 1.3, STAGE.fire.z + 0.4, "#ff7a2a", 55 * env.fire * flicker, 9],
      [24, 2.3, -0.4, "#8fb8ff", 26 * setupStrategist, 7],
      env.strings > env.door
        ? [0.5, 4.6, 0.2, "#ffc27a", 60 * env.strings, 14]
        : [STAGE.door.x, 2.6, STAGE.door.z + 1.4, "#ffe6c4", 70 * env.door, 12],
    ];
    pts.forEach(([x, y, z, color, power, range], i) => {
      const light = points.current[i];
      if (!light) return;
      light.position.set(x, y, z);
      light.color.set(color);
      light.distance = range;
      light.intensity = damp(light.intensity, power * (i === 1 ? 1 : p.practical), i === 1 ? 10 : 2.5, dt);
    });

    // a soft fill that stays with Satyam so the dark suit always reads
    if (fill.current) {
      fill.current.position.set(rt.camera.pos.x * 0.35 + a.pos.x * 0.65, 2.3, a.pos.z + 2.2);
      fill.current.color.copy(p.accent).lerp(tmp.cool, 0.5);
      fill.current.intensity = damp(fill.current.intensity, (s.mode === "landing" ? 2 : 5) * (1 - day * 0.6), 2, dt);
    }
  }, -1);

  const shadowSize = tier === "high" ? 2048 : 1024;
  return (
    <>
      <hemisphereLight ref={hemi} args={["#202838", "#0a0a0a", 0.3]} />
      <directionalLight
        ref={key}
        intensity={0}
        castShadow={shadows}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      {SPOTS.map((_, i) => (
        <spotLight key={`s${i}`} ref={(el) => void (spots.current[i] = el)} intensity={0} decay={1.6} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <pointLight key={`p${i}`} ref={(el) => void (points.current[i] = el)} intensity={0} decay={1.8} />
      ))}
      <pointLight ref={fill} intensity={0} distance={7} decay={1.6} />
    </>
  );
}
