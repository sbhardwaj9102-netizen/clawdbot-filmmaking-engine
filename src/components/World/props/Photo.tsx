"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, type Mesh, MeshBasicMaterial, MeshStandardMaterial, SRGBColorSpace, VideoTexture } from "three";

import { useHotspotGlow } from "@/components/InteractiveObject/Hotspot";
import { asset } from "@/lib/assets";
import { useTex } from "@/lib/textureCache";

import { M } from "../materials";

type V3 = [number, number, number];

/** A photograph: a print with a white border, or a frameless backlit transparency. */
export function Photo({
  src,
  w = 1.2,
  h,
  aspect = 16 / 9,
  position,
  rotation,
  border = 0.04,
  frame = "print",
  brightness = 0.9,
}: {
  src: string;
  w?: number;
  h?: number;
  aspect?: number;
  position?: V3;
  rotation?: V3;
  border?: number;
  frame?: "print" | "black" | "none";
  brightness?: number;
}) {
  const map = useTex(src);
  const height = h ?? w / aspect;
  const glow = useHotspotGlow();
  // unlit, so prints read clearly in dark rooms; brightens with its hotspot
  const own = useMemo(() => new MeshBasicMaterial({ map, toneMapped: false }), [map]);
  useEffect(() => () => own.dispose(), [own]);
  useFrame(() => {
    own.color.setScalar(brightness * (0.82 + glow.value * 0.3));
  });
  return (
    <group position={position} rotation={rotation}>
      {frame !== "none" && (
        <mesh position={[0, 0, -0.006]} material={frame === "print" ? M.paper() : M.matteBlack()}>
          <boxGeometry args={[w + border * 2, height + border * 2, 0.01]} />
        </mesh>
      )}
      <mesh material={own}>
        <planeGeometry args={[w, height]} />
      </mesh>
    </group>
  );
}

/** A screen surface: emissive image (or looping muted video) that brightens when its hotspot is active. */
export function Screen({
  src,
  video,
  w,
  h,
  intensity = 1.1,
  position,
  rotation,
}: {
  src: string;
  video?: string;
  w: number;
  h: number;
  intensity?: number;
  position?: V3;
  rotation?: V3;
}) {
  const map = useTex(src);
  const glow = useHotspotGlow();
  const vid = useMemo(() => {
    if (!video || typeof document === "undefined") return null;
    const el = document.createElement("video");
    el.src = asset(video);
    el.muted = true;
    el.loop = true;
    el.playsInline = true;
    el.crossOrigin = "anonymous";
    el.preload = "auto";
    const t = new VideoTexture(el);
    t.colorSpace = SRGBColorSpace;
    return { el, t };
  }, [video]);
  useEffect(() => {
    if (!vid) return;
    vid.el.play().catch(() => undefined);
    return () => {
      vid.el.pause();
      vid.el.removeAttribute("src");
      vid.el.load();
      vid.t.dispose();
    };
  }, [vid]);
  const mat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#000",
        emissive: new Color("#ffffff"),
        emissiveMap: vid?.t ?? map,
        emissiveIntensity: intensity,
        roughness: 0.25,
        metalness: 0.3,
      }),
    [map, vid, intensity],
  );
  useEffect(() => () => mat.dispose(), [mat]);
  const mesh = useRef<Mesh>(null);
  useFrame(() => {
    mat.emissiveIntensity = intensity * (0.78 + glow.value * 0.45);
  });
  return (
    <mesh ref={mesh} position={position} rotation={rotation} material={mat}>
      <planeGeometry args={[w, h]} />
    </mesh>
  );
}
