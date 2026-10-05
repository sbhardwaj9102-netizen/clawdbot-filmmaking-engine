"use client";

import { Html } from "@react-three/drei";
import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { createContext, type ReactNode, useContext, useMemo, useRef } from "react";
import { type Camera, type Mesh, type MeshBasicMaterial, type Object3D, Vector3 } from "three";

import { useWorld } from "@/components/World/WorldContext";
import { hotspots } from "@/data/story/hotspots";
import { radialTexture } from "@/lib/canvasTextures";
import { audio } from "@/systems/AudioManager/audio";
import { openHotspot } from "@/systems/SceneManager/director";
import { damp } from "@/systems/SceneManager/space";
import { getStory, useStory } from "@/systems/StoryEngine/store";

import styles from "./Hotspot.module.css";

/**
 * INTERACTIVE OBJECT
 * Wrap any prop in <Hotspot id="…"> to make it part of the story: it glows
 * when the avatar is near or the cursor is over it, shows its verb
 * (VIEW · ENTER · OPEN · WATCH · EXPLORE · READ), and on click the avatar
 * walks over, turns to it and uses it. What "using" means lives in
 * data/story/hotspots.ts.
 */

type Glow = { value: number };

/**
 * Labels stay inside a safe area so an object near the edge of the shot never
 * puts its label over the name, chapter or controls at the top and bottom.
 */
const projected = new Vector3();
function safeLabelPosition(el: Object3D, camera: Camera, size: { width: number; height: number }) {
  projected.setFromMatrixPosition(el.matrixWorld).project(camera);
  const x = (projected.x + 1) * (size.width / 2);
  const y = (1 - projected.y) * (size.height / 2);
  const mx = Math.min(150, size.width * 0.3);
  const top = size.width < 760 ? 120 : 96;
  return [Math.min(size.width - mx, Math.max(mx, x)), Math.min(size.height - 110, Math.max(top, y))];
}
const GlowCtx = createContext<Glow>({ value: 0 });
/** Children read `.value` (0–1) in their own useFrame to brighten / lift. */
export const useHotspotGlow = () => useContext(GlowCtx);

export function Hotspot({ id, children, labelOffset = 0.35, showMark = true }: { id: string; children?: ReactNode; labelOffset?: number; showMark?: boolean }) {
  const { layout } = useWorld();
  const h = layout.hotspots[id];
  const def = hotspots[id];
  const glow = useMemo<Glow>(() => ({ value: 0 }), []);
  const ring = useRef<Mesh>(null);
  const ringTex = useMemo(() => radialTexture("rgba(255,220,170,0.9)", "rgba(255,220,170,0)"), []);
  const hovered = useStory((s) => s.hovered === id);
  // only the closest object announces itself; others wait for the cursor
  const near = useStory((s) => s.nearby[0] === id && !s.questionOpen);
  const active = useStory((s) => s.hotspot?.id === id);
  const enabled = useStory((s) => s.phase === "explore" && !s.transition);

  useFrame((_, dt) => {
    const target = active ? 1 : hovered ? 1 : near ? 0.55 : 0.12 + 0.06 * Math.sin(performance.now() / 700);
    glow.value = damp(glow.value, target, 5, Math.min(dt, 0.05));
    if (ring.current) {
      const m = ring.current.material as MeshBasicMaterial;
      m.opacity = 0.05 + glow.value * 0.35;
      ring.current.scale.setScalar(0.8 + glow.value * 0.4);
    }
  });

  if (!h || !def) return <>{children}</>;

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!enabled) return;
    if (getStory().hovered !== id) {
      useStory.setState({ hovered: id });
      audio.tick();
    }
  };
  const out = () => {
    if (getStory().hovered === id) useStory.setState({ hovered: null });
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (enabled) openHotspot(id);
  };
  const [w, hh] = h.size ?? [1.3, 1.3];

  return (
    <GlowCtx.Provider value={glow}>
      <group onPointerOver={over} onPointerOut={out} onClick={click}>
        {children}
        <mesh position={h.object}>
          <boxGeometry args={[w, hh, Math.max(0.5, w * 0.5)]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      </group>
      {showMark && (
        <mesh ref={ring} position={[h.mark[0], 0.015, h.mark[1]]} rotation-x={-Math.PI / 2} raycast={() => null}>
          <planeGeometry args={[1.4, 1.4]} />
          <meshBasicMaterial map={ringTex} transparent depthWrite={false} toneMapped={false} opacity={0.1} />
        </mesh>
      )}
      {(hovered || near) && !active && enabled && (
        <Html
          position={[h.object[0], h.object[1] + hh / 2 + labelOffset, h.object[2]]}
          center
          calculatePosition={safeLabelPosition}
          zIndexRange={[20, 10]}
          style={{ pointerEvents: "none" }}
        >
          <div className={`${styles.label} ${hovered ? styles.hot : ""}`} aria-hidden>
            <span className={styles.verb}>{def.verb}</span>
            <span className={styles.name}>{def.label}</span>
          </div>
        </Html>
      )}
    </GlowCtx.Provider>
  );
}
