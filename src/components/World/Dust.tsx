"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, type Points, ShaderMaterial } from "three";

import { rt } from "@/systems/Experience/runtime";
import { useExperience } from "@/systems/Experience/store";

/**
 * Haze particles: dust drifting in the light. A box of points that wraps
 * around the camera, so the air is always full without spawning anything.
 */
const vert = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCenter;
  uniform float uSize;
  uniform float uMotion;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.11 * uMotion + aSeed * 6.28) * 0.6;
    p.y += uTime * 0.05 * uMotion * (0.4 + aSeed);
    p.z += cos(uTime * 0.09 * uMotion + aSeed * 3.1) * 0.6;
    vec3 box = vec3(28.0, 9.0, 28.0);
    vec3 rel = mod(p - uCenter + box * 0.5, box) - box * 0.5;
    vec3 world = uCenter + rel;
    world.y = mod(world.y, 9.0) + 0.1;
    vec4 mv = modelViewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.6 + aSeed) * (12.0 / -mv.z);
    float edge = 1.0 - smoothstep(9.0, 14.0, length(rel.xz));
    vAlpha = edge * (0.35 + 0.65 * aSeed);
  }
`;
const frag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, a * vAlpha * uOpacity);
  }
`;

const white = new Color("#ffffff");

export function Dust({ count }: { count: number }) {
  const ref = useRef<Points>(null);
  const reduced = useExperience((s) => s.reducedMotion);
  const geo = useMemo(() => {
    const g = new BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 28;
      pos[i * 3 + 1] = Math.random() * 9;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 28;
      seed[i] = Math.random();
    }
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new BufferAttribute(seed, 1));
    return g;
  }, [count]);
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uCenter: { value: rt.camera.pos.clone() },
          uSize: { value: 2.2 },
          uColor: { value: new Color("#ffdcb0") },
          uOpacity: { value: 0.35 },
          uMotion: { value: 1 },
        },
      }),
    [],
  );

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += Math.min(dt, 0.05);
    mat.uniforms.uCenter.value.copy(rt.camera.pos);
    mat.uniforms.uMotion.value = reduced ? 0 : 1;
    // warm motes in the producer's room, cooler in the strategist's; barely there by day
    mat.uniforms.uColor.value.copy(rt.look.palette.accent).lerp(white, 0.55);
    mat.uniforms.uOpacity.value = 0.35 * rt.look.palette.haze;
  });

  return <points ref={ref} geometry={geo} material={mat} frustumCulled={false} />;
}
