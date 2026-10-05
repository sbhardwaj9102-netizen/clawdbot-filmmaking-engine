"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, Color, type Group, type Mesh, MeshBasicMaterial, MeshStandardMaterial, TorusGeometry } from "three";

import { radialTexture } from "@/lib/canvasTextures";
import { clamp, damp } from "@/lib/math";
import { rt } from "@/systems/Experience/runtime";
import { getExperience } from "@/systems/Experience/store";

/**
 * PA-1 — the production assistant. A small hovering unit: a white shell, a
 * dark visor with two amber eyes, an antenna, and a production headset with
 * a boom mic (it is, after all, on set). It drifts beside Satyam, blinks,
 * turns to the audience when it talks, and its eyes move with its voice.
 */
export function Robot() {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const eyes = useRef<Group>(null);
  const antenna = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);
  const state = useRef({ blink: 0, nextBlink: 3, talk: 0, tilt: 0, roll: 0, prevYaw: 0, prev: { x: 0, z: 0 } });

  const mat = useMemo(
    () => ({
      shell: new MeshStandardMaterial({ color: "#ebe7df", roughness: 0.32, metalness: 0.05 }),
      shellDark: new MeshStandardMaterial({ color: "#2a2b2f", roughness: 0.45, metalness: 0.5 }),
      visor: new MeshStandardMaterial({ color: "#07080b", roughness: 0.08, metalness: 0.7 }),
      eye: new MeshBasicMaterial({ color: new Color("#ffb45e").multiplyScalar(2.4), toneMapped: false }),
      tip: new MeshBasicMaterial({ color: new Color("#ffb45e").multiplyScalar(2), toneMapped: false }),
      glow: new MeshBasicMaterial({
        map: radialTexture("rgba(255,196,120,0.9)", "rgba(255,196,120,0)"),
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
      shadow: new MeshBasicMaterial({ map: radialTexture("rgba(0,0,0,0.55)", "rgba(0,0,0,0)"), transparent: true, depthWrite: false }),
    }),
    [],
  );
  const ring = useMemo(() => new TorusGeometry(0.13, 0.018, 10, 32), []);
  useEffect(
    () => () => {
      Object.values(mat).forEach((m) => m.dispose());
      ring.dispose();
    },
    [mat, ring],
  );

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.25);
    const g = root.current;
    if (!g) return;
    const r = rt.robot;
    const st = state.current;
    const reduced = getExperience().reducedMotion;

    g.position.copy(r.pos);
    g.rotation.y = r.yaw;
    g.visible = r.presence > 0.02;

    // lean into motion, bank into turns
    const vx = (r.pos.x - st.prev.x) / Math.max(dt, 1e-4);
    const vz = (r.pos.z - st.prev.z) / Math.max(dt, 1e-4);
    st.prev = { x: r.pos.x, z: r.pos.z };
    const fwd = vx * Math.sin(r.yaw) + vz * Math.cos(r.yaw);
    const yawRate = (r.yaw - st.prevYaw) / Math.max(dt, 1e-4);
    st.prevYaw = r.yaw;
    st.tilt = damp(st.tilt, reduced ? 0 : clamp(fwd * 0.12, -0.3, 0.3), 4, dt);
    st.roll = damp(st.roll, reduced ? 0 : clamp(-yawRate * 0.08, -0.25, 0.25), 4, dt);

    // talking: a syllable-ish envelope while a line is up
    const talking = r.speaking ? 1 : 0;
    st.talk = damp(st.talk, talking, 8, dt);
    const syll = talking ? 0.5 + 0.5 * Math.abs(Math.sin(rt.time * 11.3) * Math.sin(rt.time * 4.7 + 1)) : 0;

    if (body.current) {
      body.current.rotation.x = st.tilt + (reduced ? 0 : Math.sin(rt.time * 2.1) * 0.02) + st.talk * Math.sin(rt.time * 3.1) * 0.04;
      body.current.rotation.z = st.roll;
    }
    if (antenna.current) antenna.current.rotation.z = reduced ? 0 : Math.sin(rt.time * 2.6) * 0.12 + st.roll * 0.6;

    // blink now and then
    st.nextBlink -= dt;
    if (st.nextBlink <= 0) {
      st.blink = 1;
      st.nextBlink = 2.5 + Math.random() * 3.5;
    }
    st.blink = Math.max(0, st.blink - dt * 7);
    if (eyes.current) {
      const open = 1 - Math.sin(st.blink * Math.PI);
      eyes.current.scale.y = Math.max(0.12, open * (1 + syll * 0.35 * st.talk));
    }
    mat.eye.color.setRGB(1, 0.71, 0.37).multiplyScalar(2 + st.talk * 1.4 * syll);
    mat.tip.color.setRGB(1, 0.71, 0.37).multiplyScalar(talking && Math.sin(rt.time * 9) > 0 ? 3 : 1.2);
    mat.glow.opacity = 0.35 + 0.15 * Math.sin(rt.time * 3);

    if (shadow.current) {
      shadow.current.position.set(r.pos.x, 0.013, r.pos.z);
      const h = clamp(r.pos.y, 0.5, 8);
      shadow.current.scale.setScalar(0.5 + h * 0.18);
      (shadow.current.material as MeshBasicMaterial).opacity = clamp(1.4 - h * 0.3, 0, 0.8) * r.presence * (1 - rt.look.theme * 0.35);
    }
  });

  return (
    <>
      <mesh ref={shadow} rotation-x={-Math.PI / 2} material={mat.shadow} renderOrder={1} raycast={() => null}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <group ref={root} name="robot">
        <group ref={body}>
          {/* shell */}
          <RoundedBox args={[0.44, 0.34, 0.36]} radius={0.12} smoothness={4} material={mat.shell} castShadow />
          {/* visor + eyes */}
          <RoundedBox args={[0.34, 0.17, 0.04]} radius={0.05} smoothness={3} position={[0, 0.01, 0.17]} material={mat.visor} />
          <group ref={eyes} position={[0, 0.012, 0.193]}>
            {[-0.065, 0.065].map((x) => (
              <RoundedBox key={x} args={[0.07, 0.05, 0.006]} radius={0.02} smoothness={2} position={[x, 0, 0]} material={mat.eye} />
            ))}
          </group>
          {/* side lenses */}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.222, 0, 0]} rotation-y={(s * Math.PI) / 2}>
              <mesh material={mat.shellDark}>
                <cylinderGeometry args={[0.07, 0.07, 0.03, 24]} />
              </mesh>
              <mesh material={mat.visor} position={[0, 0, 0]} rotation-x={Math.PI / 2}>
                <cylinderGeometry args={[0.045, 0.045, 0.034, 20]} />
              </mesh>
            </group>
          ))}
          {/* production headset: band over the top, boom mic to the front */}
          <mesh material={mat.shellDark} position={[0, 0.02, 0]} rotation-z={Math.PI / 2} scale={[1.65, 1.55, 1]}>
            <torusGeometry args={[0.14, 0.008, 6, 24, Math.PI]} />
          </mesh>
          <group position={[-0.235, -0.02, 0.02]} rotation={[0, -0.35, 0.25]}>
            <mesh material={mat.shellDark} position={[0, -0.03, 0.08]} rotation-x={Math.PI / 2 - 0.25}>
              <cylinderGeometry args={[0.006, 0.006, 0.18, 6]} />
            </mesh>
            <mesh material={mat.shellDark} position={[0, -0.055, 0.17]}>
              <sphereGeometry args={[0.016, 10, 8]} />
            </mesh>
          </group>
          {/* antenna */}
          <group ref={antenna} position={[0.09, 0.17, -0.04]}>
            <mesh material={mat.shellDark} position={[0, 0.07, 0]}>
              <cylinderGeometry args={[0.006, 0.008, 0.14, 6]} />
            </mesh>
            <mesh material={mat.tip} position={[0, 0.15, 0]}>
              <sphereGeometry args={[0.018, 10, 8]} />
            </mesh>
          </group>
          {/* hover ring + soft glow beneath */}
          <mesh geometry={ring} material={mat.shellDark} position={[0, -0.2, 0]} rotation-x={Math.PI / 2} />
          <mesh material={mat.glow} position={[0, -0.24, 0]} rotation-x={-Math.PI / 2} raycast={() => null}>
            <planeGeometry args={[0.5, 0.5]} />
          </mesh>
        </group>
      </group>
    </>
  );
}
