"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type ReactNode, useMemo, useRef } from "react";
import { type Group, MeshBasicMaterial } from "three";

import { useHotspotGlow } from "@/components/InteractiveObject/Hotspot";
import { canvasTexture, FONT } from "@/lib/canvasTextures";

import { LightShaft } from "../LightShaft";
import { M } from "../materials";
import { Screen } from "./Photo";

type V3 = [number, number, number];

/** A digital cinema camera (lens along +Z): body, lens, matte box, top handle, side monitor. */
export function CinemaCamera({ position, rotation, scale = 1 }: { position?: V3; rotation?: V3; scale?: number }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <RoundedBox args={[0.17, 0.19, 0.3]} radius={0.015} smoothness={2} material={M.matteBlack()} castShadow />
      <mesh material={M.darkMetal()} position={[0, 0.13, -0.02]}>
        <boxGeometry args={[0.035, 0.03, 0.26]} />
      </mesh>
      <mesh material={M.darkMetal()} position={[0, 0.115, 0.1]}>
        <boxGeometry args={[0.03, 0.04, 0.03]} />
      </mesh>
      <mesh material={M.darkMetal()} position={[0, 0.115, -0.14]}>
        <boxGeometry args={[0.03, 0.04, 0.03]} />
      </mesh>
      {/* lens */}
      <mesh material={M.blackMetal()} position={[0, 0, 0.24]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.056, 0.05, 0.2, 24]} />
      </mesh>
      <mesh material={M.brushed()} position={[0, 0, 0.2]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.058, 0.058, 0.018, 24]} />
      </mesh>
      <mesh material={M.lens()} position={[0, 0, 0.342]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.047, 0.047, 0.005, 24]} />
      </mesh>
      {/* matte box */}
      <mesh material={M.matteBlack()} position={[0, 0, 0.39]}>
        <boxGeometry args={[0.24, 0.17, 0.1]} />
      </mesh>
      <mesh material={M.rubber()} position={[0, 0, 0.441]}>
        <boxGeometry args={[0.2, 0.13, 0.004]} />
      </mesh>
      {/* rods */}
      {[-0.035, 0.035].map((x) => (
        <mesh key={x} material={M.brushed()} position={[x, -0.12, 0.15]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.008, 0.008, 0.5, 8]} />
        </mesh>
      ))}
      {/* side monitor */}
      <group position={[-0.16, 0.14, 0.02]} rotation-y={-0.4}>
        <mesh material={M.matteBlack()}>
          <boxGeometry args={[0.15, 0.1, 0.02]} />
        </mesh>
        <mesh material={M.bulb("#7fa6d6", 0.6)} position={[0, 0, -0.011]} rotation-y={Math.PI}>
          <planeGeometry args={[0.13, 0.08]} />
        </mesh>
      </group>
      {/* battery */}
      <mesh material={M.darkMetal()} position={[0, -0.01, -0.19]}>
        <boxGeometry args={[0.13, 0.15, 0.06]} />
      </mesh>
      {/* tally */}
      <mesh material={M.bulb("#ff3b2a", 2)} position={[0.07, 0.08, 0.16]}>
        <sphereGeometry args={[0.008, 8, 6]} />
      </mesh>
    </group>
  );
}

/** Fluid head + tripod legs, head top at `height`. */
export function Tripod({ height = 1.25, spread = 0.55, children }: { height?: number; spread?: number; children?: ReactNode }) {
  const legs = [0, 1, 2].map((i) => {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    const fx = Math.sin(a) * spread;
    const fz = Math.cos(a) * spread;
    const len = Math.hypot(spread, height - 0.12);
    const tilt = Math.atan2(spread, height - 0.12);
    return { a, fx, fz, len, tilt };
  });
  return (
    <group>
      {legs.map((l, i) => (
        <group key={i} position={[0, height - 0.12, 0]} rotation-y={l.a}>
          <mesh material={M.darkMetal()} rotation-x={-l.tilt} position={[0, (-l.len / 2) * Math.cos(l.tilt), (l.len / 2) * Math.sin(l.tilt)]}>
            <cylinderGeometry args={[0.014, 0.011, l.len, 8]} />
          </mesh>
        </group>
      ))}
      <mesh material={M.matteBlack()} position={[0, height - 0.06, 0]}>
        <cylinderGeometry args={[0.07, 0.06, 0.12, 16]} />
      </mesh>
      <mesh material={M.darkMetal()} position={[0, height - 0.12, 0]}>
        <sphereGeometry args={[0.05, 12, 8]} />
      </mesh>
      <group position={[0, height + 0.1, 0]}>{children}</group>
    </group>
  );
}

