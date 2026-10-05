"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Color, FogExp2 } from "three";

import { rt } from "@/systems/SceneManager/director";
import { clamp, damp } from "@/systems/SceneManager/space";
import { useStory } from "@/systems/StoryEngine/store";

/**
 * ATMOSPHERE — fog, background and exposure, eased toward the current
 * world's palette (the environment "transforms" as you cross over). Fog
 * thickens inside corridors so one world can dissolve into the next.
 * Reflections come from a tiny studio environment built from light panels,
 * so no HDR file is downloaded.
 */
export function Atmosphere() {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const fog = useMemo(() => new FogExp2("#000000", 0.03), []);
  const bg = useMemo(() => new Color("#000000"), []);
  const target = useMemo(() => new Color(), []);

  useEffect(() => {
    scene.fog = fog;
    scene.background = bg;
    return () => {
      scene.fog = null;
      scene.background = null;
    };
  }, [scene, fog, bg]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const sc = rt.active;
    if (!sc) return;
    const pal = sc.layout.paletteAt ? sc.layout.paletteAt(rt.avatar.u) : sc.layout.palette;
    const s = useStory.getState();
    let density = pal.fogDensity;
    // without bloom (low tier) emissive light reads flatter — lift exposure a little
    let exposure = pal.exposure * (s.tier === "low" ? 1.18 : 1.08);

    // corridor: fog peaks at the swap point, hiding one world as the next assembles
    const t = rt.transit;
    if (t?.kind === "walk") {
      const d = Math.abs(t.s - t.swapAt);
      density = Math.max(density, 0.012 + 0.11 * Math.exp(-(d * d) / 18));
    }
    // opening: start in near-darkness
    if (s.phase === "intro") {
      const k = clamp((rt.intro.t - 2.6) / 5, 0, 1);
      density = density + (0.16 - density) * (1 - k);
      exposure *= 0.35 + 0.65 * k;
    }
    target.set(pal.fog);
    const lerp = 1 - Math.exp(-1.6 * dt);
    fog.color.lerp(target, lerp);
    bg.copy(fog.color);
    fog.density = damp(fog.density, density, t ? 4 : 1.4, dt);
    gl.toneMappingExposure = damp(gl.toneMappingExposure, exposure, 1.5, dt);
  }, -1);

  return (
    <Environment resolution={128} frames={1} environmentIntensity={0.55}>
      <color attach="background" args={["#050506"]} />
      <Lightformer form="rect" intensity={2.2} color="#ffd3a0" position={[0, 6, -6]} scale={[10, 2, 1]} />
      <Lightformer form="rect" intensity={1.2} color="#9ab8ff" position={[-8, 3, 4]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
      <Lightformer form="rect" intensity={0.8} color="#ffffff" position={[8, 2, 2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
      <Lightformer form="ring" intensity={1.5} color="#ffb870" position={[0, 9, 0]} rotation-x={Math.PI / 2} scale={3} />
    </Environment>
  );
}
