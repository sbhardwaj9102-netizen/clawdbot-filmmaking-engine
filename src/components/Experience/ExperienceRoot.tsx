"use client";

import { type ComponentType, useEffect, useState } from "react";

import { Backdrop2D } from "@/components/Fallback/Backdrop2D";
import { Landing } from "@/components/Landing/Landing";
import { TopBar } from "@/components/Navigation/TopBar";
import { ContactOverlay, Lightbox, QuickViewOverlay, ResumeOverlay } from "@/components/Overlays/Overlays";
import { ExplorePanel } from "@/components/Explore/ExplorePanel";
import { RobotDialogue } from "@/components/Robot/RobotDialogue";
import { EndCard } from "@/components/Tour/EndCard";
import { TourCaptions } from "@/components/Tour/TourCaptions";
import { TourControls } from "@/components/Tour/TourControls";
import { chapterIndex, chapters, parseRoute } from "@/data/story";
import { audio } from "@/systems/AudioManager/audio";
import { readPreferences } from "@/systems/Experience/preferences";
import { rt } from "@/systems/Experience/runtime";
import { getExperience, setExperience, useExperience } from "@/systems/Experience/store";
import { goExplore, goLanding, redirect, tour } from "@/systems/Experience/tour";
import { detectTier, hasWebGL } from "@/systems/Quality/quality";

import { StageBoundary } from "./StageBoundary";

/**
 * The page: the 3D stage (or still images without WebGL) under the story's
 * interface. Owns the one clock that drives the tour, the keyboard, deep
 * links and the screen-reader narration.
 */
export function ExperienceRoot() {
  const [Stage, setStage] = useState<ComponentType<{ onReady?: () => void }> | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const webgl = useExperience((s) => s.webgl);

  // boot: preferences, quality, WebGL, fonts (canvas lettering needs them)
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("experience");
    readPreferences();
    const gl = hasWebGL();
    setExperience({ tier: detectTier(), webgl: gl });
    if (gl) {
      import("./Stage")
        .then((m) => setStage(() => m.default))
        .catch(() => setExperience({ webgl: false }));
    }
    const fonts = document.fonts
      ? Promise.all([
          document.fonts.load('400 64px "Instrument Serif"'),
          document.fonts.load('500 32px "JetBrains Mono Variable"'),
          document.fonts.load('500 32px "Archivo Variable"'),
        ]).catch(() => undefined)
      : Promise.resolve();
    Promise.race([fonts, new Promise((r) => setTimeout(r, 4000))]).then(() => setFontsReady(true));

    // deep links: /#tour, /#about, /#work-purple … (and ?go= from the previous site)
    const applyRoute = (token: string) => {
      const r = parseRoute(token);
      if (!r) return false;
      if (r.mode === "tour") tour.start(0);
      else goExplore(r.section, r.work, { quiet: true });
      return true;
    };
    const legacy = new URLSearchParams(window.location.search).get("go");
    if (!applyRoute(window.location.hash) && legacy) applyRoute(legacy);
    else if (!window.location.hash) redirect();
    const onHash = () => {
      if (!window.location.hash) {
        if (getExperience().mode !== "landing") goLanding();
        return;
      }
      applyRoute(window.location.hash);
    };
    window.addEventListener("hashchange", onHash);

    // test / debug hook
    (window as unknown as { __sb?: unknown }).__sb = {
      store: useExperience,
      tour,
      rt,
      explore: goExplore,
      landing: goLanding,
      state: () => ({ ...getExperience(), chapterT: +rt.chapterT.toFixed(2), avatar: rt.avatar.pos.toArray().map((n) => +n.toFixed(2)), shot: rt.shot.id }),
    };
    return () => {
      html.classList.remove("experience");
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  // the clock
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      tour.tick((now - last) / 1000);
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = getExperience();
      if (s.overlay || s.lightbox) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select")) return;
      if (s.mode !== "tour") return;
      const onControl = !!el?.closest("button, a");
      if (e.key === " " && !onControl) {
        e.preventDefault();
        tour.togglePause();
      } else if (e.key === "ArrowRight") {
        tour.next();
      } else if (e.key === "ArrowLeft") {
        tour.prev();
      } else if (e.key === "Escape") {
        tour.exit();
      }
    };
    window.addEventListener("keydown", onKey);
    const onPointer = (e: PointerEvent) => {
      rt.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      rt.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  // a document opened over the tour holds it; PA-1 stops mid-sentence rather than talk over it
  useEffect(
    () =>
      useExperience.subscribe(
        (s) => !!s.overlay || !!s.lightbox,
        (covered) => {
          if (covered) audio.stopVoice();
          audio.setPaused(covered || getExperience().paused);
        },
      ),
    [],
  );

  // pointer cursor over things you can click in the set
  const hovered = useExperience((s) => s.hovered);
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
  }, [hovered]);

  return (
    <>
      <div className="stage" id="stage">
        {Stage && webgl && fontsReady && (
          <StageBoundary>
            <Stage onReady={() => setExperience({ stageReady: true })} />
          </StageBoundary>
        )}
      </div>
      <Backdrop2D />
      <div className="grain" aria-hidden />
      {/* reading / tab order: the bar, then the story, then its controls */}
      <TopBar />
      <Landing />
      <TourCaptions />
      <EndCard />
      <ExplorePanel />
      <RobotDialogue />
      <TourControls />
      <Announcer />
      <QuickViewOverlay />
      <ResumeOverlay />
      <ContactOverlay />
      <Lightbox />
    </>
  );
}

/** Screen readers hear the story as it plays: each caption, and what PA-1 says. */
function Announcer() {
  const mode = useExperience((s) => s.mode);
  const chapter = useExperience((s) => s.chapter);
  const caption = useExperience((s) => s.caption);
  const line = useExperience((s) => s.robotLine);
  const ended = useExperience((s) => s.ended);
  const c = mode === "tour" && caption >= 0 ? chapters[chapterIndex[chapter]].captions[caption] : null;
  const text = ended
    ? "The end. View work, download the resume, or contact Satyam."
    : c
      ? [c.kicker, c.title, ...(c.stats?.map((s) => `${s.value} ${s.label}`) ?? []), ...(c.chain?.words ?? []), ...(c.lines ?? [])].filter(Boolean).join(". ")
      : "";
  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {text}
      </div>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {line ? `PA-1: ${line.text}` : ""}
      </div>
    </>
  );
}
