"use client";

import { type ComponentType, useEffect, useState } from "react";

import { Cursor } from "@/components/Cursor/Cursor";
import { ControlBar } from "@/components/Navigation/ControlBar";
import { Menu } from "@/components/Navigation/Menu";
import { A11yLayer } from "@/components/Overlay/A11yLayer";
import { BeatLayer } from "@/components/Overlay/BeatLayer";
import { ChapterCard } from "@/components/Overlay/ChapterCard";
import { ContactCard } from "@/components/Overlay/ContactCard";
import { Dossier } from "@/components/Overlay/Dossier";
import { Fader, Grain, Letterbox } from "@/components/Overlay/Frame";
import { Lightbox } from "@/components/Overlay/Lightbox";
import { Loader } from "@/components/Overlay/Loader";
import { ScreenDive } from "@/components/Overlay/ScreenDive";
import { QuickModeOverlay } from "@/components/QuickMode/QuickModeOverlay";
import { ResumeOverlay } from "@/components/Resume/ResumeOverlay";
import { QuestionOverlay } from "@/components/StoryChoice/QuestionOverlay";
import { useJourneyInput } from "@/systems/Input/useJourneyInput";
import { detectTier, hasWebGL } from "@/systems/Quality/quality";
import { rt } from "@/systems/SceneManager/director";
import * as engine from "@/systems/StoryEngine/engine";
import { debugState, prepare, setReducedMotion } from "@/systems/StoryEngine/engine";
import { startPersistence } from "@/systems/StoryEngine/persistence";
import { useStory } from "@/systems/StoryEngine/store";

import { StageBoundary } from "./StageBoundary";

/**
 * THE EXPERIENCE — the client root of the interactive film. Decides whether
 * WebGL can run (falling back to Quick Mode if not), loads the 3D stage in its
 * own chunk, and layers the interface over it.
 */
export function ExperienceRoot() {
  const [Stage, setStage] = useState<ComponentType<{ onReady?: () => void }> | null>(null);
  const [stageReady, setStageReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const phase = useStory((s) => s.phase);
  const webgl = useStory((s) => s.webgl);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("experience");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = hasWebGL();
    useStory.setState({ tier: detectTier(), webgl: gl, overlay: gl ? null : "quick" });
    setReducedMotion(reduced);
    startPersistence();

    if (gl) {
      import("./Stage")
        .then((m) => setStage(() => m.default))
        .catch(() => useStory.setState({ webgl: false, overlay: "quick" }));
    }
    const fonts = document.fonts
      ? Promise.all([
          document.fonts.load('400 64px "Instrument Serif"'),
          document.fonts.load('500 32px "JetBrains Mono Variable"'),
          document.fonts.load('500 32px "Archivo Variable"'),
        ]).catch(() => undefined)
      : Promise.resolve();
    const timeout = new Promise((r) => setTimeout(r, 4000));
    Promise.race([fonts, timeout]).then(() => setFontsReady(true));

    // test / debug hook
    (window as unknown as { __sb?: unknown }).__sb = { store: useStory, state: debugState, engine, rt };
    return () => html.classList.remove("experience");
  }, []);

  // compile the studio behind the loader once everything it draws with is ready
  useEffect(() => {
    if (stageReady && fontsReady) prepare();
  }, [stageReady, fontsReady]);

  useJourneyInput(phase === "intro" || phase === "explore");

  return (
    <>
      <div className="stage" id="stage">
        {Stage && webgl && fontsReady && (
          <StageBoundary>
            <Stage onReady={() => setStageReady(true)} />
          </StageBoundary>
        )}
      </div>
      <Grain />
      <Letterbox />
      <BeatLayer />
      <ChapterCard />
      <QuestionOverlay />
      <A11yLayer />
      <ControlBar />
      <Dossier />
      <ScreenDive />
      <Fader />
      <ContactCard />
      <Lightbox />
      <QuickModeOverlay />
      <ResumeOverlay />
      <Menu />
      <Loader ready={(stageReady && fontsReady) || !webgl} />
      <Cursor />
    </>
  );
}
