"use client";

import { Html } from "@react-three/drei";
import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import { type Camera, type Object3D, Vector3 } from "three";

import { damp } from "@/lib/math";
import { getExperience, setExperience, useExperience } from "@/systems/Experience/store";

import styles from "./Hotspot.module.css";

/**
 * CLICKABLE — in Explore, parts of the set lead somewhere: the ASTER wall to
 * ASTER, the burning hut to House of Purple, the table to Strategy… Hovering
 * brightens the object (children read the glow) and names it; clicking
 * opens it. During the tour the stage is not interactive. Every one of these
 * is also a plain button in the Explore panel, so nothing depends on 3D.
 */

type Glow = { value: number };
const GlowCtx = createContext<Glow>({ value: 0 });
/** Children read `.value` (0–1) in their own useFrame to brighten. */
export const useHotspotGlow = () => useContext(GlowCtx);

const projected = new Vector3();
/** Keep labels inside the frame, clear of the bars at the top and bottom. */
function safeLabelPosition(el: Object3D, camera: Camera, size: { width: number; height: number }) {
  projected.setFromMatrixPosition(el.matrixWorld).project(camera);
  const x = (projected.x + 1) * (size.width / 2);
  const y = (1 - projected.y) * (size.height / 2);
  const mx = Math.min(140, size.width * 0.3);
  return [Math.min(size.width - mx, Math.max(mx, x)), Math.min(size.height - 120, Math.max(110, y))];
}

export function Clickable({
  id,
  label,
  verb = "Open",
  onSelect,
  active = false,
  boost,
  labelAt,
  children,
}: {
  id: string;
  label: string;
  verb?: string;
  onSelect: () => void;
  /** The thing currently open (stays lit). */
  active?: boolean;
  /** Extra glow the story asks for (0–1), e.g. while PA-1 talks about it. */
  boost?: () => number;
  labelAt: [number, number, number];
  children: ReactNode;
}) {
  const glow = useMemo<Glow>(() => ({ value: 0 }), []);
  const hovered = useExperience((s) => s.hovered === id);
  const enabled = useExperience((s) => s.mode === "explore" && !s.overlay);

  useFrame((_, dt) => {
    const target = Math.max(hovered && enabled ? 1 : active ? 0.6 : 0, boost ? boost() : 0);
    glow.value = damp(glow.value, target, 6, Math.min(dt, 0.05));
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!enabled) return;
    if (getExperience().hovered !== id) setExperience({ hovered: id });
  };
  const out = () => {
    if (getExperience().hovered === id) setExperience({ hovered: null });
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!enabled) return;
    setExperience({ hovered: null });
    onSelect();
  };

  return (
    <GlowCtx.Provider value={glow}>
      <group onPointerOver={over} onPointerOut={out} onClick={click}>
        {children}
      </group>
      {hovered && enabled && (
        <Html position={labelAt} center calculatePosition={safeLabelPosition} zIndexRange={[20, 10]} style={{ pointerEvents: "none" }}>
          <div className={styles.label} aria-hidden>
            <span className={styles.verb}>{verb}</span>
            <span className={styles.name}>{label}</span>
          </div>
        </Html>
      )}
    </GlowCtx.Provider>
  );
}
