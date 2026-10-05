"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CylinderGeometry, type Group, Matrix4, type Mesh, SphereGeometry, TorusGeometry, Vector3 } from "three";

import { radialTexture } from "@/lib/canvasTextures";
import { clamp, damp } from "@/lib/math";
import { rt } from "@/systems/Experience/runtime";
import { useExperience } from "@/systems/Experience/store";

import { AVATAR_MATERIALS, hair, head, limb, pelvis, torso } from "./geometry";

/**
 * THE AVATAR — Satyam, the protagonist. One persistent figure that walks
 * between his marks, stops, turns and looks at the work.
 *
 * The rig is a plain transform hierarchy animated procedurally:
 *   walk cycle (stride/cadence from speed) · idle breathing & weight shift ·
 *   head/neck look-at · right-arm reach. Silent: no footsteps.
 */

const TWO_PI = Math.PI * 2;

type Bones = {
  hips: Group;
  spine: Group;
  chest: Group;
  neck: Group;
  head: Group;
  armL: Group;
  armR: Group;
  elbowL: Group;
  elbowR: Group;
  wristL: Group;
  wristR: Group;
  thighL: Group;
  thighR: Group;
  kneeL: Group;
  kneeR: Group;
  ankleL: Group;
  ankleR: Group;
};

export function Avatar({ castShadow = false }: { castShadow?: boolean }) {
  const root = useRef<Group>(null);
  const b = useRef<Partial<Bones>>({});
  const shadow = useRef<Mesh>(null);
  const reduced = useExperience((s) => s.reducedMotion);

  const geo = useMemo(
    () => ({
      torso: torso(),
      pelvis: pelvis(),
      head: head(),
      hair: hair(),
      upperArm: limb(0.052, 0.043, 0.29),
      forearm: limb(0.044, 0.035, 0.25),
      hand: limb(0.036, 0.026, 0.12, 10),
      thumb: limb(0.014, 0.011, 0.05, 8),
      thigh: limb(0.08, 0.058, 0.43),
      shin: limb(0.058, 0.044, 0.42),
      neck: new CylinderGeometry(0.05, 0.054, 0.12, 16),
      collar: new TorusGeometry(0.062, 0.016, 8, 24),
      shoulder: new SphereGeometry(0.066, 16, 12),
      ear: new SphereGeometry(0.022, 10, 8),
      nose: new SphereGeometry(0.016, 10, 8),
      cuff: new CylinderGeometry(0.037, 0.037, 0.02, 14),
    }),
    [],
  );
  const mat = useMemo(() => AVATAR_MATERIALS(), []);
  const shadowTex = useMemo(() => radialTexture("rgba(0,0,0,0.7)", "rgba(0,0,0,0)"), []);

  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose());
      Object.values(mat).forEach((m) => m.dispose());
    },
    [geo, mat],
  );

  const state = useRef({ phase: 0, w: 0, lookYaw: 0, lookPitch: 0, reach: 0, breathe: 0, prevYaw: 0, turn: 0 });
  const inv = useMemo(() => new Matrix4(), []);
  const local = useMemo(() => new Vector3(), []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const a = rt.avatar;
    const g = root.current;
    const B = b.current as Bones;
    if (!g || !B.hips) return;
    const st = state.current;

    g.position.copy(a.pos);
    g.rotation.y = a.yaw;
    if (shadow.current) shadow.current.position.set(a.pos.x, 0.012, a.pos.z);

    // turning in place → small shuffle
    const yawRate = Math.abs(a.yaw - st.prevYaw) / Math.max(dt, 1e-4);
    st.prevYaw = a.yaw;
    st.turn = damp(st.turn, a.speed < 0.15 && yawRate > 0.9 ? 1 : 0, 6, dt);

    const speed = Math.max(a.speed, st.turn * 0.35);
    st.w = damp(st.w, clamp(speed / 0.9, 0, 1), 5, dt);
    const stride = 1.15 + 0.32 * Math.min(speed, 2.2);
    st.phase = (st.phase + (dt * TWO_PI * Math.max(speed, st.turn * 0.5)) / stride) % TWO_PI;
    const w = st.w;
    const ph = st.phase;
    const amp = 0.34 + 0.12 * Math.min(speed / 2, 1);

    // legs
    const leg = (thigh: Group, knee: Group, ankle: Group, p: number) => {
      const t = -amp * Math.sin(p) * w;
      const k = w * (0.06 + 1.0 * Math.pow(Math.max(0, Math.cos(p + 0.4)), 3)) + 0.03;
      thigh.rotation.x = t;
      knee.rotation.x = k;
      ankle.rotation.x = -(t + k) * 0.82 + w * 0.32 * Math.pow(Math.max(0, -Math.sin(p)), 4);
    };
    leg(B.thighL, B.kneeL, B.ankleL, ph);
    leg(B.thighR, B.kneeR, B.ankleR, ph + Math.PI);

    // pelvis & torso
    st.breathe += dt;
    const idle = 1 - w;
    const shift = reduced ? 0 : Math.sin(st.breathe * 0.45) * 0.012 * idle;
    B.hips.position.y = 0.97 + w * (0.012 * Math.cos(2 * ph) - 0.016);
    B.hips.position.x = -0.016 * Math.cos(ph) * w + shift;
    B.hips.rotation.y = -0.085 * Math.sin(ph) * w;
    B.hips.rotation.z = 0.035 * Math.cos(ph) * w + shift * 1.5;
    B.spine.rotation.x = 0.05 * w + 0.02;
    B.spine.rotation.y = 0.05 * Math.sin(ph) * w;
    const breath = reduced ? 0 : Math.sin(st.breathe * 1.45) * 0.014;
    B.chest.rotation.x = -0.02 + breath * idle - 0.03 * w;
    B.chest.rotation.y = 0.07 * Math.sin(ph) * w;

    // look-at
    let yaw = 0;
    let pitch = 0;
    if (a.look) {
      g.updateMatrixWorld();
      inv.copy(g.matrixWorld).invert();
      local.copy(a.look).applyMatrix4(inv);
      yaw = clamp(Math.atan2(local.x, local.z), -1.15, 1.15);
      const horiz = Math.hypot(local.x, local.z);
      pitch = clamp(Math.atan2(local.y - 1.65, Math.max(horiz, 0.3)), -0.6, 0.35);
      if (Math.abs(Math.atan2(local.x, local.z)) > 2.2) yaw = 0;
    }
    st.lookYaw = damp(st.lookYaw, yaw, 4, dt);
    st.lookPitch = damp(st.lookPitch, pitch, 4, dt);
    B.chest.rotation.y += st.lookYaw * 0.18;
    B.neck.rotation.y = st.lookYaw * 0.32 - B.chest.rotation.y * 0.5 - B.spine.rotation.y * 0.5;
    B.head.rotation.y = st.lookYaw * 0.5;
    B.neck.rotation.x = -st.lookPitch * 0.35 + 0.04 * w;
    B.head.rotation.x = -st.lookPitch * 0.65 + 0.02;

    // arms
    const swing = 0.36 * Math.sin(ph) * w;
    st.reach = damp(st.reach, a.reachTarget ? 1 : 0, 3.2, dt);
    let reachPitch = -0.95;
    if (a.reachTarget) {
      local.copy(a.reachTarget).applyMatrix4(inv);
      reachPitch = -clamp(0.95 + (local.y - 1.25) * 1.1, 0.45, 1.5);
    }
    const r = st.reach;
    B.armL.rotation.x = swing + idle * 0.02;
    B.armL.rotation.z = 0.075 + w * 0.02;
    B.elbowL.rotation.x = -(0.16 + w * (0.2 + 0.25 * Math.max(0, -Math.sin(ph))));
    B.armR.rotation.x = (-swing + idle * 0.02) * (1 - r) + reachPitch * r;
    B.armR.rotation.z = -(0.075 + w * 0.02) * (1 - r) - 0.12 * r;
    B.elbowR.rotation.x = -(0.16 + w * (0.2 + 0.25 * Math.max(0, Math.sin(ph)))) * (1 - r) - 0.32 * r;
    B.wristR.rotation.x = -0.1 * r;
  }, -2);

  const shadowOn = { castShadow, receiveShadow: false };
  const set = (k: keyof Bones) => (el: Group | null) => {
    if (el) b.current[k] = el;
  };

  return (
    <>
      <mesh ref={shadow} rotation-x={-Math.PI / 2} renderOrder={1}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={root} name="avatar">
        <group ref={set("hips")} position={[0, 0.97, 0]}>
          <mesh geometry={geo.pelvis} material={mat.trousers} {...shadowOn} />
          {/* legs */}
          {(["L", "R"] as const).map((side) => {
            const x = side === "L" ? 0.094 : -0.094;
            return (
              <group key={side} ref={set(`thigh${side}`)} position={[x, -0.07, 0]}>
                <mesh geometry={geo.thigh} material={mat.trousers} {...shadowOn} />
                <group ref={set(`knee${side}`)} position={[0, -0.43, 0]}>
                  <mesh geometry={geo.shin} material={mat.trousers} {...shadowOn} />
                  <group ref={set(`ankle${side}`)} position={[0, -0.42, 0]}>
                    <RoundedBox args={[0.1, 0.075, 0.27]} radius={0.032} smoothness={3} position={[0, -0.012, 0.055]} material={mat.shoes} {...shadowOn} />
                  </group>
                </group>
              </group>
            );
          })}
          {/* torso */}
          <group ref={set("spine")} position={[0, 0.1, 0]}>
            <mesh geometry={geo.torso} material={mat.jacket} {...shadowOn} />
            <group ref={set("chest")} position={[0, 0.3, 0]}>
              <mesh geometry={geo.shoulder} material={mat.jacket} position={[0.168, 0.066, 0]} scale={[1, 0.8, 0.92]} />
              <mesh geometry={geo.shoulder} material={mat.jacket} position={[-0.168, 0.066, 0]} scale={[1, 0.8, 0.92]} />
              <mesh geometry={geo.collar} material={mat.shirt} position={[0, 0.17, 0.004]} rotation-x={Math.PI / 2} />
              <group ref={set("neck")} position={[0, 0.17, 0.0]}>
                <mesh geometry={geo.neck} material={mat.skin} position={[0, 0.05, 0]} />
                <group ref={set("head")} position={[0, 0.07, 0.008]} scale={0.93}>
                  <mesh geometry={geo.head} material={mat.skin} position={[0, 0.105, 0.0]} {...shadowOn} />
                  <mesh geometry={geo.hair} material={mat.hair} position={[0, 0.105, -0.012]} rotation-x={-0.32} />
                  <mesh geometry={geo.ear} material={mat.skin} position={[0.093, 0.1, -0.005]} scale={[0.45, 1.25, 0.9]} />
                  <mesh geometry={geo.ear} material={mat.skin} position={[-0.093, 0.1, -0.005]} scale={[0.45, 1.25, 0.9]} />
                  <mesh geometry={geo.nose} material={mat.skin} position={[0, 0.088, 0.1]} scale={[0.8, 1.6, 1.1]} />
                </group>
              </group>
              {/* arms */}
              {(["L", "R"] as const).map((side) => {
                const x = side === "L" ? 0.2 : -0.2;
                return (
                  <group key={side} ref={set(`arm${side}`)} position={[x, 0.07, -0.005]}>
                    <mesh geometry={geo.upperArm} material={mat.jacket} {...shadowOn} />
                    <group ref={set(`elbow${side}`)} position={[0, -0.29, 0]}>
                      <mesh geometry={geo.forearm} material={mat.jacket} {...shadowOn} />
                      <mesh geometry={geo.cuff} material={side === "L" ? mat.watch : mat.shirt} position={[0, -0.24, 0]} />
                      <group ref={set(`wrist${side}`)} position={[0, -0.255, 0]}>
                        <mesh geometry={geo.hand} material={mat.skin} scale={[1, 1, 0.55]} position={[0, -0.01, 0.005]} />
                        <mesh
                          geometry={geo.thumb}
                          material={mat.skin}
                          position={[side === "L" ? -0.02 : 0.02, -0.02, 0.022]}
                          rotation={[0.3, 0, side === "L" ? -0.35 : 0.35]}
                        />
                      </group>
                    </group>
                  </group>
                );
              })}
            </group>
          </group>
        </group>
      </group>
    </>
  );
}