/** Straight dolly track along Z. */
export function DollyTrack({ length = 8, position, rotation }: { length?: number; position?: V3; rotation?: V3 }) {
  const sleepers = Math.floor(length / 0.6);
  return (
    <group position={position} rotation={rotation}>
      {[-0.31, 0.31].map((x) => (
        <mesh key={x} material={M.brushed()} position={[x, 0.06, 0]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.022, 0.022, length, 10]} />
        </mesh>
      ))}
      {Array.from({ length: sleepers + 1 }, (_, i) => (
        <mesh key={i} material={M.darkWood()} position={[0, 0.02, -length / 2 + i * 0.6]}>
          <boxGeometry args={[0.85, 0.04, 0.09]} />
        </mesh>
      ))}
    </group>
  );
}

/** Dolly with a pedestal column carrying the camera. */
export function Dolly({ position, rotation, children }: { position?: V3; rotation?: V3; children?: ReactNode }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.7, 0.14, 0.95]} radius={0.03} smoothness={2} position={[0, 0.2, 0]} material={M.darkMetal()} castShadow />
      {[
        [-0.31, -0.38],
        [0.31, -0.38],
        [-0.31, 0.38],
        [0.31, 0.38],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} material={M.rubber()} position={[x, 0.1, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.06, 0.06, 0.05, 14]} />
        </mesh>
      ))}
      <mesh material={M.matteBlack()} position={[0, 0.65, 0.1]}>
        <cylinderGeometry args={[0.07, 0.09, 0.8, 16]} />
      </mesh>
      <mesh material={M.matteBlack()} position={[0, 0.32, -0.38]}>
        <boxGeometry args={[0.5, 0.06, 0.18]} />
      </mesh>
      <group position={[0, 1.12, 0.1]}>{children}</group>
    </group>
  );
}

/**
 * Fresnel film light on a stand. The head points along +Z, tilted down by `tilt`.
 * Optionally throws a volumetric shaft.
 */
export function FilmLight({
  position,
  rotation,
  height = 2.2,
  tilt = 0.5,
  color = "#ffd0a0",
  shaft = true,
  shaftLength = 6,
  size = 1,
}: {
  position?: V3;
  rotation?: V3;
  height?: number;
  tilt?: number;
  color?: string;
  shaft?: boolean;
  shaftLength?: number;
  size?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* stand */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} material={M.blackMetal()} position={[Math.sin(a) * 0.28, 0.12, Math.cos(a) * 0.28]} rotation={[Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9]}>
            <cylinderGeometry args={[0.012, 0.012, 0.7, 6]} />
          </mesh>
        );
      })}
      <mesh material={M.blackMetal()} position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.018, 0.022, height, 8]} />
      </mesh>
      <group position={[0, height, 0]} rotation-x={tilt} scale={size}>
        {/* yoke */}
        <mesh material={M.blackMetal()} position={[0, -0.02, 0]}>
          <boxGeometry args={[0.46, 0.03, 0.03]} />
        </mesh>
        {[-0.22, 0.22].map((x) => (
          <mesh key={x} material={M.blackMetal()} position={[x, 0.1, 0]}>
            <boxGeometry args={[0.025, 0.24, 0.03]} />
          </mesh>
        ))}
        {/* housing */}
        <mesh material={M.matteBlack()} position={[0, 0.14, -0.02]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.19, 0.17, 0.36, 24]} />
        </mesh>
        {/* lens */}
        <mesh material={M.bulb(color, 4)} position={[0, 0.14, 0.165]} rotation-x={Math.PI / 2}>
          <circleGeometry args={[0.16, 24]} />
        </mesh>
        {/* barn doors */}
        {[0, 1, 2, 3].map((i) => {
          const r = (i * Math.PI) / 2;
          return (
            <group key={i} position={[0, 0.14, 0.17]} rotation-z={r}>
              <mesh material={M.blackMetal()} position={[0, 0.2, 0.08]} rotation-x={-0.5}>
                <boxGeometry args={[0.34, 0.16, 0.006]} />
              </mesh>
            </group>
          );
        })}
        {shaft && (
          <group position={[0, 0.14, 0.18]} rotation-x={Math.PI / 2}>
            <LightShaft length={shaftLength} radius={shaftLength * 0.32} color={color} opacity={0.14} top={0.16} />
          </group>
        )}
      </group>
    </group>
  );
}

