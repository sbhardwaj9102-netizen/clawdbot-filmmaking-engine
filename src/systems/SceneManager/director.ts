"use client";

import { type CatmullRomCurve3, Vector3 } from "three";

import { DEFAULT_FOLLOW, focusPose, followPose, KeyframeTrack, makePose, type Pose } from "@/components/Camera/cinematography";
import { hotspots as hotspotDefs } from "@/data/story/hotspots";
import { questions } from "@/data/story/questions";
import { sceneById } from "@/data/story/scenes";
import type { Beat, HoldLine, Mark, SceneId, StoryScene } from "@/data/story/types";
import { preloadTextures, texturesLoaded } from "@/lib/textureCache";
import { getLayout } from "@/scenes/layouts";
import type { FollowConfig, WorldLayout } from "@/scenes/types";
import { audio } from "@/systems/AudioManager/audio";
import { getStory, type TransitionKind, useStory } from "@/systems/StoryEngine/store";

import {
  type Anchor,
  anchorFor,
  angleDelta,
  approach,
  buildCurve,
  clamp,
  dirToWorld,
  nearestU,
  toWorld,
  yawOf,
} from "./space";

/**
 * DIRECTOR
 * ------------------------------------------------------------------
 * The real-time half of the story engine. Once per frame it:
 *   • turns scroll / touch / keys into the avatar walking along the world's path
 *   • pauses the walk at story beats and plays timed lines
 *   • opens questions where a path ends, routes choices to the next scene
 *   • walks the avatar to objects and back
 *   • runs transitions: walk (corridor), dive (into a screen), cut (fade)
 *   • decides what the camera should be looking at
 * React renders from the store; per-frame values live in `rt`.
 */

type WorldShot = { pos: Vector3; target: Vector3; fov?: number };

export type ActiveScene = {
  id: SceneId;
  story: StoryScene;
  layout: WorldLayout;
  anchor: Anchor;
  curve: CatmullRomCurve3;
  length: number;
  marks: Record<string, number>;
  beats: (Beat & { atU: number; untilU: number })[];
  hotspots: Record<string, { object: Vector3; mark: Vector3; shot?: WorldShot }>;
  anchors: Record<string, Vector3>;
  shots: Record<string, WorldShot>;
  exits: Record<string, { p: Vector3; dir: Vector3; via: Vector3[] }>;
  follow: FollowConfig;
};

type Transit =
  | {
      kind: "walk";
      to: SceneId;
      curve: CatmullRomCurve3;
      length: number;
      s: number;
      v: number;
      swapAt: number;
      swapped: boolean;
      anchor: Anchor;
      next: ActiveScene;
      waited: number;
    }
  | { kind: "dive"; to: SceneId; t: number; phase: "push" | "expand" | "reveal"; source: Vector3; spawn?: string; swapped: boolean }
  | { kind: "cut"; to: SceneId; t: number; swapped: boolean; spawn?: string };

const CORRIDOR = 13;

export const rt = {
  time: 0,
  active: null as ActiveScene | null,
  transit: null as Transit | null,
  input: 0,
  held: 0,
  mobile: false,
  avatar: {
    pos: new Vector3(),
    yaw: Math.PI,
    velocity: 0,
    speed: 0,
    mode: "path" as "path" | "free" | "transit",
    u: 0,
    targetU: 0,
    overscroll: 0,
    free: null as null | { target: Vector3; onArrive?: () => void; arrived: boolean },
    faceYaw: null as number | null,
    look: null as Vector3 | null,
    reachTarget: null as Vector3 | null,
    forward: new Vector3(0, 0, -1),
  },
  camera: {
    desired: makePose(),
    pos: new Vector3(0, 2, 30),
    look: new Vector3(0, 1, 0),
    fov: 40,
    snap: true,
    mode: "follow" as "intro" | "follow" | "focus" | "shot" | "transit" | "dive",
  },
  intro: { t: 0, speed: 1, track: null as KeyframeTrack | null },
  hold: null as null | { beatId: string; index: number; t: number; lines: HoldLine[]; boost: number },
  fired: new Set<string>(),
  holdsDone: new Set<string>(),
  pointer: { x: 0, y: 0 },
  /** Test/debug only: `?speed=4` runs the world faster (used by the end-to-end tests). */
  timeScale:
    typeof window !== "undefined" ? Math.min(12, Math.max(1, Number(new URLSearchParams(window.location.search).get("speed")) || 1)) : 1,
  mountKey: 1,
  lastNearby: "",
};

// ─── building a scene in world space ────────────────────────────

