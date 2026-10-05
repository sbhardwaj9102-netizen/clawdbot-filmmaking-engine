"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, type DirectionalLight, type HemisphereLight, Object3D, type PointLight, type SpotLight, Vector3 } from "three";

import type { LightSpec } from "@/scenes/types";
import { rt } from "@/systems/SceneManager/director";
import { clamp, damp, toWorld } from "@/systems/SceneManager/space";
import { useStory } from "@/systems/StoryEngine/store";

/**
 * LIGHT RIG — a fixed set of light slots (1 hemisphere, 1 key, 4 spots,
 * 4 points, 1 avatar fill). Worlds describe their lighting as data; the rig
 * moves the slots and fades them. Because the number of lights never
 * changes, crossing between worlds never recompiles a shader.
 * New worlds "power on": intensities ramp up after each swap.
 */

const SPOTS = 4;
const POINTS = 4;
/** Layout intensities are authored as relative values; these map them to physical units. */
const SPOT_GAIN = 3.2;
const POINT_GAIN = 3;
const AMBIENT_GAIN = 2.2;

export function LightRig({ shadows }: { shadows: boolean }) {
  const scene = useThree((s) => s.scene);
  const hemi = useRef<HemisphereLight>(null);
  const key = useRef<DirectionalLight>(null);
  const fill = useRef<PointLight>(null);
  const spots = useRef<(SpotLight | null)[]>([]);
  const points = useRef<(PointLight | null)[]>([]);
  const targets = useMemo(() => Array.from({ length: SPOTS }, () => new Object3D()), []);
  const keyTarget = useMemo(() => new Object3D(), []);
  const state = useRef({ scene: "", power: 0, intensities: new Float32Array(SPOTS + POINTS + 2) });
  const tmp = useMemo(() => ({ c: new Color(), v: new Vector3() }), []);
  const tier = useStory((s) => s.tier);

  useEffect(() => {
    targets.forEach((t) => scene.add(t));
    scene.add(keyTarget);
    return () => {
      targets.forEach((t) => scene.remove(t));
      scene.remove(keyTarget);
    };
  }, [scene, targets, keyTarget]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const sc = rt.active;
    if (!sc) return;
    const st = state.current;
    const L = sc.layout;
    const pal = L.paletteAt ? L.paletteAt(rt.avatar.u) : L.palette;

    if (st.scene !== sc.id) {
      st.scene = sc.id;
      st.power = rt.transit ? 0 : 0.2;
    }
    st.power = Math.min(1, st.power + dt * 0.55);

    // dim the world we are leaving while walking into the corridor
    let dim = 1;
    const t = rt.transit;
    if (t?.kind === "walk" && !t.swapped) dim = clamp(1 - (t.s - (t.swapAt - 8)) / 8, 0.05, 1);
    const intro = useStory.getState().phase === "intro" ? clamp((rt.intro.t - 3.2) / 4, 0, 1) : 1;
    const power = st.power * st.power * (3 - 2 * st.power) * dim * intro;

    if (hemi.current) {
      hemi.current.color.lerp(tmp.c.set(pal.sky), 1 - Math.exp(-2 * dt));
      hemi.current.groundColor.lerp(tmp.c.set(pal.ground), 1 - Math.exp(-2 * dt));
      hemi.current.intensity = damp(hemi.current.intensity, pal.ambient * AMBIENT_GAIN * Math.max(0.25, power), 2, dt);
    }

    if (key.current) {
      const k = L.key;
      const ap = rt.avatar.pos;
      tmp.v.set(k.dir[0], 0, k.dir[2]).applyAxisAngle(new Vector3(0, 1, 0), sc.anchor.yaw);
      key.current.position.set(ap.x - tmp.v.x * 18, 18 * Math.max(0.3, -k.dir[1]), ap.z - tmp.v.z * 18);
      keyTarget.position.set(ap.x, 0, ap.z);
      key.current.target = keyTarget;
      key.current.color.lerp(tmp.c.set(k.color), 1 - Math.exp(-2 * dt));
      key.current.intensity = damp(key.current.intensity, k.intensity * 2.4 * power, 2.5, dt);
    }

    const specs = L.lightsAt ? L.lightsAt(rt.avatar.u) : L.lights;
    const spotSpecs = specs.filter((l): l is Extract<LightSpec, { kind: "spot" }> => l.kind === "spot").slice(0, SPOTS);
    const pointSpecs = specs.filter((l): l is Extract<LightSpec, { kind: "point" }> => l.kind === "point").slice(0, POINTS);

    for (let i = 0; i < SPOTS; i++) {
      const light = spots.current[i];
      if (!light) continue;
      const spec = spotSpecs[i];
      if (!spec) {
        light.intensity = damp(light.intensity, 0, 4, dt);
        continue;
      }
      toWorld(sc.anchor, spec.pos, light.position);
      toWorld(sc.anchor, spec.target, targets[i].position);
      light.target = targets[i];
      light.color.set(spec.color);
      light.angle = spec.angle ?? 0.5;
      light.penumbra = spec.penumbra ?? 0.6;
      light.distance = spec.distance ?? 0;
      light.intensity = damp(light.intensity, spec.intensity * SPOT_GAIN * power, 3, dt);
    }
    for (let i = 0; i < POINTS; i++) {
      const light = points.current[i];
      if (!light) continue;
      const spec = pointSpecs[i];
      if (!spec) {
        light.intensity = damp(light.intensity, 0, 4, dt);
        continue;
      }
      toWorld(sc.anchor, spec.pos, light.position);
      light.color.set(spec.color);
      light.distance = spec.distance ?? 0;
      light.intensity = damp(light.intensity, spec.intensity * POINT_GAIN * power, 3, dt);
    }

    // a soft fill that travels with the avatar so he always reads against the dark
    if (fill.current) {
      const a = rt.avatar;
      fill.current.position.set(a.pos.x + Math.sin(a.yaw) * 1.6, 2.4, a.pos.z + Math.cos(a.yaw) * 1.6);
      fill.current.color.lerp(tmp.c.set(pal.accent), 1 - Math.exp(-1.5 * dt));
      fill.current.intensity = damp(fill.current.intensity, 5 * Math.max(power, 0.3), 2, dt);
    }
  }, -1);

  const shadowSize = tier === "high" ? 2048 : 1024;
  return (
    <>
      <hemisphereLight ref={hemi} args={["#202838", "#0a0a0a", 0.2]} />
      <directionalLight
        ref={key}
        intensity={0}
        castShadow={shadows}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      {Array.from({ length: SPOTS }, (_, i) => (
        <spotLight key={`s${i}`} ref={(el) => void (spots.current[i] = el)} intensity={0} decay={1.6} />
      ))}
      {Array.from({ length: POINTS }, (_, i) => (
        <pointLight key={`p${i}`} ref={(el) => void (points.current[i] = el)} intensity={0} decay={1.8} />
      ))}
      <pointLight ref={fill} intensity={0} distance={7} decay={1.6} />
    </>
  );
}
