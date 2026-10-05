"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";

import { rt } from "@/systems/Experience/runtime";

type NumericEnv = { [K in keyof typeof rt.env]: (typeof rt.env)[K] extends number ? K : never }[keyof typeof rt.env];

/** A `{ current }` box that follows one of the set's values (for props that take refs). */
export function useEnvRef(key: NumericEnv, map: (v: number) => number = (v) => v) {
  const box = useMemo(() => ({ current: 0 }), []);
  useFrame(() => {
    box.current = map(rt.env[key] as number);
  }, -2);
  return box;
}