function resolveMark(sc: Pick<ActiveScene, "marks">, m: Mark | undefined, fallback: number) {
  if (m === undefined) return fallback;
  if (typeof m === "number") return m;
  return sc.marks[m] ?? fallback;
}

export function buildActive(id: SceneId, anchor: Anchor): ActiveScene {
  const story = sceneById[id];
  const layout = getLayout(story);
  const pts = layout.path.map((w) => toWorld(anchor, w.p));
  const { curve, length, us } = buildCurve(pts);
  const marks: Record<string, number> = {};
  layout.path.forEach((w, i) => (marks[w.id] = us[Math.min(i, us.length - 1)]));
  const partial = { marks };
  const sorted = [...story.beats]
    .map((b) => ({ ...b, atU: resolveMark(partial, b.at, 0) }))
    .sort((a, b) => a.atU - b.atU);
  const beats = sorted.map((b, i) => ({
    ...b,
    untilU: resolveMark(partial, b.until, i < sorted.length - 1 ? sorted[i + 1].atU : 1.01),
  }));
  const shot = (s: { pos: [number, number, number]; target: [number, number, number]; fov?: number }): WorldShot => ({
    pos: toWorld(anchor, s.pos),
    target: toWorld(anchor, s.target),
    fov: s.fov,
  });
  const hotspots: ActiveScene["hotspots"] = {};
  for (const [hid, h] of Object.entries(layout.hotspots)) {
    hotspots[hid] = { object: toWorld(anchor, h.object), mark: toWorld(anchor, h.mark), shot: h.shot ? shot(h.shot) : undefined };
  }
  const anchors: Record<string, Vector3> = {};
  for (const [k, p] of Object.entries(layout.anchors ?? {})) anchors[k] = toWorld(anchor, p);
  const shots: Record<string, WorldShot> = {};
  for (const [k, s] of Object.entries(layout.shots ?? {})) shots[k] = shot(s);
  const exits: ActiveScene["exits"] = {};
  for (const [k, e] of Object.entries(layout.exits))
    exits[k] = { p: toWorld(anchor, e.p), dir: dirToWorld(anchor, e.dir), via: (e.via ?? []).map((v) => toWorld(anchor, v)) };
  return {
    id,
    story,
    layout,
    anchor,
    curve,
    length: Math.max(length, 0.5),
    marks,
    beats,
    hotspots,
    anchors,
    shots,
    exits,
    follow: { ...DEFAULT_FOLLOW, ...layout.follow },
  };
}

/** Anchor that puts a world's entry at the origin, facing -Z. */
function originAnchor(id: SceneId): Anchor {
  const layout = getLayout(sceneById[id]);
  const e = layout.path[0].p;
  const n = layout.path[1]?.p ?? [e[0], e[1] - 1];
  return anchorFor(e, [n[0] - e[0], n[1] - e[1]], new Vector3(0, 0, 0), new Vector3(0, 0, -1));
}

// ─── progress + journey bookkeeping ─────────────────────────────

function computeProgress(visited: SceneId[]) {
  const primary = visited.filter((v) => sceneById[v]?.primary).length;
  const has = (s: SceneId) => (visited.includes(s) ? 1 : 0);
  return Math.min(1, (has("studio") + Math.min(primary, 3) + has("career") + has("about") + has("final")) / 7);
}

export const primaryVisited = () => getStory().visitedScenes.filter((v) => sceneById[v]?.primary).length;

function enter(sc: ActiveScene, spawn?: string, keepAvatar = false) {
  const prev = rt.active;
  rt.active = sc;
  rt.fired.clear();
  rt.holdsDone.clear();
  rt.hold = null;
  const a = rt.avatar;
  a.overscroll = 0;
  a.free = null;
  a.faceYaw = null;
  a.reachTarget = null;
  a.look = null;

  const s = getStory();
  const visited = s.visitedScenes.includes(sc.id) ? s.visitedScenes : [...s.visitedScenes, sc.id];
  const projects =
    sc.story.world === "project" && !s.selectedProjects.includes(sc.id) ? [...s.selectedProjects, sc.id] : s.selectedProjects;
  useStory.setState({
    currentScene: sc.id,
    previousScene: prev && prev.id !== sc.id ? prev.id : s.previousScene,
    visitedScenes: visited,
    selectedProjects: projects,
    progress: computeProgress(visited),
    chapterAt: performance.now(),
    activeBeat: null,
    holdLine: null,
    questionOpen: false,
    atEnd: false,
    hotspot: null,
    nearby: [],
    worldEvents: {},
    letterbox: !!sc.story.auto,
  });
  rt.lastNearby = "";
  audio.setWorld(sc.story.world);
  if (keepAvatar) {
    a.u = a.targetU = 0;
    return;
  }

  if (spawn && sc.hotspots[spawn]) {
    const h = sc.hotspots[spawn];
    a.pos.copy(h.mark);
    a.u = a.targetU = nearestU(sc.curve, h.mark);
    a.yaw = yawOf(h.object.x - h.mark.x, h.object.z - h.mark.z);
    a.mode = "free";
    a.free = { target: sc.curve.getPointAt(a.u), arrived: false, onArrive: () => (a.mode = "path") };
  } else if (spawn && sc.marks[spawn] !== undefined) {
    a.u = a.targetU = sc.marks[spawn];
    sc.curve.getPointAt(a.u, a.pos);
    a.mode = "path";
  } else {
    a.u = 0;
    a.targetU = 0;
    sc.curve.getPointAt(0, a.pos);
    a.mode = "path";
    const t = sc.curve.getTangentAt(0);
    a.yaw = yawOf(t.x, t.z);
  }
  a.velocity = 0;
}

