"use client";

import { type ChapterId, chapterIndex, chapters, exploreLine, type Route, routeHash, type SectionId, type WorkId } from "@/data/story";
import { audio, type Cue } from "@/systems/AudioManager/audio";

import { MARKS, routeTo, setupFor } from "./choreography";
import { rt } from "./runtime";
import { getExperience, setExperience } from "./store";

/**
 * TOUR CONTROLLER
 * ------------------------------------------------------------------
 * One state machine for the whole film:
 *
 *   intro → who → job → aster → purple → live → shift
 *         → strategist → finance → combination → future → (end card)
 *
 * `tick(dt)` is the only clock. A chapter ends when its time is up and
 * PA-1 has finished speaking (never more than a few seconds late). Pause
 * freezes the clock; skip / back jump chapters; exit lands in Explore at
 * the matching section. Each chapter's look (camera, Satyam's mark, room
 * light, what the set is doing) is a pure function of the chapter and its
 * clock — see choreography.ts — so no timer can be left behind.
 */

const SPEED =
  typeof window !== "undefined" ? Math.min(12, Math.max(1, Number(new URLSearchParams(window.location.search).get("speed")) || 1)) : 1;

/** Small sounds on story moments (only heard with sound on). */
const CUES: Partial<Record<ChapterId, { at: number; cue: Cue }[]>> = {
  intro: [{ at: 0.3, cue: "start" }],
  aster: [{ at: 2.6, cue: "reveal" }],
  purple: [{ at: 1.4, cue: "reveal" }],
  shift: [{ at: 0, cue: "shift" }],
  combination: [{ at: 0.5, cue: "reveal" }],
  future: [{ at: 6.6, cue: "reveal" }],
};

let index = 0;
let robotDone = false;
let cuesDone = 0;
let line: null | { until: number; speaking: boolean } = null;
let lineKey = 0;
let saidExplore = false;

const now = () => performance.now() / 1000;
/** How long a line stays up without a voice: time to read it, comfortably. */
const readTime = (text: string) => 1.6 + text.split(/\s+/).length * 0.3;

// ── stage direction (shared by the tour and Explore) ──────────────

/** Points the camera, Satyam and the light at the current state. `jump`: he's placed rather than walked. */
export function direct(opts: { jump?: boolean; blend?: number } = {}) {
  const s = getExperience();
  const setup = setupFor(s);
  const blend = s.reducedMotion ? 0 : (opts.blend ?? 2.4);
  rt.shot = { id: setup.shot, since: performance.now(), blend, hold: 0 };

  const target = MARKS[setup.mark];
  const a = rt.avatar;
  const far = a.pos.distanceTo(target.pos) > 6.5;
  if (opts.jump || s.reducedMotion || (s.mode === "explore" && far)) {
    // placed out of sight while the camera travels
    const place = () => {
      a.pos.copy(target.pos);
      a.yaw = target.face;
      a.face = target.face;
      a.goal = null;
      a.speed = 0;
      rt.robot.snap = true;
    };
    if (blend === 0) place();
    else window.setTimeout(place, blend * 450);
    a.goal = null;
  } else {
    a.goal = { points: routeTo(a.pos, setup.mark), faceYaw: target.face, speed: setup.pace };
  }
  audio.setRoom(setup.strategist > setup.producer ? "strategist" : s.mode === "landing" ? "landing" : "producer");
}

// ── PA-1 ──────────────────────────────────────────────────────────

function say(text: string) {
  lineKey++;
  const key = lineKey;
  setExperience({ robotLine: { key, text } });
  rt.robot.speaking = true;
  const voiced = getExperience().sound;
  line = { until: now() + readTime(text) / SPEED, speaking: voiced };
  if (voiced) {
    audio.speak(text, () => {
      if (key !== lineKey || !line) return;
      line.speaking = false;
      line.until = Math.min(line.until, now() + 0.8);
    });
  }
}

export function clearLine() {
  lineKey++;
  line = null;
  rt.robot.speaking = false;
  audio.stopVoice();
  if (getExperience().robotLine) setExperience({ robotLine: null });
}

/** Ages the line on screen; called every frame in any mode. */
function updateLine() {
  if (!line) return;
  if (!line.speaking && now() >= line.until) clearLine();
}

// ── chapters ──────────────────────────────────────────────────────

function enter(i: number, opts: { jump: boolean }) {
  index = Math.max(0, Math.min(chapters.length - 1, i));
  const ch = chapters[index];
  rt.chapterT = 0;
  robotDone = false;
  cuesDone = 0;
  clearLine();
  setExperience({ chapter: ch.id, caption: -1, ended: false });
  direct({ jump: opts.jump, blend: opts.jump ? 1.4 : ch.id === "shift" ? 1.2 : 2.6 });
}

