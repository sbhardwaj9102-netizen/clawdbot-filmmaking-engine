import { Vector3 } from "three";

import type { ShotId } from "@/data/story";
import { easeInOut } from "@/lib/math";

/**
 * SHOTS — the camera set-ups, in world space. Each has a start frame and,
 * usually, an end frame the camera drifts to over `push` seconds (a slow
 * dolly or push-in, never a spin). Moving between shots is eased by the
 * CameraRig; under reduced motion it cuts and holds the start frame.
 */
type Frame = { pos: [number, number, number]; target: [number, number, number]; fov: number };
export type Shot = Frame & { end?: Frame; push?: number };

export const SHOTS: Record<ShotId, Shot> = {
  landing: {
    pos: [-0.6, 3.5, 13.5],
    target: [-2, 1.5, -3],
    fov: 40,
    end: { pos: [-2.8, 3.1, 12.4], target: [-2.2, 1.5, -3], fov: 40 },
    push: 40,
  },
  establish: {
    pos: [-1.4, 5.8, 15],
    target: [-2.2, 1.1, -2],
    fov: 40,
    end: { pos: [-1.8, 2.5, 9.4], target: [-2.2, 1.3, -1], fov: 40 },
  },
  satyam: {
    pos: [0.3, 1.85, 5.9],
    target: [-2.6, 1.35, 0.4],
    fov: 36,
    end: { pos: [-0.6, 1.75, 4.7], target: [-2.6, 1.4, 0.4], fov: 36 },
  },
  set: {
    pos: [-6.6, 2.3, 6.6],
    target: [-5, 1.4, -3.5],
    fov: 44,
    end: { pos: [1.4, 2.3, 6.8], target: [2.5, 1.4, -4], fov: 44 },
  },
  aster: {
    pos: [-2, 2, 4.6],
    target: [-8.6, 1.7, -1.4],
    fov: 40,
    end: { pos: [-3.7, 1.85, 2.4], target: [-9, 1.75, -1.3], fov: 38 },
  },
  purple: {
    pos: [-1.4, 1.7, 3.8],
    target: [3.6, 1.2, -5],
    fov: 40,
    end: { pos: [-0.2, 1.55, 2.2], target: [3.4, 1.1, -4.8], fov: 38 },
  },
  live: {
    pos: [0.6, 1.25, 7.2],
    target: [2.6, 3.4, -2.5],
    fov: 46,
    end: { pos: [1.4, 1.35, 6.2], target: [3, 3.1, -2.5], fov: 46 },
  },
  shift: {
    pos: [2.5, 2.1, 7.6],
    target: [6.5, 1.5, -2.5],
    fov: 44,
    end: { pos: [14.2, 2.1, 7.4], target: [13.5, 1.5, -2.5], fov: 44 },
  },
  strategist: {
    pos: [13.6, 1.85, 6],
    target: [18.4, 1.4, -3.5],
    fov: 40,
    end: { pos: [14.6, 1.8, 4.8], target: [18.6, 1.4, -3.6], fov: 40 },
  },
  finance: {
    pos: [17.6, 1.8, 4.2],
    target: [25.2, 1.9, -0.6],
    fov: 40,
    end: { pos: [18.6, 1.75, 3.4], target: [25.4, 1.95, -0.5], fov: 40 },
  },
  wide: {
    pos: [8.5, 9.5, 18],
    target: [8, 0.6, -2.5],
    fov: 48,
    end: { pos: [9, 8.2, 16], target: [8.5, 0.8, -2.5], fov: 48 },
  },
  future: {
    pos: [9.4, 1.35, 6.2],
    target: [9, 2, -8],
    fov: 40,
    end: { pos: [9.2, 1.5, 3.2], target: [9, 2.4, -8.4], fov: 40 },
  },
  end: {
    pos: [9.1, 1.6, 2.8],
    target: [9, 2.5, -8.4],
    fov: 42,
    end: { pos: [9.6, 1.7, 3.6], target: [9, 2.5, -8.4], fov: 42 },
    push: 30,
  },
  "explore-about": { pos: [0.6, 2, 6.4], target: [-2.4, 1.3, 0.4], fov: 40 },
  "explore-aster": { pos: [-3.3, 1.9, 3], target: [-9, 1.75, -1.3], fov: 40 },
  "explore-purple": { pos: [-0.6, 1.65, 2.8], target: [3.5, 1.1, -4.9], fov: 40 },
  "explore-live": { pos: [1.2, 1.3, 6.6], target: [2.8, 3.1, -2.5], fov: 46 },
  "explore-more": { pos: [-4.5, 1.75, -1.4], target: [-6.7, 1.3, -6.1], fov: 38 },
  "explore-strategy": { pos: [14.2, 1.9, 5.6], target: [19.5, 1.5, -2.5], fov: 42 },
  "explore-contact": { pos: [9.1, 1.7, 4.2], target: [9, 2.3, -8.4], fov: 42 },
};

export type Pose = { pos: Vector3; look: Vector3; fov: number };
export const makePose = (): Pose => ({ pos: new Vector3(), look: new Vector3(), fov: 40 });

const a = new Vector3();
const b = new Vector3();

/**
 * Where the camera is `elapsed` seconds into a shot.
 * `portrait`: phones held upright see less width — pull back along the view and widen a little.
 */
export function poseAt(id: ShotId, elapsed: number, duration: number, opts: { still: boolean; portrait: boolean }, out: Pose) {
  const s = SHOTS[id];
  const k = !s.end || opts.still ? 0 : easeInOut(Math.min(1, Math.max(0, elapsed / (s.push ?? duration))));
  const e = s.end ?? s;
  out.pos.set(...s.pos).lerp(a.set(...e.pos), k);
  out.look.set(...s.target).lerp(b.set(...e.target), k);
  out.fov = s.fov + (e.fov - s.fov) * k;
  if (opts.portrait) {
    a.copy(out.pos).sub(out.look);
    out.pos.copy(out.look).addScaledVector(a, 1.55);
    out.pos.y += 0.35;
    out.fov += 10;
  }
  return out;
}
