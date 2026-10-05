"use client";

import { useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useRef } from "react";

import { damp } from "@/lib/math";
import { rt } from "@/systems/Experience/runtime";

/**
 * Post-processing (medium/high tiers): bloom on practical lights and screens,
 * a lens vignette, filmic tone mapping. Bloom and vignette ease off by day.
 */
export function Effects({ multisampling }: { multisampling: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bloom = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vignette = useRef<any>(null);
  useFrame((_, dt) => {
    const b = bloom.current;
    if (b) b.intensity = damp(b.intensity, rt.look.palette.bloom, 2, Math.min(dt, 0.05));
    const v = vignette.current;
    if (v) v.darkness = 0.72 - 0.42 * rt.look.theme;
  });
  return (
    <EffectComposer multisampling={multisampling} enableNormalPass={false}>
      <Bloom ref={bloom} mipmapBlur intensity={0.7} luminanceThreshold={0.9} luminanceSmoothing={0.25} radius={0.72} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette ref={vignette} offset={0.28} darkness={0.72} eskil={false} />
    </EffectComposer>
  );
}
