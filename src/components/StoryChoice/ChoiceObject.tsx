"use client";

import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { type ReactNode, useRef } from "react";
import type { Group } from "three";

import { audio } from "@/systems/AudioManager/audio";
import { choose } from "@/systems/SceneManager/director";
import { damp } from "@/systems/SceneManager/space";
import { getStory, useStory } from "@/systems/StoryEngine/store";

/**
 * A physical object that *is* a choice (the clapperboard, the budget binder,
 * the scale model). It wakes when the question opens, lifts when hovered,
 * and choosing it routes the story. `level` (0–1) is shared with the world
 * so lights and portals can react to the same hover.
 */
export function ChoiceObject({
  question,
  option,
  children,
  level,
}: {
  question: string;
  option: string;
  children: ReactNode;
  level?: { current: number };
}) {
  const g = useRef<Group>(null);
  const hover = useRef(false);
  const open = useStory((s) => s.questionOpen);
  const chosen = useStory((s) => s.currentChoice?.question === question && s.currentChoice.option === option && !!s.transition);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const target = chosen ? 1.4 : open ? (hover.current ? 1 : 0.55) : 0;
    if (level) level.current = damp(level.current, target, 4, dt);
    if (g.current) {
      const v = level ? level.current : target;
      g.current.position.y = damp(g.current.position.y, Math.min(v, 1) * 0.06, 6, dt);
      g.current.rotation.y = damp(g.current.rotation.y, hover.current && open ? 0.12 : 0, 5, dt);
    }
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!getStory().questionOpen) return;
    hover.current = true;
    useStory.setState({ hovered: `choice:${option}` });
    audio.tick();
  };
  const out = () => {
    hover.current = false;
    if (getStory().hovered === `choice:${option}`) useStory.setState({ hovered: null });
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (getStory().questionOpen) choose(question, option);
  };

  return (
    <group ref={g} onPointerOver={over} onPointerOut={out} onClick={click}>
      {children}
    </group>
  );
}