function mountOnly(sc: ActiveScene) {
  useStory.setState({ mounted: [{ key: rt.mountKey++, scene: sc.id, anchor: sc.anchor }] });
}

// ─── public engine API ─────────────────────────────────────────

/** Start (or resume) the journey at a scene. */
export function startAt(id: SceneId, opts: { intro: boolean; spawn?: string; hold?: boolean }) {
  const anchor = id === "studio" ? { x: 0, z: 0, yaw: 0 } : originAnchor(id);
  rt.transit = null;
  useStory.setState({ corridor: null, transition: null, dive: null, hotspot: null, questionOpen: false });
  const sc = buildActive(id, anchor);
  preloadTextures(sc.layout.textures);
  mountOnly(sc);
  enter(sc, opts.spawn);
  rt.camera.snap = true;
  rt.input = 0;
  if (opts.intro && sc.layout.intro) {
    rt.intro.t = 0;
    rt.intro.speed = 1;
    rt.intro.track = new KeyframeTrack(sc.layout.intro, (p) => toWorld(anchor, p));
    useStory.setState({ phase: opts.hold ? "ready" : "intro", letterbox: true });
  } else {
    rt.intro.track = null;
    useStory.setState({ phase: "explore", letterbox: !!sc.story.auto, fade: 1 });
    window.setTimeout(() => useStory.setState({ fade: 0 }), 80);
  }
}

/** Begin the opening sequence prepared by startAt(…, { hold: true }). */
export function playIntro() {
  if (getStory().phase === "ready" && rt.intro.track) {
    rt.intro.t = 0;
    useStory.setState({ phase: "intro" });
  }
}

export function skipIntro() {
  if (getStory().phase !== "intro") return;
  rt.intro.speed = 6;
}

/** Scroll / swipe / key input, in metres of walking. */
export function walk(metres: number) {
  const s = getStory();
  if (s.phase === "intro") {
    if (metres > 0) skipIntro();
    return;
  }
  if (rt.hold && metres > 0) {
    rt.hold.boost = Math.min(rt.hold.boost + metres * 0.35, 4);
    return;
  }
  if (rt.transit?.kind === "walk") {
    rt.transit.v = Math.min(rt.transit.v + Math.max(0, metres) * 0.25, 3.6);
    return;
  }
  rt.input += metres;
}

export function setHeldWalk(metresPerSecond: number) {
  rt.held = metresPerSecond;
}

