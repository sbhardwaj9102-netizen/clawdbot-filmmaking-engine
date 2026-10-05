"use client";

import { useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useRef } from "react";

import { rt } from "@/systems/SceneManager/director";
import { damp } from "@/systems/SceneManager/space";

/**
 * Post-processing (medium/high tiers): bloom on practical lights and screens,
 * a lens vignette, filmic tone mapping. Bloom strength follows each world's palette.
 */
export function Effects({ multisampling }: { multisampling: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bloom = useRef<any>(null);
  useFrame((_, dt) => {
    const b = bloom.current;
    const target = rt.active?.layout.palette.bloom ?? 0.7;
    if (b) b.intensity = damp(b.intensity, target, 1.5, Math.min(dt, 0.05));
  });
  return (
    <EffectComposer multisampling={multisampling} enableNormalPass={false}>
      <Bloom ref={bloom} mipmapBlur intensity={0.7} luminanceThreshold={0.9} luminanceSmoothing={0.25} radius={0.72} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.28} darkness={0.72} eskil={false} />
    </EffectComposer>
  );
}
