"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { type Group, MeshStandardMaterial } from "three";

import { Hotspot } from "@/components/InteractiveObject/Hotspot";
import { M } from "@/components/World/materials";
import { Wall } from "@/components/World/props/Architecture";
import { Chair, Desk, Lamp } from "@/components/World/props/Furniture";
import { Assemble, since, useWorldEvent } from "@/components/World/WorldContext";
import { profile } from "@/data/profile";
import { canvasTexture, FONT } from "@/lib/canvasTextures";
import { useTex } from "@/lib/textureCache";
import { clamp } from "@/systems/SceneManager/space";
import { useStory } from "@/systems/StoryEngine/store";

/**
 * ABOUT — a quiet room: one desk, one chair, one large screen with the name
 * on it. The file on the desk opens into the resume.
 */
export function AboutWorld() {
  const fired = useWorldEvent("screen-on");
  const portrait = useTex(profile.portrait.src);
  const tex = useMemo(
    () =>
      canvasTexture("about-screen", 1600, 900, (ctx, w, h) => {
        ctx.fillStyle = "#08090b";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#e2a25e";
        ctx.font = `500 22px ${FONT.mono}`;
        ctx.fillText(profile.disciplines.join("  ·  ").toUpperCase(), 640, 160);
        ctx.fillStyle = "#ece6da";
        ctx.font = `400 128px ${FONT.serif}`;
        ctx.fillText(profile.first, 636, 300);
        ctx.fillText(profile.last, 636, 420);
        ctx.fillStyle = "rgba(236,230,218,.75)";
        ctx.font = `500 28px ${FONT.mono}`;
        ctx.fillText(profile.title.toUpperCase(), 640, 490);
        ctx.fillStyle = "rgba(236,230,218,.18)";
        ctx.fillRect(640, 530, w - 720, 1);
        ctx.fillStyle = "rgba(236,230,218,.62)";
        ctx.font = `400 24px ${FONT.mono}`;
        profile.education.forEach((e, i) => {
          ctx.fillText(`${e.degree.toUpperCase()}`, 640, 590 + i * 74);
          ctx.fillStyle = "rgba(236,230,218,.4)";
          ctx.fillText(`${e.school}${e.when ? ` · ${e.when}` : ""}${e.note ? ` · ${e.note}` : ""}`.toUpperCase(), 640, 622 + i * 74);
          ctx.fillStyle = "rgba(236,230,218,.62)";
        });
        ctx.fillStyle = "rgba(236,230,218,.4)";
        ctx.font = `400 20px ${FONT.mono}`;
        ctx.fillText(profile.base.toUpperCase(), 640, h - 60);
      }),
    [],
  );
  const mat = useMemo(() => new MeshStandardMaterial({ color: "#000", emissive: "#fff", emissiveMap: tex, emissiveIntensity: 0, roughness: 0.3 }), [tex]);
  const pMat = useMemo(() => new MeshStandardMaterial({ color: "#000", emissive: "#fff", emissiveMap: portrait, emissiveIntensity: 0, roughness: 0.3 }), [portrait]);
  const asking = useStory((s) => s.questionOpen);
  const dim = useRef(1);
  useFrame((_, dt) => {
    const k = fired ? clamp(since(fired) / 1.6, 0, 1) : 0.08;
    // the screen steps back while the question is asked
    dim.current += ((asking ? 0.3 : 1) - dim.current) * Math.min(1, dt * 3);
    mat.emissiveIntensity = (0.05 + k * 1.0) * dim.current;
    pMat.emissiveIntensity = (0.03 + k * 0.85) * dim.current;
  });

  return (
    <group>
      <Assemble>
        <Wall position={[0, 0, -13.7]} w={14} h={6.5} material="concrete" />
        <Wall position={[-7, 0, -6.5]} rotation={[0, Math.PI / 2, 0]} w={14.5} h={6.5} opening={{ w: 2.4, h: 3, x: 2.9 }} material="concrete" />
        <Wall position={[7, 0, -6.5]} rotation={[0, -Math.PI / 2, 0]} w={14.5} h={6.5} material="concrete" />
        <mesh material={M.concreteDark()} position={[0, 6.5, -6.5]} rotation-x={Math.PI / 2}>
          <planeGeometry args={[14, 14.5]} />
        </mesh>
      </Assemble>

      {/* the screen */}
      <Assemble delay={0.15} from={-1}>
        <Hotspot id="about-screen" showMark={false}>
          <group position={[0, 3.0, -13.45]}>
            <mesh material={M.matteBlack()} position={[0, 0, -0.06]}>
              <boxGeometry args={[7.45, 4.25, 0.1]} />
            </mesh>
            <mesh material={mat}>
              <planeGeometry args={[7.2, 4.05]} />
            </mesh>
            <mesh material={pMat} position={[-2.15, 0, 0.005]}>
              <planeGeometry args={[2.3, 2.88]} />
            </mesh>
          </group>
        </Hotspot>
      </Assemble>

      {/* desk, chair, the file */}
      <Assemble delay={0.3}>
        <Desk position={[2.6, 0, -9.0]} rotation={[0, Math.PI / 2, 0]} w={1.6} d={0.8} />
        <Chair position={[3.35, 0, -9.0]} rotation={[0, -Math.PI / 2, 0]} />
        <Lamp position={[2.6, 4.6, -9.0]} drop={1.9} color="#ffe3c0" shaftLength={3.8} />
        <Hotspot id="about-resume" labelOffset={0.3}>
          <ResumeFile position={[2.45, 0.76, -9.0]} />
        </Hotspot>
      </Assemble>
    </group>
  );
}

/** A manila file that opens when the resume is open. */
function ResumeFile({ position }: { position: [number, number, number] }) {
  const lid = useRef<Group>(null);
  const open = useStory((s) => s.overlay === "resume" || s.hotspot?.id === "about-resume");
  const label = useMemo(
    () =>
      canvasTexture("file-label", 512, 128, (ctx, w, h) => {
        ctx.fillStyle = "#c9a96e";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#2a1d0e";
        ctx.font = `500 40px ${FONT.mono}`;
        ctx.textAlign = "center";
        ctx.fillText("RESUME — S. BHARDWAJ", w / 2, h / 2 + 14);
      }),
    [],
  );
  const manila = useMemo(() => new MeshStandardMaterial({ color: "#c9a96e", roughness: 0.85 }), []);
  const front = useMemo(() => new MeshStandardMaterial({ map: label, roughness: 0.85 }), [label]);
  useFrame((_, dt) => {
    if (lid.current) lid.current.rotation.z += ((open ? -2.6 : 0) - lid.current.rotation.z) * Math.min(1, dt * 4);
  });
  return (
    <group position={position} rotation-y={Math.PI / 2}>
      <mesh material={manila} position={[0, 0.004, 0]}>
        <boxGeometry args={[0.32, 0.006, 0.24]} />
      </mesh>
      <mesh material={M.paper()} position={[0, 0.012, 0]}>
        <boxGeometry args={[0.29, 0.01, 0.215]} />
      </mesh>
      <group ref={lid} position={[-0.16, 0.02, 0]}>
        <mesh material={manila} position={[0.16, 0, 0]}>
          <boxGeometry args={[0.32, 0.005, 0.24]} />
        </mesh>
        <mesh material={front} position={[0.16, 0.003, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.28, 0.07]} />
        </mesh>
      </group>
    </group>
  );
}