export function go(
  to: SceneId,
  opts: { kind?: TransitionKind; exitKey?: string; spawn?: string; push?: boolean } = {},
) {
  if (rt.transit || !rt.active) return;
  const s = getStory();
  const from = rt.active.id;
  let kind: TransitionKind = opts.kind ?? "walk";
  if (to === from && kind === "walk") kind = "cut";
  if (s.reducedMotion && kind !== "cut") kind = "cut";
  if (kind === "walk" && rt.avatar.mode !== "path" && rt.avatar.mode !== "free") kind = "cut";

  const history = opts.push === false ? s.history.slice(0, -1) : [...s.history, from].slice(-30);
  useStory.setState({
    transition: { kind, from, to },
    history,
    questionOpen: false,
    hotspot: null,
    activeBeat: null,
    holdLine: null,
    letterbox: true,
  });
  rt.hold = null;
  rt.input = 0;
  const a = rt.avatar;
  a.reachTarget = null;
  a.faceYaw = null;

  if (kind === "walk") {
    const cur = rt.active;
    const exit = (opts.exitKey && cur.exits[opts.exitKey]) || cur.exits[to] || cur.exits.default;
    const start = exit.p.clone();
    const dir = exit.dir.clone().setY(0).normalize();
    const end = start.clone().addScaledVector(dir, CORRIDOR);
    const nextLayout = getLayout(sceneById[to]);
    const e = nextLayout.path[0].p;
    const n = nextLayout.path[1]?.p ?? [e[0], e[1] - 1];
    const anchor = anchorFor(e, [n[0] - e[0], n[1] - e[1]], end, dir);
    const next = buildActive(to, anchor);
    preloadTextures(next.layout.textures);
    const firstIn = next.curve.getPointAt(Math.min(1, 1.2 / next.length));
    const pts = [
      a.pos.clone(),
      ...exit.via,
      start.clone().addScaledVector(dir, -0.6),
      start,
      start.clone().addScaledVector(dir, CORRIDOR * 0.5),
      end,
      firstIn,
    ];
    const { curve, length } = buildCurve(pts);
    const startS = length - CORRIDOR - 1.2;
    rt.transit = {
      kind,
      to,
      curve,
      length,
      s: 0,
      v: Math.max(0.6, a.speed),
      swapAt: startS + CORRIDOR * 0.5,
      swapped: false,
      anchor,
      next,
      waited: 0,
    };
    a.mode = "transit";
    a.free = null;
    useStory.setState({
      corridor: {
        key: rt.mountKey++,
        x: start.x,
        z: start.z,
        yaw: yawOf(dir.x, dir.z),
        length: CORRIDOR,
        from: cur.layout.palette.accent,
        to: next.layout.palette.accent,
      },
    });
    audio.whoosh();
  } else if (kind === "dive") {
    const src = opts.spawn ? rt.active.hotspots[opts.spawn]?.object : undefined;
    rt.transit = { kind, to, t: 0, phase: "push", source: (src ?? a.pos).clone(), swapped: false };
    preloadTextures(getLayout(sceneById[to]).textures);
    audio.whoosh();
  } else {
    rt.transit = { kind, to, t: 0, swapped: false, spawn: opts.spawn };
    preloadTextures(getLayout(sceneById[to]).textures);
    useStory.setState({ fade: 1 });
  }
}

export function back() {
  const s = getStory();
  if (rt.transit || !s.history.length) return;
  const prev = s.history[s.history.length - 1];
  const cur = s.currentScene;
  const spawn = sceneById[cur].world === "project" && prev === "film" ? `monitor-${cur}` : undefined;
  go(prev, { kind: "cut", spawn, push: false });
}

export function choose(questionId: string, optionId: string) {
  const s = getStory();
  if (rt.transit || !rt.active) return;
  const q = questions[questionId];
  if (!q) return;
  const option =
    q.options.find((o) => o.id === optionId) ??
    (optionId === "onward" && q.onward ? { id: "onward", label: q.onward.label, next: q.onward.next } : undefined);
  if (!option) return;
  useStory.setState({
    choices: { ...s.choices, [questionId]: option.id },
    currentChoice: { question: questionId, option: option.id },
    questionOpen: false,
  });
  s.fire(`choice-${option.id}`);
  audio.choice();
  const monitor = `monitor-${option.next}`;
  window.setTimeout(() => {
    if (rt.active?.hotspots[monitor] && sceneById[option.next].world === "project") openHotspot(monitor);
    else go(option.next, { kind: "walk", exitKey: option.id });
  }, getStory().reducedMotion ? 150 : 700);
}

export function openHotspot(id: string) {
  const s = getStory();
  const sc = rt.active;
  if (!sc || rt.transit || rt.hold || s.phase !== "explore") return;
  const h = sc.hotspots[id];
  const def = hotspotDefs[id];
  if (!h || !def) return;
  const a = rt.avatar;
  useStory.setState({ hotspot: { id, status: "approach" }, questionOpen: false });
  audio.tick();
  a.mode = "free";
  a.free = { target: h.mark.clone(), arrived: false, onArrive: () => arrive(id) };
}

function arrive(id: string) {
  const sc = rt.active;
  if (!sc) return;
  const h = sc.hotspots[id];
  const def = hotspotDefs[id];
  const a = rt.avatar;
  a.faceYaw = yawOf(h.object.x - a.pos.x, h.object.z - a.pos.z);
  a.reachTarget = def.reach ? h.object.clone() : null;
  const s = getStory();
  switch (def.action.type) {
    case "panel":
      useStory.setState({ hotspot: { id, status: "open" } });
      break;
    case "media":
      useStory.setState({ hotspot: { id, status: "open" }, lightbox: { items: def.action.items, index: 0 } });
      break;
    case "resume":
      useStory.setState({ hotspot: { id, status: "open" }, overlay: "resume" });
      break;
    case "project": {
      const target = def.action.scene;
      window.setTimeout(() => go(target, { kind: s.reducedMotion ? "cut" : "dive", spawn: id }), s.reducedMotion ? 0 : 250);
      break;
    }
  }
}

