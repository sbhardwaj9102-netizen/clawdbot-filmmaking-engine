"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BoxGeometry, Color, type Group, type InstancedMesh, MeshBasicMaterial, Object3D, SphereGeometry } from "three";

import { Hotspot } from "@/components/InteractiveObject/Hotspot";
import { LightShaft } from "@/components/World/LightShaft";
import { M } from "@/components/World/materials";
import { Sign } from "@/components/World/props/Architecture";
import { Assemble, since, useWorldEvent } from "@/components/World/WorldContext";
import { clamp } from "@/systems/SceneManager/space";

import { NODES, nodeHotspot, RING_CENTER } from "./layout";

/**
 * BUILD IT — what if you built the system? Eight monoliths for the parts of a
 * production business, wired to a core. The ones holding real work (strategy,
 * teams, content, infrastructure) can be opened; the rest are the ambition.
 * The network switches on as the question lands.
 */
export function BusinessWorld() {
  const on = useWorldEvent("network-on");
  const power = useRef(0);
  const core = useRef<Group>(null);
  const lineMat = useMemo(() => new MeshBasicMaterial({ color: new Color("#ffe0a3"), transparent: true, opacity: 0.1, toneMapped: false }), []);
  const pulses = useRef<InstancedMesh>(null);
  const pulseGeo = useMemo(() => new SphereGeometry(0.06, 8, 6), []);
  const pulseMat = useMemo(() => new MeshBasicMaterial({ color: new Color("#ffe8c0").multiplyScalar(3), toneMapped: false }), []);
  const lineGeo = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const o = useMemo(() => new Object3D(), []);

  const links = useMemo(() => {
    const out: { a: [number, number, number]; b: [number, number, number] }[] = [];
    NODES.forEach((n, i) => {
      out.push({ a: [n.x, 0.06, n.z], b: [RING_CENTER[0], 0.06, RING_CENTER[1]] });
      const m = NODES[(i + 1) % NODES.length];
      out.push({ a: [n.x, 3.9, n.z], b: [m.x, 3.9, m.z] });
    });
    return out;
  }, []);

  useFrame((_, dt) => {
    const target = on ? clamp(since(on) / 2, 0, 1) : 0.15;
    power.current += (target - power.current) * Math.min(1, dt * 2);
    lineMat.opacity = 0.08 + power.current * 0.55;
    if (core.current) {
      core.current.children.forEach((c, i) => {
        c.rotation.x += dt * (0.12 + i * 0.07);
        c.rotation.y += dt * (0.2 - i * 0.05);
      });
    }
    const m = pulses.current;
    if (m) {
      const t = performance.now() / 1000;
      links.forEach((l, i) => {
        const k = (t * 0.25 + i * 0.137) % 1;
        o.position.set(l.a[0] + (l.b[0] - l.a[0]) * k, l.a[1] + (l.b[1] - l.a[1]) * k + 0.02, l.a[2] + (l.b[2] - l.a[2]) * k);
        o.scale.setScalar(power.current);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <Assemble from={-0.5}>
        <Sign text="BUILD IT" font="serif" width={5} size={170} tracking={0.08} position={[0, 4.6, -2.2]} opacity={0.8} />
      </Assemble>

      {/* the core */}
      <Assemble delay={0.2} from={-3}>
        <group position={[RING_CENTER[0], 0, RING_CENTER[1]]}>
          <mesh material={M.bulb("#ffe0a3", 1.2)} position={[0, 0.012, 0]} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[1.5, 1.56, 64]} />
          </mesh>
          <mesh material={M.bulb("#ffe0a3", 0.6)} position={[0, 0.012, 0]} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.9, 0.93, 64]} />
          </mesh>
          <Hotspot id="biz-core" showMark={false}>
            <group ref={core} position={[0, 2.8, 0]}>
              {[1.1, 0.8, 0.5].map((r, i) => (
                <mesh key={r} material={i === 1 ? M.bulb("#ffd38a", 1.6) : M.gold()}>
                  <torusGeometry args={[r, 0.025 + i * 0.008, 10, 64]} />
                </mesh>
              ))}
              <mesh material={M.bulb("#fff1d6", 3)}>
                <sphereGeometry args={[0.16, 20, 14]} />
              </mesh>
            </group>
          </Hotspot>
          <group position={[0, 9, 0]}>
            <LightShaft length={9} radius={2.2} top={0.4} color="#ffe0a3" opacity={0.08} />
          </group>
        </group>
      </Assemble>

      {/* monoliths */}
      {NODES.map((n, i) => {
        const id = nodeHotspot(n.name);
        const yaw = Math.atan2(RING_CENTER[0] - n.x, RING_CENTER[1] - n.z);
        const slab = (
          <group position={[n.x, 0, n.z]} rotation-y={yaw}>
            <mesh material={M.blackMetal()} position={[0, 2.1, 0]} castShadow>
              <boxGeometry args={[1.15, 4.2, 0.36]} />
            </mesh>
            <mesh material={M.bulb("#ffe0a3", id ? 1.8 : 0.5)} position={[0.585, 2.1, 0.0]}>
              <boxGeometry args={[0.02, 4.2, 0.37]} />
            </mesh>
            <Sign text={n.name.toUpperCase()} font="mono" width={2.4} size={80} tracking={0.18} position={[0, 0.45, 0.2]} opacity={id ? 0.95 : 0.5} />
            {!id && <Sign text="AMBITION" font="mono" width={1} size={70} tracking={0.3} position={[0, 0.2, 0.2]} opacity={0.35} />}
          </group>
        );
        return (
          <Assemble key={n.name} delay={0.3 + i * 0.08} from={-4.5}>
            {id ? (
              <Hotspot id={id} labelOffset={0.1}>
                {slab}
              </Hotspot>
            ) : (
              slab
            )}
          </Assemble>
        );
      })}

      {/* the wiring */}
      <Assemble delay={0.9} from={-0.3}>
        {links.map((l, i) => {
          const dx = l.b[0] - l.a[0];
          const dz = l.b[2] - l.a[2];
          const len = Math.hypot(dx, dz);
          return (
            <mesh
              key={i}
              geometry={lineGeo}
              material={lineMat}
              position={[(l.a[0] + l.b[0]) / 2, l.a[1], (l.a[2] + l.b[2]) / 2]}
              rotation-y={Math.atan2(dx, dz)}
              scale={[0.025, 0.012, len]}
              raycast={() => null}
            />
          );
        })}
        <instancedMesh ref={pulses} args={[pulseGeo, pulseMat, links.length]} frustumCulled={false} raycast={() => null} />
      </Assemble>
    </group>
  );
}
