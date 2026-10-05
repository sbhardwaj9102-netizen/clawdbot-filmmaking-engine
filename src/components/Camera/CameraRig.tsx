"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { PerspectiveCamera } from "three";

import { chapters } from "@/data/story";
import { clamp, damp, easeInOut } from "@/lib/math";
import { rt } from "@/systems/Experience/runtime";
import { makePose, poseAt } from "@/systems/Experience/shots";
import { getExperience } from "@/systems/Experience/store";
import { tour } from "@/systems/Experience/tour";

/**
 * CAMERA RIG — plays the shot the director asked for. A new shot starts from
 * wherever the camera is and eases into the shot's own slow push; in the tour
 * the push runs on the chapter clock, so pausing freezes the frame. A breath
 * of handheld drift and (in Explore) a touch of pointer parallax keep the
 * frame alive. Reduced motion: cuts, no drift, no parallax.
 *
 * Framing: on wide screens the subject is nudged right during the tour
 * (captions sit left) and left when a side panel covers the right; on
 * narrow screens it is lifted above Explore's bottom sheet.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const from = useMemo(makePose, []);
  const want = useMemo(makePose, []);
  const out = useMemo(makePose, []);
  const last = useRef({ id: "", since: -1 });
  const offset = useRef(0);
  const offsetY = useRef(0);
  const par = useRef({ x: 0, y: 0 });

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = getExperience();
    const shot = rt.shot;
    const reduced = s.reducedMotion;
    rt.view.portrait = size.height > size.width * 1.05;
    rt.view.mobile = size.width < 760;

    // a new shot: start from where we are
    if (shot.id !== last.current.id || shot.since !== last.current.since) {
      from.pos.copy(camera.position);
      from.look.copy(out.look.lengthSq() ? out.look : camera.position);
      from.fov = camera.fov;
      if (last.current.since < 0) shot.blend = 0;
      last.current = { id: shot.id, since: shot.since };
    }

    const inTour = s.mode === "tour" && !s.ended;
    const elapsed = inTour ? rt.chapterT : (performance.now() - shot.since) / 1000;
    const duration = inTour ? chapters[tour.index].duration : 30;
    poseAt(shot.id, elapsed, duration, { still: reduced, portrait: rt.view.portrait }, want);

    const k = shot.blend <= 0 ? 1 : easeInOut(clamp((performance.now() - shot.since) / 1000 / shot.blend, 0, 1));
    out.pos.copy(from.pos).lerp(want.pos, k);
    out.look.copy(from.look).lerp(want.look, k);
    out.fov = from.fov + (want.fov - from.fov) * k;

    if (!reduced) {
      // handheld breath
      const t = rt.time;
      out.pos.x += Math.sin(t * 0.31) * 0.025 + Math.sin(t * 0.73) * 0.01;
      out.pos.y += Math.sin(t * 0.43 + 1.3) * 0.018;
      out.look.x += Math.sin(t * 0.37 + 0.4) * 0.02;
      // parallax, where the visitor is looking around
      const free = s.mode !== "tour" && !s.overlay;
      par.current.x = damp(par.current.x, free ? rt.pointer.x : 0, 2, dt);
      par.current.y = damp(par.current.y, free ? rt.pointer.y : 0, 2, dt);
      out.pos.x += par.current.x * 0.22;
      out.pos.y -= par.current.y * 0.12;
    }

    camera.position.copy(out.pos);
    camera.lookAt(out.look);
    rt.camera.pos.copy(out.pos);
    rt.camera.dir.copy(out.look).sub(out.pos).setY(0).normalize();

    // framing around the interface
    const wide = size.width >= 1024 && !rt.view.portrait;
    let target = 0;
    if (wide && s.mode === "tour" && !s.ended) target = -size.width * 0.07;
    else if (wide && rt.view.panel > 0) target = rt.view.panel * 0.5;
    offset.current = reduced ? target : damp(offset.current, target, 3, dt);
    // a sheet along the bottom (Explore on phones and tablets): lift the subject into the space above it
    const targetY = !wide && s.mode === "explore" ? rt.view.sheet * 0.45 : 0;
    offsetY.current = reduced ? targetY : damp(offsetY.current, targetY, 3, dt);

    let dirty = false;
    if (Math.abs(camera.fov - out.fov) > 0.01) {
      camera.fov = out.fov;
      dirty = true;
    }
    const o = Math.round(offset.current);
    const oy = Math.round(offsetY.current);
    if (o !== 0 || oy !== 0) {
      const v = camera.view;
      if (!v || !v.enabled || v.offsetX !== o || v.offsetY !== oy || v.fullWidth !== size.width || v.fullHeight !== size.height) {
        camera.setViewOffset(size.width, size.height, o, oy, size.width, size.height);
        dirty = false;
      }
    } else if (camera.view?.enabled) {
      camera.clearViewOffset();
      dirty = false;
    }
    if (dirty) camera.updateProjectionMatrix();
  }, -1);

  return null;
}