export function closeHotspot() {
  const s = getStory();
  const sc = rt.active;
  if (!s.hotspot || !sc) return;
  useStory.setState({ hotspot: null });
  const a = rt.avatar;
  a.reachTarget = null;
  a.faceYaw = null;
  if (rt.transit) return;
  const u = nearestU(sc.curve, a.pos);
  a.u = a.targetU = u;
  a.mode = "free";
  a.free = { target: sc.curve.getPointAt(u), arrived: false, onArrive: () => (a.mode = "path") };
}

/** Jump straight to a scene (menu / deep link) with a cinematic cut. */
export function jump(id: SceneId, spawn?: string) {
  const s = getStory();
  if (s.phase === "intro") {
    rt.intro.t = rt.intro.track?.duration ?? 0;
  }
  if (rt.transit) return;
  if (s.hotspot) useStory.setState({ hotspot: null, lightbox: null });
  go(id, { kind: "cut", spawn });
}

// ─── frame update ───────────────────────────────────────────────

const tmp = new Vector3();
const tmp2 = new Vector3();

export function update(rawDt: number) {
  // physics uses a clamped step; the opening runs on real time so slow devices don't drag it out
  const dt = Math.min(rawDt, 0.05) * rt.timeScale;
  rawDt *= rt.timeScale;
  rt.time += dt;
  const s = getStory();
  if (s.phase === "intro") updateIntro(Math.min(rawDt, 0.5 * rt.timeScale));
  if (rt.transit) updateTransit(dt);
  else if (rt.active && s.phase === "explore") updateExplore(dt, Math.min(rawDt, 0.25 * rt.timeScale));
  updateAvatar(dt);
  if (rt.active && !rt.transit) updateAwareness();
  updateCamera();
}

function updateIntro(dt: number) {
  rt.intro.t += dt * rt.intro.speed;
  const dur = rt.intro.track?.duration ?? 0;
  if (rt.intro.t >= dur) {
    rt.intro.t = dur;
    useStory.setState({ phase: "explore", letterbox: false });
  }
}

function pendingHold(sc: ActiveScene) {
  return sc.beats.find((b) => b.hold && !rt.holdsDone.has(b.id));
}

function updateExplore(dt: number, realDt: number) {
  const sc = rt.active!;
  const s = getStory();
  const a = rt.avatar;
  const blocked = !!s.overlay || !!s.lightbox;
  let metres = blocked ? 0 : rt.input + rt.held * dt;
  if ((s.autoWalk || sc.story.auto) && !s.questionOpen && !s.hotspot && !blocked) metres += 1.25 * dt;
  rt.input = 0;

  if (s.hotspot && metres > 0.15 && s.hotspot.status === "open" && !s.lightbox && s.overlay !== "resume") closeHotspot();

  const hold = pendingHold(sc);
  if (a.mode === "path") {
    const maxU = hold ? hold.atU : 1;
    if (!rt.hold) a.targetU = clamp(a.targetU + metres / sc.length, 0, maxU);
    const atEnd = a.targetU >= 0.999 && a.u > 0.97;
    if (atEnd && metres > 0 && !hold) {
      a.overscroll += metres;
      if (sc.story.question && s.questionOpen && a.overscroll > 1.2) {
        useStory.setState({ nudge: performance.now() });
        a.overscroll = 0;
      } else if (!sc.story.question && sc.story.next && a.overscroll > 1.8) {
        a.overscroll = 0;
        go(sc.story.next, { kind: "walk" });
        return;
      }
    } else if (metres < 0) a.overscroll = 0;
  }

  // timed holds
  if (rt.hold) {
    const h = rt.hold;
    h.t += realDt * (1 + h.boost);
    h.boost = Math.max(0, h.boost - realDt * 2);
    const line = h.lines[h.index];
    if (h.t >= line.duration) {
      h.index++;
      h.t = 0;
      if (h.index >= h.lines.length) {
        rt.holdsDone.add(h.beatId);
        rt.hold = null;
        useStory.setState({ holdLine: null });
      } else showHoldLine(h.lines[h.index]);
    }
  } else if (hold && a.mode === "path" && Math.abs(a.u - hold.atU) < 0.006 && Math.abs(a.velocity) < 0.25) {
    rt.hold = { beatId: hold.id, index: 0, t: 0, lines: hold.hold!, boost: 0 };
    showHoldLine(hold.hold![0]);
  }

  // beats
  let active: (typeof sc.beats)[number] | null = null;
  for (const b of sc.beats) {
    if (a.u + 0.004 >= b.atU && a.u < b.untilU) active = b;
    if (!rt.fired.has(b.id) && a.u + 0.004 >= b.atU) {
      rt.fired.add(b.id);
      if (b.event) s.fire(b.event);
    }
  }
  const activeId = active && (active.lines.length || active.hold) ? active.id : null;
  if (activeId !== s.activeBeat) useStory.setState({ activeBeat: activeId });

  // question
  const end = a.u > 0.975 && a.mode === "path";
  const open = !!sc.story.question && end && !rt.hold && !hold && !s.hotspot;
  if (open !== s.questionOpen || end !== s.atEnd) useStory.setState({ questionOpen: open, atEnd: end });
  if (open && sc.anchors.center) a.faceYaw = yawOf(sc.anchors.center.x - a.pos.x, sc.anchors.center.z - a.pos.z);
  else if (!s.hotspot && a.mode === "path") a.faceYaw = null;
}