function finish() {
  clearLine();
  setExperience({ ended: true, caption: -1, paused: false });
  direct({ blend: 3 });
  audio.cue("end");
  audio.setPaused(false);
}

function setHash(r: Route | null) {
  if (typeof window === "undefined") return;
  const url = r ? `#${routeHash(r)}` : window.location.pathname + window.location.search;
  window.history.replaceState(null, "", url);
}

export const tour = {
  start(from = 0) {
    setExperience({ mode: "tour", paused: false, ended: false, overlay: null, lightbox: null });
    setHash({ mode: "tour" });
    enter(from, { jump: getExperience().mode !== "tour" && from > 0 });
    audio.setPaused(false);
  },

  pause() {
    const s = getExperience();
    if (s.mode !== "tour" || s.ended || s.paused) return;
    setExperience({ paused: true });
    audio.stopVoice();
    if (line) line.speaking = false;
    audio.setPaused(true);
  },

  resume() {
    const s = getExperience();
    if (s.mode !== "tour" || !s.paused) return;
    setExperience({ paused: false });
    // a line interrupted by the pause stays on screen long enough to finish reading
    if (line) line.until = Math.max(line.until, now() + 2.5);
    audio.setPaused(false);
  },

  togglePause() {
    if (getExperience().paused) tour.resume();
    else tour.pause();
  },

  next() {
    const s = getExperience();
    if (s.mode !== "tour" || s.ended) return;
    if (index >= chapters.length - 1) finish();
    else enter(index + 1, { jump: true });
    if (s.paused) setExperience({ paused: false });
    audio.setPaused(false);
  },

  prev() {
    const s = getExperience();
    if (s.mode !== "tour") return;
    if (s.ended) enter(chapters.length - 1, { jump: true });
    else enter(index - (rt.chapterT < 2 ? 1 : 0), { jump: true });
    if (s.paused) setExperience({ paused: false });
    audio.setPaused(false);
  },

  /** Jump to a chapter (progress bar). */
  goTo(id: ChapterId) {
    if (getExperience().mode !== "tour") return;
    enter(chapterIndex[id], { jump: true });
    setExperience({ paused: false });
    audio.setPaused(false);
  },

  /** Leave the tour for Explore, at the section this chapter is about. */
  exit() {
    const s = getExperience();
    const ch = chapters[index];
    const target = s.ended ? { section: "contact" as SectionId } : ch.exit;
    goExplore(target.section, target.work);
  },

  replay() {
    tour.start(0);
  },

  skipLine: clearLine,

  get index() {
    return index;
  },

  tick(realDt: number) {
    const dt = Math.min(realDt, SPEED > 1 ? 0.5 : 0.1) * SPEED;
    rt.time += dt;
    updateLine();
    const s = getExperience();
    if (s.mode !== "tour" || s.ended || s.paused || s.overlay) return;
    const ch = chapters[index];
    rt.chapterT += dt;
    const t = rt.chapterT;

    let cap = -1;
    ch.captions.forEach((c, k) => {
      if (t >= c.at) cap = k;
    });
    if (cap !== s.caption) setExperience({ caption: cap });

    const cues = CUES[ch.id] ?? [];
    while (cuesDone < cues.length && t >= cues[cuesDone].at) audio.cue(cues[cuesDone++].cue);

    if (ch.robot && !robotDone && t >= ch.robot.at) {
      robotDone = true;
      say(ch.robot.text);
    }

    if (t >= ch.duration) {
      const waiting = !!line && (line.speaking || now() < line.until - 0.6) && t < ch.duration + 4;
      if (!waiting) {
        if (index >= chapters.length - 1) finish();
        else enter(index + 1, { jump: false });
      }
    }
  },
};

// ── explore & landing ─────────────────────────────────────────────

export function goExplore(section: SectionId, work?: WorkId, opts: { quiet?: boolean } = {}) {
  const s = getExperience();
  const fromTour = s.mode !== "explore";
  clearLine();
  setExperience({
    mode: "explore",
    section,
    work: work ?? (section === "work" ? s.work : s.work),
    paused: false,
    ended: false,
    caption: -1,
  });
  setHash({ mode: "explore", section, work: section === "work" ? (work ?? getExperience().work) : undefined });
  direct({ blend: fromTour ? 2 : 1.8 });
  audio.setPaused(false);
  if (fromTour && !saidExplore && !opts.quiet) {
    saidExplore = true;
    window.setTimeout(() => {
      if (getExperience().mode === "explore") say(exploreLine);
    }, 1400);
  }
}

export function goLanding() {
  clearLine();
  setExperience({ mode: "landing", paused: false, ended: false, caption: -1, overlay: null, lightbox: null });
  setHash(null);
  direct({ blend: 2 });
}

/** Re-applies the current set-up (after a resize or the stage first appearing). */
export function redirect() {
  direct({ jump: true, blend: 0 });
}
