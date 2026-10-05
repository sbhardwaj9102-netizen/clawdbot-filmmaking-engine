"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { ACESFilmicToneMapping } from "three";

import { Avatar } from "@/components/Avatar/Avatar";
import { CameraRig } from "@/components/Camera/CameraRig";
import { Robot } from "@/components/Robot/Robot";
import { Atmosphere } from "@/components/World/Atmosphere";
import { Dust } from "@/components/World/Dust";
import { Floor } from "@/components/World/Floor";
import { LightRig } from "@/components/World/LightRig";
import { ProducerRoom } from "@/scenes/Producer/ProducerRoom";
import { ShiftZone } from "@/scenes/Shift/ShiftZone";
import { StrategistRoom } from "@/scenes/Strategist/StrategistRoom";
import { setExperience, useExperience } from "@/systems/Experience/store";
import { QUALITY } from "@/systems/Quality/quality";

import { Choreographer } from "./Choreographer";
import { Effects } from "./Effects";

/**
 * THE STAGE — the WebGL canvas: both rooms and the space between them, the
 * light rig, Satyam, PA-1 and the camera. Everything is mounted once; the
 * story moves the camera and the light, never the furniture.
 */
export default function Stage({ onReady }: { onReady?: () => void }) {
  const tier = useExperience((s) => s.tier);
  const q = QUALITY[tier];
  const [dpr, setDpr] = useState(q.dpr[1]);

  return (
    <Canvas
      dpr={dpr}
      shadows={q.shadows}
      gl={{ antialias: !q.post, powerPreference: "high-performance", alpha: false, stencil: false }}
      camera={{ fov: 40, near: 0.08, far: 320, position: [-0.6, 3.5, 13.5] }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          setExperience({ webgl: false });
        });
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
      <DebugHandle />
      <Choreographer />
      <Atmosphere />
      <LightRig shadows={q.shadows} />
      <Floor reflector={q.reflector} />
      <Dust count={q.particles} />
      <ProducerRoom />
      <ShiftZone />
      <StrategistRoom />
      <Avatar castShadow={q.shadows} />
      <Robot />
      <CameraRig />
      {q.post && <Effects multisampling={tier === "high" ? 4 : 0} />}
      <Ready onReady={onReady} />
    </Canvas>
  );
}

/** Tells the page the stage has drawn a few frames (shaders compiled, rooms in place). */
function Ready({ onReady }: { onReady?: () => void }) {
  const frames = useRef(0);
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    if (++frames.current >= 3) {
      done.current = true;
      onReady?.();
    }
  });
  return null;
}

/** Test / debug hook. */
function DebugHandle() {
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    (window as unknown as { __sb3?: unknown }).__sb3 = { scene, camera, gl };
  }, [scene, camera, gl]);
  return null;
}
