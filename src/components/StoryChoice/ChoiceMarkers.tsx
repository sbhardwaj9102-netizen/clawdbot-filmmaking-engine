"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, type Group, type Mesh, type MeshBasicMaterial } from "three";

import { useWorld } from "@/components/World/WorldContext";
import { sceneById } from "@/data/story/scenes";
import type { ChoiceOption } from "@/data/story/types";
import { radialTexture } from "@/lib/canvasTextures";
import type { V3, WorldLayout } from "@/scenes/types";
import { choose } from "@/systems/SceneManager/director";
import { useStory } from "@/systems/StoryEngine/store";

import styles from "./Choice.module.css";
import { useOptions } from "./options";


/**
 * In-world choices: when a question opens, each option appears as a column
 * of light standing in the space (or above the object the world gives it),
 * labelled where it stands. Choosing one sends the avatar that way.
 */

export function optionAnchor(layout: WorldLayout, id: string, index: number, count: number): V3 {
  const a = layout.anchors?.[id];
  if (a) return a;
  const n = layout.path.length;
  const end = layout.path[n - 1].p;
  const prev = layout.path[n - 2]?.p ?? [end[0], end[1] + 1];
  const fx = end[0] - prev[0];
  const fz = end[1] - prev[1];
  const l = Math.hypot(fx, fz) || 1;
  const f = [fx / l, fz / l];
  const r = [-f[1], f[0]];
  const off = (index - (count - 1) / 2) * 2.6;
  return [end[0] + f[0] * 3.4 + r[0] * off, 1.7, end[1] + f[1] * 3.4 + r[1] * off];
}

export function ChoiceMarkers() {
  const { scene, layout } = useWorld();
  const open = useStory((s) => s.questionOpen && s.currentScene === scene.id);
  const { q, options } = useOptions(scene.question);
  if (!q || !open) return null;
  const pillars = layout.choicePillars !== false;
  return (
    <group>
      {options.map((o, i) => (
        <Marker
          key={o.id}
          option={o}
          index={i}
          position={optionAnchor(layout, o.id, i, options.length)}
          questionId={q.id}
          pillar={pillars}
          tint={o.id === "onward" ? "#ece6da" : layout.palette.accent}
        />
      ))}
    </group>
  );
}

function Marker({
  option,
  index,
  position,
  questionId,
  pillar,
  tint,
}: {
  option: ChoiceOption & { visited: boolean };
  index: number;
  position: V3;
  questionId: string;
  pillar: boolean;
  tint: string;
}) {
  const g = useRef<Group>(null);
  const beam = useRef<Mesh>(null);
  const ringTex = useMemo(() => radialTexture("rgba(255,255,255,0.9)", "rgba(255,255,255,0)"), []);
  const color = useMemo(() => new Color(tint), [tint]);
  const born = useMemo(() => performance.now(), []);
  const reduced = useStory((s) => s.reducedMotion);
  const hovered = useRef(false);

  useFrame(() => {
    const t = (performance.now() - born) / 1000 - index * 0.18;
    const k = reduced ? 1 : Math.min(1, Math.max(0, t / 0.9));
    if (beam.current) {
      const m = beam.current.material as MeshBasicMaterial;
      m.opacity = k * (hovered.current ? 0.32 : 0.16) * (option.visited ? 0.6 : 1);
      beam.current.scale.y = 0.2 + 0.8 * k;
    }
  });

  const sub = sceneById[option.next]?.chapter;
  return (
    <group ref={g} position={[position[0], 0, position[2]]}>
      {pillar && (
        <>
          <mesh ref={beam} position={[0, 2.6, 0]} onClick={() => choose(questionId, option.id)} onPointerOver={() => (hovered.current = true)} onPointerOut={() => (hovered.current = false)}>
            <cylinderGeometry args={[0.5, 0.5, 5.2, 24, 1, true]} />
            <meshBasicMaterial color={color} transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} side={2} />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2} raycast={() => null}>
            <planeGeometry args={[2.6, 2.6]} />
            <meshBasicMaterial map={ringTex} color={color} transparent opacity={0.4} depthWrite={false} toneMapped={false} />
          </mesh>
        </>
      )}
      <Html position={[0, position[1], 0]} center zIndexRange={[30, 20]}>
        <button
          type="button"
          className={`${styles.marker} ${option.visited ? styles.visited : ""} ${option.id === "onward" ? styles.onward : ""}`}
          style={{ animationDelay: `${index * 0.18}s` }}
          tabIndex={-1}
          aria-hidden
          data-choice={option.id}
          onClick={() => choose(questionId, option.id)}
          onPointerEnter={() => {
            hovered.current = true;
            useStory.setState({ hovered: `choice:${option.id}` });
          }}
          onPointerLeave={() => {
            hovered.current = false;
            useStory.setState({ hovered: null });
          }}
        >
          <span className={styles.idx}>{option.id === "onward" ? "→" : String(index + 1).padStart(2, "0")}</span>
          <span className={styles.label}>{option.label}</span>
          {option.hint && <span className={styles.hint}>{option.hint}</span>}
          {option.visited && <span className={styles.tag}>Visited{sub ? ` · ${sub.title}` : ""}</span>}
        </button>
      </Html>
    </group>
  );
}
