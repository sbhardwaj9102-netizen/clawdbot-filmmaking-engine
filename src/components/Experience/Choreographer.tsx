"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { Vector3 } from "three";

import { angleDelta, clamp, damp, smoothstep, yawOf } from "@/lib/math";
import { envFor, type MarkId, MARKS, setupFor, STAGE } from "@/systems/Experience/choreography";
import { rt } from "@/systems/Experience/runtime";
import { getExperience } from "@/systems/Experience/store";

/**
 * CHOREOGRAPHER — runs first every frame. Walks Satyam along his route,
 * turns him to what he's looking at, flies PA-1 beside him, and eases the
 * rooms' light and the set's state toward what the story asks for.
 */

const LOOK: Record<MarkId, Vector3 | null> = {
  monitor: new Vector3(-2.2, 1.45, 0.9),
  aster: new Vector3(-9.1, 1.7, -1.2),
  purple: STAGE.fire.clone().setY(1.1),
  live: new Vector3(2.2, 4.2, -1.5),
  strategist: new Vector3(18.6, 1.1, -3),
  display: STAGE.display.clone().setY(2),
  center: null,
  door: STAGE.door.clone().setY(2.2),
};

export function Choreographer() {
  const tmp = useMemo(() => ({ v: new Vector3(), right: new Vector3(), fwd: new Vector3(), off: new Vector3(), ndc: new Vector3() }), []);
  const camera = useThree((s) => s.camera);
  const sideRef = useMemo(() => ({ setup: "", side: 1 }), []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.25);
    const s = getExperience();
    const setup = setupFor(s);
    const a = rt.avatar;
    const reduced = s.reducedMotion;
    const holding = s.mode === "tour" && (s.paused || !!s.overlay);

    // ── Satyam ────────────────────────────────────────────────
    const g = a.goal;
    if (g && !holding) {
      const p = g.points[0];
      const dx = p.x - a.pos.x;
      const dz = p.z - a.pos.z;
      const dist = Math.hypot(dx, dz);
      const last = g.points.length === 1;
      const desired = last ? Math.min(g.speed, dist * 1.6 + 0.08) : g.speed;
      a.speed = a.speed + clamp(desired - a.speed, -3 * dt, 1.8 * dt);
      if (dist < (last ? 0.04 : 0.4)) {
        if (last) {
          a.goal = null;
          a.face = g.faceYaw;
        } else g.points.shift();
      } else {
        const step = Math.min(dist, a.speed * dt);
        a.pos.x += (dx / dist) * step;
        a.pos.z += (dz / dist) * step;
        a.yaw += angleDelta(a.yaw, yawOf(dx, dz)) * (1 - Math.exp(-7 * dt));
      }
      a.look = null;
    } else {
      a.speed = damp(a.speed, 0, 6, dt);
      if (!g) {
        a.face = MARKS[setup.mark].pos.distanceTo(a.pos) < 0.6 ? MARKS[setup.mark].face : a.face;
        a.yaw += angleDelta(a.yaw, a.face) * (1 - Math.exp(-3.5 * dt));
        a.look = a.speed < 0.2 ? LOOK[setup.mark] : null;
      }
    }

    // ── PA-1 ──────────────────────────────────────────────────
    const r = rt.robot;
    const present = s.mode === "landing" ? 0 : 1;
    r.presence = damp(r.presence, present, s.mode === "landing" ? 2 : 0.9, dt);
    // Placed on screen, not in metres, so it holds at every aspect ratio: beside Satyam
    // (frame-right by default, away from the captions), a little beyond him, never
    // up against the lens, and pulled in from the edge rather than cropped.
    const cam = rt.camera;
    const portrait = rt.view.portrait;
    const GAP = portrait ? 0.55 : 0.34;
    const LIMIT = portrait ? 0.72 : 0.8;
    tmp.ndc.copy(a.pos).setY(1.5).project(camera);
    const satX = tmp.ndc.z > 1 ? -Math.sign(tmp.ndc.x) * 2 : tmp.ndc.x;
    // each set-up starts on its preferred side; squeezed against an edge, he crosses over (and stays)
    const key = `${setup.shot}:${setup.mark}`;
    if (sideRef.setup !== key) {
      sideRef.setup = key;
      sideRef.side = setup.robotSide ?? 1;
    }
    let x = clamp(satX + sideRef.side * GAP, -LIMIT, LIMIT);
    if (Math.abs(x - satX) < GAP * 0.55) {
      sideRef.side = -sideRef.side;
      x = clamp(satX + sideRef.side * GAP, -LIMIT, LIMIT);
    }
    tmp.off.copy(a.pos).sub(cam.pos).setY(0);
    const depth = Math.max(3.4, tmp.off.dot(cam.dir) + 0.55);
    // the point at that screen x, `depth` metres in front of the lens
    camera.getWorldDirection(tmp.right);
    tmp.fwd.set(x, 0, 0.5).unproject(camera).sub(camera.position).normalize();
    const along = Math.max(0.2, tmp.fwd.dot(tmp.right));
    tmp.v.copy(camera.position).addScaledVector(tmp.fwd, depth / along);
    // leads a little when he walks
    tmp.fwd.set(Math.sin(a.yaw), 0, Math.cos(a.yaw));
    tmp.v.addScaledVector(tmp.fwd, Math.min(a.speed, 1.8) * 0.4);
    const bob = reduced ? 0 : Math.sin(rt.time * 1.7) * 0.06 + Math.sin(rt.time * 0.6) * 0.03;
    tmp.v.y = (setup.robotHeight ?? 1.95) + bob;
    // before he's needed he waits high above the set
    tmp.off.set(a.pos.x + 3.5, 6.5, a.pos.z + 3);
    tmp.v.lerp(tmp.off, 1 - smoothstep(0, 1, r.presence));
    if ((reduced || r.snap) && r.presence > 0.98) {
      r.pos.copy(tmp.v);
      r.snap = false;
    } else {
      r.pos.x = damp(r.pos.x, tmp.v.x, 2.2, dt);
      r.pos.y = damp(r.pos.y, tmp.v.y, 2.2, dt);
      r.pos.z = damp(r.pos.z, tmp.v.z, 2.2, dt);
    }
    // talks to the audience; otherwise keeps an eye on what Satyam is doing
    const lookAt = r.speaking || !a.look ? rt.camera.pos : a.look;
    r.yaw += angleDelta(r.yaw, yawOf(lookAt.x - r.pos.x, lookAt.z - r.pos.z)) * (1 - Math.exp(-3 * dt));

    // ── light and set ─────────────────────────────────────────
    rt.rooms.producer = damp(rt.rooms.producer, setup.producer, 1.1, dt);
    rt.rooms.strategist = damp(rt.rooms.strategist, setup.strategist, 1.1, dt);

    const e = envFor(s, rt.chapterT);
    const k = s.mode === "tour" ? 6 : 2.4;
    const env = rt.env;
    env.pins = damp(env.pins, e.pins, k, dt);
    env.days = damp(env.days, e.days, k, dt);
    env.fire = damp(env.fire, e.fire, 2.5, dt);
    env.strings = damp(env.strings, e.strings, 2.5, dt);
    env.shift = damp(env.shift, e.shift, s.mode === "tour" ? 8 : 1.6, dt);
    env.door = damp(env.door, e.door, 1.8, dt);
    env.steps = damp(env.steps, e.steps, k, dt);
    env.rack = damp(env.rack, e.rack, 3, dt);
    env.screen = e.screen;
  }, -3);

  return null;
}
