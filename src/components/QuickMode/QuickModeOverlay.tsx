"use client";

import { useEffect, useRef } from "react";

import type { SceneId } from "@/data/story/types";
import { jump } from "@/systems/StoryEngine/engine";
import { useStory } from "@/systems/StoryEngine/store";

import { QuickMode } from "./QuickMode";

/** Quick Mode over the experience — opens instantly, keeps the journey where it was. */
export function QuickModeOverlay() {
  const open = useStory((s) => s.overlay === "quick");
  const webgl = useStory((s) => s.webgl);
  const phase = useStory((s) => s.phase);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) box.current?.focus();
  }, [open]);

  if (!open) return null;
  const canReturn = webgl;
  const close = () => useStory.setState({ overlay: null });
  const enter = (scene: string) => {
    close();
    // from the loader (journey not started yet) go via the deep link; otherwise cut to it
    if (phase === "ready" || phase === "boot") window.location.href = `?go=${scene}`;
    else jump(scene as SceneId);
  };
  return (
    <div
      ref={box}
      role="dialog"
      aria-modal="true"
      aria-label="Quick mode"
      tabIndex={-1}
      data-ui-scroll
      style={{ position: "fixed", inset: 0, zIndex: 75, overflowY: "auto", overscrollBehavior: "contain", outline: "none", WebkitOverflowScrolling: "touch" }}
    >
      {!webgl && (
        <p
          style={{
            background: "#141414",
            color: "#ece6da",
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            padding: "10px var(--gutter)",
            margin: 0,
          }}
        >
          This device can&apos;t run the 3D experience — here is everything in Quick Mode.
        </p>
      )}
      <QuickMode onClose={canReturn ? close : undefined} onEnter={canReturn ? enter : undefined} />
    </div>
  );
}
