"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { ACESFilmicToneMapping, Vector3 } from "three";

import { Avatar } from "@/components/Avatar/Avatar";
import { CameraRig } from "@/components/Camera/CameraRig";
import { Atmosphere } from "@/components/World/Atmosphere";
import { Dust } from "@/components/World/Dust";
import { Floor } from "@/components/World/Floor";
import { LightRig } from "@/components/World/LightRig";
import { QUALITY } from "@/systems/Quality/quality";
import { rt, setProjector } from "@/systems/SceneManager/director";
import { SceneManager } from "@/systems/SceneManager/SceneManager";
import { useStory } from "@/systems/StoryEngine/store";

import { Effects } from "./Effects";

/**
 * THE STAGE — the WebGL canvas and everything permanent in it: atmosphere,
 * light rig, floor, haze, the avatar and the camera. Worlds come and go
 * through the SceneManager.
 */
export default function Stage({ onReady }: { onReady?: () => void }) {
  const tier = useStory((s) => s.tier);
  const q = QUALITY[tier];
  const [dpr, setDpr] = useState(q.dpr[1]);

  return (
    <Canvas
      dpr={dpr}
      shadows={q.shadows}
      gl={{ antialias: !q.post, powerPreference: "high-performance", alpha: false, stencil: false }}
      camera={{ fov: 40, near: 0.08, far: 260, position: [0, 1.7, 27] }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          useStory.setState({ webgl: false, overlay: "quick" });
        });
        onReady?.();
      }}
      style={{ position: "fixed", inset: 0 }}
      aria-hidden
    >
      <PerformanceMonitor
        bounds={() => [42, 58]}
        flipflops={3}
        onDecline={() => setDpr((d) => Math.max(q.dpr[0], +(d - 0.25).toFixed(2)))}
        onIncline={() => setDpr((d) => Math.min(q.dpr[1], +(d + 0.25).toFixed(2)))}
      />
      <Projector />
      <Atmosphere />
      <LightRig shadows={q.shadows} />
      <Floor reflector={q.reflector} />
      <Dust count={q.particles} />
      <SceneManager />
      <Avatar castShadow={q.shadows} />
      <CameraRig />
      {q.post && <Effects multisampling={tier === "high" ? 4 : 0} />}
    </Canvas>
  );
}

/** Registers world → screen projection (used to size the screen-dive) and the mobile flag. */
function Projector() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    (window as unknown as { __sb3?: unknown }).__sb3 = { scene, camera, gl };
  }, [scene, camera, gl]);
  useEffect(() => {
    const v = new Vector3();
    setProjector((p) => {
      v.copy(p).project(camera);
      return { x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height };
    });
    rt.mobile = size.width < 760 || window.matchMedia("(pointer: coarse)").matches;
  }, [camera, size]);
  return null;
}