function showHoldLine(line: HoldLine) {
  useStory.setState({ holdLine: { ...line, key: performance.now() } });
  if (line.event) {
    getStory().fire(line.event);
    if (line.event === "reveal-choices") audio.reveal();
  }
}

function updateTransit(dt: number) {
  const t = rt.transit!;
  const a = rt.avatar;
  if (t.kind === "walk") {
    const ready = texturesLoaded(t.next.layout.textures) || t.waited > 8;
    const remain = t.length - t.s;
    let desired = Math.min(2.5, remain * 1.2 + 0.5);
    if (!t.swapped && !ready && t.s >= t.swapAt - 0.4) {
      desired = 0;
      t.waited += dt;
    }
    t.v = approach(t.v, desired, (desired > t.v ? 2.2 : 3.5) * dt);
    t.s = Math.min(t.length, t.s + t.v * dt);
    const u = t.s / t.length;
    t.curve.getPointAt(u, a.pos);
    t.curve.getTangentAt(u, a.forward);
    a.velocity = t.v;
    if (!t.swapped && t.s >= t.swapAt) {
      t.swapped = true;
      useStory.setState({ mounted: [{ key: rt.mountKey++, scene: t.next.id, anchor: t.next.anchor }] });
      enter(t.next, undefined, true);
      useStory.setState({ letterbox: true });
    }
    if (t.s >= t.length - 0.01) {
      const sc = rt.active!;
      a.mode = "path";
      a.u = nearestU(sc.curve, a.pos);
      a.targetU = Math.min(1, a.u + 2 / sc.length);
      a.velocity = t.v;
      rt.transit = null;
      useStory.setState({ corridor: null, transition: null, letterbox: !!sc.story.auto });
    }
    return;
  }

  if (t.kind === "dive") {
    t.t += dt;
    if (t.phase === "push" && t.t > 0.75) {
      t.phase = "expand";
      t.t = 0;
      const rect = projectRect(t.source);
      const proj = sceneById[t.to];
      const layout = getLayout(proj);
      useStory.setState({ dive: { phase: "expand", image: layout.textures[0] ?? "", rect } });
    } else if (t.phase === "expand" && t.t > 0.9 && !t.swapped) {
      if (!texturesLoaded(getLayout(sceneById[t.to]).textures) && t.t < 6) return;
      t.swapped = true;
      const sc = buildActive(t.to, originAnchor(t.to));
      mountOnly(sc);
      enter(sc, t.spawn && sc.hotspots[t.spawn] ? t.spawn : undefined);
      rt.camera.snap = true;
      t.phase = "reveal";
      t.t = 0;
      useStory.setState((st) => ({ dive: st.dive ? { ...st.dive, phase: "reveal" } : null }));
    } else if (t.phase === "reveal" && t.t > 1.1) {
      rt.transit = null;
      const sc = rt.active!;
      a.targetU = Math.min(1, a.u + 2.5 / sc.length);
      useStory.setState({ dive: null, transition: null, letterbox: !!sc.story.auto });
    }
    return;
  }

  // cut
  t.t += dt;
  if (!t.swapped && t.t > 0.55) {
    if (!texturesLoaded(getLayout(sceneById[t.to]).textures) && t.t < 6) return;
    t.swapped = true;
    const sc = buildActive(t.to, originAnchor(t.to));
    mountOnly(sc);
    enter(sc, t.spawn);
    rt.camera.snap = true;
    useStory.setState({ corridor: null });
    window.setTimeout(() => useStory.setState({ fade: 0 }), 60);
  }
  if (t.swapped && t.t > 1.2) {
    rt.transit = null;
    useStory.setState({ transition: null, letterbox: !!rt.active?.story.auto });
  }
}

