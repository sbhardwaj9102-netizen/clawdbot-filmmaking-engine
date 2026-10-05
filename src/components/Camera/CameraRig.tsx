"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { MathUtils, type PerspectiveCamera, Vector3 } from "three";

import { rt } from "@/systems/SceneManager/director";
import { damp, UP } from "@/systems/SceneManager/space";
import { getStory } from "@/systems/StoryEngine/store";

/**
 * CAMERA RIG — smooths toward the director's desired pose with mode-specific
 * easing (dolly, tracking, push-in, pull-out), then layers on:
 *   • mouse parallax and a faint handheld drift (off in reduced motion)
 *   • portrait-aware field of view, so phones keep a cinematic frame
 *   • a view offset that keeps the subject clear of an open side panel
 */

const LAMBDA: Record<string, [number, number]> = {
  intro: [9, 9],
  follow: [2.4, 3.4],
  transit: [3.2, 4],
  focus: [2.2, 2.6],
  shot: [1.5, 1.9],
  dive: [3.5, 4],
};

export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const par = useRef({ x: 0, y: 0, offX: 0, offY: 0, mode: "" });
  const tmp = useRef({ right: new Vector3(), up: new Vector3(), off: new Vector3() });

  useEffect(() => {
    camera.near = 0.08;
    camera.far = 260;
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05) * rt.timeScale;
    const c = rt.camera;
    const d = c.desired;
    const s = getStory();
    const reduced = s.reducedMotion;
    const p = par.current;

    if (c.snap) {
      c.pos.copy(d.pos);
      c.look.copy(d.look);
      c.fov = d.fov;
      c.snap = false;
    } else {
      // reduced motion: shot changes become cuts, tracking stays tight and calm
      if (reduced && p.mode !== c.mode && (c.mode === "shot" || c.mode === "focus" || p.mode === "shot" || p.mode === "focus")) {
        c.pos.copy(d.pos);
        c.look.copy(d.look);
        c.fov = d.fov;
      }
      const [lp, ll] = LAMBDA[c.mode] ?? LAMBDA.follow;
      const k = reduced ? 2.2 : 1;
      c.pos.x = damp(c.pos.x, d.pos.x, lp * k, dt);
      c.pos.y = damp(c.pos.y, d.pos.y, lp * k, dt);
      c.pos.z = damp(c.pos.z, d.pos.z, lp * k, dt);
      c.look.x = damp(c.look.x, d.look.x, ll * k, dt);
      c.look.y = damp(c.look.y, d.look.y, ll * k, dt);
      c.look.z = damp(c.look.z, d.look.z, ll * k, dt);
      c.fov = damp(c.fov, d.fov, 2.5, dt);
    }
    p.mode = c.mode;

    // parallax + handheld
    const fine = !rt.mobile && !reduced;
    p.x = damp(p.x, fine ? rt.pointer.x : 0, 2.2, dt);
    p.y = damp(p.y, fine ? rt.pointer.y : 0, 2.2, dt);
    const t = rt.time;
    const drift = reduced ? 0 : 1;
    const { right, up, off } = tmp.current;
    right.subVectors(c.look, c.pos).cross(UP).normalize();
    up.copy(UP);
    const amp = c.mode === "focus" ? 0.12 : c.mode === "intro" ? 0.05 : 0.3;
    off
      .set(0, 0, 0)
      .addScaledVector(right, p.x * amp + Math.sin(t * 0.37) * 0.025 * drift)
      .addScaledVector(up, -p.y * amp * 0.55 + Math.sin(t * 0.53 + 1.3) * 0.018 * drift);

    camera.position.copy(c.pos).add(off);
    const lookOff = off.multiplyScalar(0.35);
    camera.lookAt(c.look.x + lookOff.x, c.look.y + lookOff.y, c.look.z + lookOff.z);

    // portrait framing: widen the vertical FOV toward a 16:9 horizontal field
    const aspect = size.width / Math.max(1, size.height);
    let fov = c.fov;
    if (aspect < 1.1) {
      const h = 2 * Math.atan(Math.tan(MathUtils.degToRad(fov) / 2) * 1.25);
      const v = MathUtils.radToDeg(2 * Math.atan(Math.tan(h / 2) / aspect));
      fov = Math.min(74, fov + (v - fov) * 0.62);
    }

    // keep the subject clear of the side panel (desktop) / bottom sheet (mobile)
    const panel = !!s.hotspot && s.hotspot.status === "open" && !s.lightbox && !s.overlay;
    const wide = size.width >= 900;
    const targetX = panel && wide ? Math.min(size.width * 0.21, 300) : 0;
    const targetY = panel && !wide ? -size.height * 0.2 : 0;
    p.offX = damp(p.offX, targetX, 4, dt);
    p.offY = damp(p.offY, targetY, 4, dt);

    let dirty = false;
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      dirty = true;
    }
    if (Math.abs(p.offX) > 0.5 || Math.abs(p.offY) > 0.5) {
      camera.setViewOffset(size.width, size.height, p.offX, -p.offY, size.width, size.height);
      dirty = true;
    } else if (camera.view?.enabled) {
      camera.clearViewOffset();
      dirty = true;
    }
    if (dirty) camera.updateProjectionMatrix();
  }, -1);

  return null;
}
