"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, type MeshBasicMaterial } from "three";

import { LightShaft } from "@/components/World/LightShaft";
import { M } from "@/components/World/materials";
import { Column, SlidingDoor, Wall } from "@/components/World/props/Architecture";
import { Assemble, since, useWorldEvent } from "@/components/World/WorldContext";
import { audio } from "@/systems/AudioManager/audio";
import { smoothstep } from "@/systems/SceneManager/space";
import { useStory } from "@/systems/StoryEngine/store";

import { DOOR_Z, finaleVariant } from "./layout";

/**
 * THE DOOR — the last walk. A huge door slides open onto light; the avatar
 * walks out into it, the camera follows, and the picture fades to black.
 */
export function FinalWorld() {
  const openAt = useWorldEvent("open-door");
  const fadeAt = useWorldEvent("fade-out");
  const door = useRef({ current: 0 }).current;
  const light = useRef<MeshBasicMaterial>(null);
  const sky = useMemo(() => new Color(finaleVariant().sky), []);

  useEffect(() => {
    if (openAt) audio.door();
  }, [openAt]);

  useEffect(() => {
    if (!fadeAt) return;
    useStory.setState({ fade: 1 });
    const t = window.setTimeout(() => useStory.setState({ contactOpen: true }), 1500);
    return () => window.clearTimeout(t);
  }, [fadeAt]);

  useFrame(() => {
    const t = openAt ? since(openAt) : -1;
    door.current = t < 0 ? 0 : smoothstep(0, 3.2, t);
    if (light.current) light.current.color.copy(sky).multiplyScalar(0.4 + door.current * 4);
  });

  return (
    <group>
      <Assemble>
        {[-5, 5].map((x) => (
          <Wall key={x} position={[x, 0, -6.5]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]} w={17} h={11} material="dark" />
        ))}
        {[-1, -5, -9, -13].flatMap((z) => [-4.3, 4.3].map((x) => <Column key={`${x}${z}`} position={[x, 0, z]} h={11} w={0.6} />))}
        <Wall position={[0, 0, DOOR_Z]} w={10.2} h={11} t={0.5} opening={{ w: 7, h: 9 }} material="dark" />
        <mesh material={M.concreteDark()} position={[0, 11, -6.25]} rotation-x={Math.PI / 2}>
          <planeGeometry args={[10.4, 17]} />
        </mesh>
      </Assemble>
      <SlidingDoor position={[0, 0, DOOR_Z + 0.35]} w={7} h={9} open={door} />
      {/* outside: light */}
      <mesh position={[0, 20, -70]}>
        <planeGeometry args={[200, 80]} />
        <meshBasicMaterial ref={light} toneMapped={false} fog={false} />
      </mesh>
      <group position={[0, 9, DOOR_Z - 0.5]} rotation-x={-1.25}>
        <LightShaft length={22} radius={6} top={3.4} color="#fff2dc" opacity={0.12} level={door} />
      </group>
    </group>
  );
}
