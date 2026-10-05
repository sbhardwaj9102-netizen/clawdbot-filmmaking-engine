import { MathUtils } from "three";

export const clamp = MathUtils.clamp;
export const lerp = MathUtils.lerp;

/** Frame-rate independent exponential smoothing. */
export const damp = (current: number, target: number, lambda: number, dt: number) => MathUtils.damp(current, target, lambda, dt);

export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Heading (rotation.y) that points an object's +Z axis along (dx, dz). */
export const yawOf = (dx: number, dz: number) => Math.atan2(dx, dz);

/** Shortest signed angle from `from` to `to`. */
export const angleDelta = (from: number, to: number) => {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
};