/** Field / video-village monitor on a stand with a hood. Image or video on screen. */
export function Monitor({
  src,
  video,
  w = 1.5,
  h = 0.85,
  position,
  rotation,
  standHeight = 1.15,
  stand = true,
  title,
}: {
  src: string;
  video?: string;
  w?: number;
  h?: number;
  position?: V3;
  rotation?: V3;
  standHeight?: number;
  stand?: boolean;
  title?: string;
}) {
  const glow = useHotspotGlow();
  const group = useRef<Group>(null);
  const titleTex = useMemo(
    () =>
      title
        ? canvasTexture(`montitle:${title}`, 1024, 128, (ctx, cw, ch) => {
            ctx.clearRect(0, 0, cw, ch);
            ctx.fillStyle = "#ece6da";
            ctx.font = `500 44px ${FONT.mono}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(title.split("").join(String.fromCharCode(8202)), cw / 2, ch / 2);
          })
        : null,
    [title],
  );
  const titleMat = useMemo(() => (titleTex ? new MeshBasicMaterial({ map: titleTex, transparent: true, toneMapped: false, depthWrite: false }) : null), [titleTex]);
  useFrame(() => {
    if (group.current) group.current.position.y = (stand ? standHeight : 0) + glow.value * 0.05;
    if (titleMat) titleMat.opacity = 0.45 + glow.value * 0.55;
  });
  return (
    <group position={position} rotation={rotation}>
      {stand && (
        <>
          <mesh material={M.blackMetal()} position={[0, standHeight / 2, 0]}>
            <cylinderGeometry args={[0.025, 0.03, standHeight, 8]} />
          </mesh>
          <mesh material={M.blackMetal()} position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.32, 0.36, 0.04, 20]} />
          </mesh>
        </>
      )}
      <group ref={group} position={[0, stand ? standHeight : 0, 0]}>
        <RoundedBox args={[w + 0.07, h + 0.07, 0.07]} radius={0.015} smoothness={2} position={[0, h / 2, -0.04]} material={M.matteBlack()} />
        <Screen src={src} video={video} w={w} h={h} position={[0, h / 2, 0.0]} />
        {/* hood */}
        <mesh material={M.matteBlack()} position={[0, h + 0.035, 0.12]}>
          <boxGeometry args={[w + 0.07, 0.01, 0.28]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} material={M.matteBlack()} position={[(s * (w + 0.07)) / 2, h / 2, 0.12]}>
            <boxGeometry args={[0.01, h + 0.07, 0.28]} />
          </mesh>
        ))}
        {titleMat && (
          <mesh material={titleMat} position={[0, -0.13, 0.02]}>
            <planeGeometry args={[w, w / 8]} />
          </mesh>
        )}
      </group>
    </group>
  );
}

/** Slate / clapperboard. */
export function Clapperboard({ position, rotation, open = 0.35, label = "MAKE IT" }: { position?: V3; rotation?: V3; open?: number; label?: string }) {
  const face = useMemo(
    () =>
      canvasTexture(`slate:${label}`, 512, 420, (ctx, w, h) => {
        ctx.fillStyle = "#0d0d0e";
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(236,230,218,.7)";
        ctx.lineWidth = 3;
        ctx.strokeRect(14, 14, w - 28, h - 28);
        [130, 230, 330].forEach((y) => {
          ctx.beginPath();
          ctx.moveTo(14, y);
          ctx.lineTo(w - 14, y);
          ctx.stroke();
        });
        ctx.beginPath();
        ctx.moveTo(w / 2, 130);
        ctx.lineTo(w / 2, 330);
        ctx.stroke();
        ctx.fillStyle = "#ece6da";
        ctx.font = `500 22px ${FONT.mono}`;
        ["PROD.", "ROLL", "SCENE", "TAKE"].forEach((t, i) => ctx.fillText(t, 28 + (i % 2) * (w / 2), 160 + Math.floor(i / 2) * 100));
        ctx.font = `400 64px ${FONT.serif}`;
        ctx.fillText(label, 30, 95);
      }),
    [label],
  );
  const stripes = useMemo(
    () =>
      canvasTexture("slate-stripes", 512, 64, (ctx, w, h) => {
        ctx.fillStyle = "#f2efe8";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#0d0d0e";
        for (let x = -64; x < w; x += 64) {
          ctx.beginPath();
          ctx.moveTo(x, h);
          ctx.lineTo(x + 32, 0);
          ctx.lineTo(x + 64, 0);
          ctx.lineTo(x + 32, h);
          ctx.fill();
        }
      }),
    [],
  );
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.3, 0.24, 0.016]} />
        <meshStandardMaterial attach="material-0" color="#0d0d0e" />
        <meshStandardMaterial attach="material-1" color="#0d0d0e" />
        <meshStandardMaterial attach="material-2" color="#0d0d0e" />
        <meshStandardMaterial attach="material-3" color="#0d0d0e" />
        <meshStandardMaterial attach="material-4" map={face} roughness={0.7} />
        <meshStandardMaterial attach="material-5" color="#0d0d0e" />
      </mesh>
      <mesh position={[0, 0.255, 0]}>
        <boxGeometry args={[0.3, 0.03, 0.018]} />
        <meshStandardMaterial map={stripes} roughness={0.6} />
      </mesh>
      <group position={[-0.15, 0.272, 0]} rotation-z={open}>
        <mesh position={[0.15, 0.015, 0]}>
          <boxGeometry args={[0.3, 0.03, 0.018]} />
          <meshStandardMaterial map={stripes} roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

/** Director's chair. */
export function DirectorChair({ position, rotation, label }: { position?: V3; rotation?: V3; label?: string }) {
  const back = useMemo(
    () =>
      canvasTexture(`chair:${label ?? ""}`, 256, 96, (ctx, w, h) => {
        ctx.fillStyle = "#121214";
        ctx.fillRect(0, 0, w, h);
        if (label) {
          ctx.fillStyle = "#b8955a";
          ctx.font = `500 26px ${FONT.mono}`;
          ctx.textAlign = "center";
          ctx.fillText(label, w / 2, h / 2 + 9);
        }
      }),
    [label],
  );
  return (
    <group position={position} rotation={rotation}>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh material={M.darkWood()} position={[s * 0.26, 0.4, 0.18]} rotation-x={0.25}>
            <boxGeometry args={[0.03, 0.85, 0.03]} />
          </mesh>
          <mesh material={M.darkWood()} position={[s * 0.26, 0.4, -0.18]} rotation-x={-0.25}>
            <boxGeometry args={[0.03, 0.85, 0.03]} />
          </mesh>
          <mesh material={M.darkWood()} position={[s * 0.26, 1.05, -0.24]}>
            <boxGeometry args={[0.03, 0.5, 0.03]} />
          </mesh>
          <mesh material={M.darkWood()} position={[s * 0.27, 0.66, 0]}>
            <boxGeometry args={[0.04, 0.03, 0.5]} />
          </mesh>
        </group>
      ))}
      <mesh material={M.fabric()} position={[0, 0.6, 0]}>
        <boxGeometry args={[0.5, 0.02, 0.42]} />
      </mesh>
      <mesh position={[0, 1.1, -0.245]}>
        <planeGeometry args={[0.52, 0.2]} />
        <meshStandardMaterial map={back} roughness={1} side={2} />
      </mesh>
    </group>
  );
}

/** Apple boxes / road cases stack. */
export function Cases({ position, rotation, count = 2 }: { position?: V3; rotation?: V3; count?: number }) {
  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: count }, (_, i) => (
        <RoundedBox key={i} args={[0.8, 0.5, 0.55]} radius={0.03} smoothness={2} position={[i % 2 ? 0.05 : 0, 0.25 + i * 0.5, 0]} rotation-y={i * 0.1} material={M.matteBlack()} castShadow />
      ))}
      {Array.from({ length: count }, (_, i) => (
        <mesh key={`e${i}`} material={M.brushed()} position={[i % 2 ? 0.05 : 0, 0.25 + i * 0.5, 0.277]}>
          <boxGeometry args={[0.7, 0.03, 0.005]} />
        </mesh>
      ))}
    </group>
  );
}
