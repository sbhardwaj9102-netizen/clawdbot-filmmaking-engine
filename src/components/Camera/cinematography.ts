import { CatmullRomCurve3, Vector3 } from "three";

import type { FollowConfig, V3 } from "@/scenes/types";
import { clamp, easeInOut, UP } from "@/systems/SceneManager/space";

/**
 * CINEMATOGRAPHY — pure functions that decide where the camera *wants* to be.
 * The CameraRig smooths toward these, adds parallax and handles framing.
 */
export type Pose = { pos: Vector3; look: Vector3; fov: number };

export const DEFAULT_FOLLOW: FollowConfig = {
  distance: 4.6,
  height: 1.95,
  side: 0.7,
  lookHeight: 1.25,
  lookAhead: 2.4,
  fov: 40,
};

const tmpRight = new Vector3();

/** Three-quarter rear tracking shot behind the avatar, aligned with the direction of travel. */
export function followPose(avatarPos: Vector3, forward: Vector3, cfg: FollowConfig, out: Pose, mobile: boolean) {
  const f = forward.clone().setY(0).normalize();
  tmpRight.crossVectors(f, UP).normalize();
  const dist = cfg.distance * (mobile ? 1.35 : 1);
  const height = cfg.height + (mobile ? 0.55 : 0);
  out.pos.copy(avatarPos).addScaledVector(f, -dist).addScaledVector(tmpRight, cfg.side).add(new Vector3(0, height, 0));
  out.look.copy(avatarPos).addScaledVector(f, cfg.lookAhead).add(new Vector3(0, cfg.lookHeight, 0));
  out.fov = cfg.fov;
  return out;
}

/** Over-the-shoulder push-in on an object the avatar is using. */
export function focusPose(mark: Vector3, object: Vector3, out: Pose, mobile: boolean) {
  const dir = object.clone().sub(mark).setY(0);
  if (dir.lengthSq() < 1e-4) dir.set(0, 0, -1);
  dir.normalize();
  tmpRight.crossVectors(dir, UP).normalize();
  const back = mobile ? 3.4 : 2.4;
  // over the right shoulder; low objects are looked down onto so the head never blocks them
  out.pos.copy(mark).addScaledVector(dir, -back).addScaledVector(tmpRight, mobile ? 0.7 : 1.45);
  out.pos.y = object.y < 1.3 ? object.y + 1.55 : Math.max(object.y + 0.35, 1.7);
  out.look.copy(object);
  out.fov = mobile ? 46 : 36;
  return out;
}

/** Keyframed camera move (the opening sequence). */
export class KeyframeTrack {
  private pos: CatmullRomCurve3;
  private look: CatmullRomCurve3;
  private times: number[];
  private fovs: number[];
  readonly duration: number;

  constructor(keys: { t: number; pos: V3; target: V3; fov: number }[], transform: (p: V3) => Vector3) {
    this.times = keys.map((k) => k.t);
    this.fovs = keys.map((k) => k.fov);
    this.pos = new CatmullRomCurve3(keys.map((k) => transform(k.pos)), false, "centripetal");
    this.look = new CatmullRomCurve3(keys.map((k) => transform(k.target)), false, "centripetal");
    this.duration = this.times[this.times.length - 1];
  }

  sample(t: number, out: Pose) {
    const n = this.times.length;
    const tt = clamp(t, 0, this.duration);
    let i = 0;
    while (i < n - 2 && tt > this.times[i + 1]) i++;
    const local = clamp((tt - this.times[i]) / Math.max(1e-3, this.times[i + 1] - this.times[i]), 0, 1);
    const e = easeInOut(local);
    const u = (i + e) / (n - 1);
    this.pos.getPoint(u, out.pos);
    this.look.getPoint(u, out.look);
    out.fov = this.fovs[i] + (this.fovs[i + 1] - this.fovs[i]) * e;
    return out;
  }
}

export const makePose = (): Pose => ({ pos: new Vector3(), look: new Vector3(), fov: 40 });