let projector: ((p: Vector3) => { x: number; y: number } | null) | null = null;
/** The Stage registers a world→screen projector (used to size the screen-dive). */
export function setProjector(fn: typeof projector) {
  projector = fn;
}
function projectRect(world: Vector3) {
  const c = projector?.(world);
  const w = typeof window !== "undefined" ? window.innerWidth : 1280;
  const h = typeof window !== "undefined" ? window.innerHeight : 720;
  const cx = c?.x ?? w / 2;
  const cy = c?.y ?? h / 2;
  const rw = w * 0.28;
  const rh = rw * 0.5625;
  return { x: cx - rw / 2, y: cy - rh / 2, w: rw, h: rh };
}

function updateAvatar(dt: number) {
  const a = rt.avatar;
  const sc = rt.active;
  let desiredYaw = a.yaw;

  if (a.mode === "path" && sc) {
    const dist = (a.targetU - a.u) * sc.length;
    const vmax = Math.abs(dist) > 5 ? 2.1 : 1.45;
    const desired = clamp(dist * 1.9, -vmax, vmax);
    const accel = Math.abs(desired) > Math.abs(a.velocity) ? 2.6 : 4.5;
    a.velocity = approach(a.velocity, desired, accel * dt);
    if (Math.abs(a.velocity) < 0.002 && Math.abs(dist) < 0.002) a.velocity = 0;
    a.u = clamp(a.u + (a.velocity * dt) / sc.length, 0, 1);
    sc.curve.getPointAt(a.u, a.pos);
    sc.curve.getTangentAt(a.u, a.forward);
    if (Math.abs(a.velocity) > 0.06) {
      desiredYaw = a.velocity > 0 ? yawOf(a.forward.x, a.forward.z) : yawOf(-a.forward.x, -a.forward.z);
    } else if (a.faceYaw !== null) desiredYaw = a.faceYaw;
  } else if (a.mode === "free" && a.free) {
    tmp.copy(a.free.target).sub(a.pos).setY(0);
    const d = tmp.length();
    if (d < 0.05 || a.free.arrived) {
      a.velocity = approach(a.velocity, 0, 5 * dt);
      if (!a.free.arrived) {
        a.free.arrived = true;
        const cb = a.free.onArrive;
        a.free.onArrive = undefined;
        cb?.();
      }
      if (a.faceYaw !== null) desiredYaw = a.faceYaw;
    } else {
      const desired = Math.min(1.45, d * 2.2);
      a.velocity = approach(Math.abs(a.velocity), desired, 3 * dt);
      tmp.normalize();
      a.pos.addScaledVector(tmp, Math.min(d, a.velocity * dt));
      desiredYaw = yawOf(tmp.x, tmp.z);
    }
  } else if (a.mode === "transit") {
    desiredYaw = yawOf(a.forward.x, a.forward.z);
  }

  a.speed = Math.abs(a.velocity);
  const d = angleDelta(a.yaw, desiredYaw);
  a.yaw += clamp(d * 7 * dt, -4.2 * dt, 4.2 * dt);
}

function updateAwareness() {
  const sc = rt.active!;
  const s = getStory();
  const a = rt.avatar;
  const near: [string, number][] = [];
  let lookBest: Vector3 | null = null;
  let lookD = 4.2;
  for (const [id, h] of Object.entries(sc.hotspots)) {
    const d = Math.hypot(h.mark.x - a.pos.x, h.mark.z - a.pos.z);
    if (d < 3.4) near.push([id, d]);
    const od = Math.hypot(h.object.x - a.pos.x, h.object.z - a.pos.z);
    if (od < lookD) {
      const facing = angleDelta(a.yaw, yawOf(h.object.x - a.pos.x, h.object.z - a.pos.z));
      if (Math.abs(facing) < 1.6) {
        lookD = od;
        lookBest = h.object;
      }
    }
  }
  const ids = near.sort((x, y) => x[1] - y[1]).map((n) => n[0]);
  const key = ids.join("|");
  if (key !== rt.lastNearby) {
    rt.lastNearby = key;
    useStory.setState({ nearby: ids });
  }
  if (s.hotspot && sc.hotspots[s.hotspot.id]) a.look = sc.hotspots[s.hotspot.id].object;
  else if (rt.hold) {
    const beat = sc.beats.find((b) => b.id === rt.hold!.beatId);
    a.look = beat?.shot && sc.shots[beat.shot] ? sc.shots[beat.shot].target : lookBest;
  } else if (s.questionOpen && sc.anchors.center) a.look = sc.anchors.center;
  else a.look = lookBest;
}

