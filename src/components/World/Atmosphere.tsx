"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Color, FogExp2 } from "three";

import { damp, smoothstep } from "@/lib/math";
import { blendPalette } from "@/scenes/palettes";
import { rt } from "@/systems/Experience/runtime";
import { getExperience } from "@/systems/Experience/store";

import { applyTheme } from "./themed";

/**
 * ATMOSPHERE — works out the look of the frame first thing every frame:
 * theme (eased when the visitor switches), which room the camera is in,
 * and from those the blended palette everyone else reads (rt.look). Then
 * sets fog, background and exposure. Reflections come from a small studio
 * environment built from light panels, so no HDR file is downloaded.
 */
export function Atmosphere() {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const fog = useMemo(() => new FogExp2("#09090b", 0.024), []);
  const bg = useMemo(() => new Color("#09090b"), []);

  useEffect(() => {
    scene.fog = fog;
    scene.background = bg;
    return () => {
      scene.fog = null;
      scene.background = null;
    };
  }, [scene, fog, bg]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.25);
    const s = getExperience();
    const look = rt.look;
    look.theme = damp(look.theme, s.theme === "light" ? 1 : 0, 3.2, dt);
    if (Math.abs(look.theme - (s.theme === "light" ? 1 : 0)) < 0.003) look.theme = s.theme === "light" ? 1 : 0;
    look.room = damp(look.room, smoothstep(6, 13, rt.camera.pos.x), 4, dt);
    const p = blendPalette(look.palette, look.theme, look.room);
    applyTheme(look.theme);

    fog.color.copy(p.fog);
    bg.copy(p.fog);
    // a little extra haze while the rooms are dark (landing), none by day
    const dim = 1 - Math.max(rt.rooms.producer, rt.rooms.strategist);
    fog.density = p.fogDensity * (1 + dim * 0.6);
    const exposure = p.exposure * (s.tier === "low" ? 1.12 : 1) * (0.78 + 0.22 * Math.max(rt.rooms.producer, rt.rooms.strategist));
    gl.toneMappingExposure = damp(gl.toneMappingExposure, exposure, 3, dt);
  }, -2);

  return (
    <Environment resolution={128} frames={1} environmentIntensity={0.6}>
      <color attach="background" args={["#0a0a0b"]} />
      <Lightformer form="rect" intensity={2.2} color="#ffd3a0" position={[0, 6, -6]} scale={[10, 2, 1]} />
      <Lightformer form="rect" intensity={1.2} color="#9ab8ff" position={[-8, 3, 4]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
      <Lightformer form="rect" intensity={0.9} color="#ffffff" position={[8, 2, 2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
      <Lightformer form="ring" intensity={1.5} color="#ffb870" position={[0, 9, 0]} rotation-x={Math.PI / 2} scale={3} />
    </Environment>
  );
}
