import { CatmullRomCurve3, MathUtils, Vector3 } from "three";

import type { V2, V3 } from "@/scenes/types";

/** Placement of a world: its local origin in world space and its heading. */
export type Anchor = { x: number; z: number; yaw: number };

export const UP = new Vector3(0, 1, 0);

/** Heading (rotation.y) that points an object's +Z axis along (dx, dz). */
export const yawOf = (dx: number, dz: number) => Math.atan2(dx, dz);

export const angleDelta = (from: number, to: number) => {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
};

export const clamp = MathUtils.clamp;

/** Frame-rate independent exponential smoothing. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  MathUtils.damp(current, target, lambda, dt);

export const approach = (current: number, target: number, maxDelta: number) =>
  current < target ? Math.min(target, current + maxDelta) : Math.max(target, current - maxDelta);

export function toWorld(a: Anchor, p: V3 | V2, out = new Vector3()) {
  if (p.length === 2) out.set(p[0], 0, p[1]);
  else out.set(p[0], p[1], p[2]);
  out.applyAxisAngle(UP, a.yaw);
  out.x += a.x;
  out.z += a.z;
  return out;
}

export function dirToWorld(a: Anchor, d: V2, out = new Vector3()) {
  return out.set(d[0], 0, d[1]).normalize().applyAxisAngle(UP, a.yaw);
}

/**
 * The anchor that places a world so its local entry point/direction lands on a
 * given world point/direction — how the next world is attached to the end of a corridor.
 */
export function anchorFor(entry: V2, entryDir: V2, worldPoint: Vector3, worldDir: Vector3): Anchor {
  const yaw = yawOf(worldDir.x, worldDir.z) - yawOf(entryDir[0], entryDir[1]);
  const p = new Vector3(entry[0], 0, entry[1]).applyAxisAngle(UP, yaw);
  return { x: worldPoint.x - p.x, z: worldPoint.z - p.z, yaw };
}

/** A smooth walking curve through points, with the arc-length position of each point. */
export function buildCurve(points: Vector3[]) {
  const clean: Vector3[] = [];
  for (const p of points) if (!clean.length || clean[clean.length - 1].distanceTo(p) > 0.35) clean.push(p.clone());
  if (clean.length === 1) clean.push(clean[0].clone().add(new Vector3(0, 0, -0.5)));
  const curve = new CatmullRomCurve3(clean, false, "centripetal", 0.5);
  const divisions = Math.max(200, clean.length * 60);
  curve.arcLengthDivisions = divisions;
  const lengths = curve.getLengths(divisions);
  const length = lengths[lengths.length - 1];
  const us = clean.map((_, i) => {
    const idx = Math.round((i / (clean.length - 1)) * divisions);
    return length > 0 ? lengths[idx] / length : 0;
  });
  return { curve, length, us };
}

/** Arc-length position (0–1) on the curve closest to a point. */
export function nearestU(curve: CatmullRomCurve3, point: Vector3, samples = 240) {
  let best = 0;
  let bestD = Infinity;
  const tmp = new Vector3();
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    curve.getPointAt(u, tmp);
    const d = (tmp.x - point.x) ** 2 + (tmp.z - point.z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = u;
    }
  }
  return best;
}

export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
