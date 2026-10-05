"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { AdditiveBlending, Color, CylinderGeometry, DoubleSide, ShaderMaterial } from "three";

import { rt } from "@/systems/Experience/runtime";

/**
 * Fake volumetric light: an additive cone whose brightness falls off along its
 * length and toward its edges, with slow drifting noise — light cutting
 * through haze. Point it by placing/rotating the group; the cone opens downward.
 * Fades by day (haze reads as glare in a bright room) and with its room's light.
 */
const vert = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const frag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uLength;
  uniform float uTime;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vView;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
  float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
  void main() {
    float along = clamp(0.5 - vPos.y / uLength, 0.0, 1.0);
    float fall = pow(1.0 - along, 1.6) * smoothstep(0.0, 0.06, along);
    float edge = pow(abs(dot(vNormal, vView)), 1.4);
    float n = 0.75 + 0.25 * noise(vec2(atan(vPos.x, vPos.z) * 3.0, vPos.y * 0.6 - uTime * 0.15));
    gl_FragColor = vec4(uColor, fall * edge * n * uOpacity);
  }
`;

export function LightShaft({
  length = 6,
  radius = 1.6,
  color = "#ffd2a0",
  opacity = 0.18,
  top = 0.08,
  level,
  room,
}: {
  level?: { current: number };
  /** Fade with this room's light level. */
  room?: "producer" | "strategist";
  length?: number;
  radius?: number;
  color?: string;
  opacity?: number;
  top?: number;
}) {
  // a truncated cone: lamp-lens radius at the top, widening down to `radius`
  const geo = useMemo(() => new CylinderGeometry(top, radius, length, 40, 1, true), [length, radius, top]);
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        blending: AdditiveBlending,
        uniforms: {
          uColor: { value: new Color(color) },
          uOpacity: { value: opacity },
          uLength: { value: length },
          uTime: { value: 0 },
        },
      }),
    [color, opacity, length],
  );
  useFrame(() => {
    mat.uniforms.uTime.value = rt.time;
    const roomLevel = room ? rt.rooms[room] : 1;
    mat.uniforms.uOpacity.value = opacity * (level ? level.current : 1) * roomLevel * rt.look.palette.haze;
  });
  return (
    <mesh geometry={geo} material={mat} position={[0, -length / 2, 0]} renderOrder={2} userData={{ shaft: true }} raycast={() => null} />
  );
}