// ─── camera direction ───────────────────────────────────────────

const pose = makePose();

function updateCamera() {
  const s = getStory();
  const a = rt.avatar;
  const cam = rt.camera;
  const sc = rt.active;
  const out = cam.desired;

  if ((s.phase === "intro" || s.phase === "ready") && rt.intro.track) {
    rt.intro.track.sample(rt.intro.t, out);
    // last stretch blends into the follow shot so the hand-off is seamless
    const dur = rt.intro.track.duration;
    const blend = clamp((rt.intro.t - (dur - 2.2)) / 2.2, 0, 1);
    if (sc && blend > 0) {
      sc.curve.getTangentAt(0, tmp2);
      followPose(a.pos, tmp2, sc.follow, pose, rt.mobile);
      out.pos.lerp(pose.pos, blend * blend);
      out.look.lerp(pose.look, blend * blend);
      out.fov += (pose.fov - out.fov) * blend;
    }
    cam.mode = "intro";
    return;
  }

  const t = rt.transit;
  if (t?.kind === "walk") {
    followPose(a.pos, a.forward, { ...DEFAULT_FOLLOW, distance: 5.4, height: 2.1, side: 0.4, lookAhead: 4 }, out, rt.mobile);
    cam.mode = "transit";
    return;
  }
  if (t?.kind === "dive" && !t.swapped && sc) {
    const h = Object.values(sc.hotspots).find((x) => x.object.distanceTo(t.source) < 0.01);
    if (h) {
      focusPose(h.mark, h.object, out, rt.mobile);
      const k = clamp(t.phase === "push" ? t.t / 0.75 : 1, 0, 1);
      out.pos.lerp(h.object, 0.55 * k * k);
      out.fov = out.fov - 6 * k;
      cam.mode = "dive";
      return;
    }
  }
  if (!sc) return;

  // hotspot focus
  if (s.hotspot && sc.hotspots[s.hotspot.id]) {
    const h = sc.hotspots[s.hotspot.id];
    if (h.shot) {
      out.pos.copy(h.shot.pos);
      out.look.copy(h.shot.target);
      out.fov = h.shot.fov ?? 36;
    } else focusPose(h.mark, h.object, out, rt.mobile);
    cam.mode = "focus";
    return;
  }

  // named shots: hold beat, active beat, question
  let shotName: string | undefined;
  if (rt.hold) shotName = sc.beats.find((b) => b.id === rt.hold!.beatId)?.shot;
  else if (s.questionOpen) shotName = "question";
  else if (s.activeBeat) shotName = sc.beats.find((b) => b.id === s.activeBeat)?.shot;
  const shot = shotName ? sc.shots[shotName] : undefined;
  if (shot) {
    out.pos.copy(shot.pos);
    out.look.copy(shot.target);
    out.fov = shot.fov ?? 38;
    if (rt.mobile) {
      tmp.copy(out.pos).sub(out.look);
      out.pos.copy(out.look).addScaledVector(tmp, 1.3);
    }
    cam.mode = "shot";
    return;
  }

  // follow: framing is aligned with the path direction, not the avatar's heading,
  // so turning round to walk back never swings the camera.
  sc.curve.getTangentAt(clamp(a.mode === "path" ? a.u : nearestUCached(sc), 0, 1), tmp2);
  followPose(a.pos, tmp2, sc.follow, out, rt.mobile);
  cam.mode = "follow";
}

let lastFreeU = 0;
let lastFreeAt = 0;
function nearestUCached(sc: ActiveScene) {
  if (rt.time - lastFreeAt > 0.25) {
    lastFreeU = nearestU(sc.curve, rt.avatar.pos, 80);
    lastFreeAt = rt.time;
  }
  return lastFreeU;
}

/** Debug / test hook. */
export const debugState = () => ({
  cam: rt.camera.pos.toArray().map((n) => +n.toFixed(2)),
  look: rt.camera.look.toArray().map((n) => +n.toFixed(2)),
  camMode: rt.camera.mode,
  introT: +rt.intro.t.toFixed(2),
  scene: rt.active?.id,
  u: rt.avatar.u,
  mode: rt.avatar.mode,
  transit: rt.transit?.kind ?? null,
  pos: rt.avatar.pos.toArray().map((n) => +n.toFixed(2)),
  phase: getStory().phase,
});

export type { Pose };
