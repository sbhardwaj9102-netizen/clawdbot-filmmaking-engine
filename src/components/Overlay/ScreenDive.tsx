"use client";

import { useEffect, useState } from "react";

import { tex } from "@/lib/assets";
import { useStory } from "@/systems/StoryEngine/store";

/**
 * Entering a film through its monitor: the picture on the screen grows from
 * the monitor's rectangle to fill the frame, then dissolves into the film's world.
 */
export function ScreenDive() {
  const dive = useStory((s) => s.dive);
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (dive?.phase === "expand") {
      setFull(false);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setFull(true)));
      return () => cancelAnimationFrame(r);
    }
  }, [dive?.phase]);

  if (!dive) return null;
  const rect = full ? { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight } : dive.rect;
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        zIndex: 49,
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        backgroundImage: dive.image ? `url(${tex(dive.image)})` : undefined,
        backgroundColor: "#000",
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: dive.phase === "reveal" ? 0 : 1,
        filter: dive.phase === "reveal" ? "blur(8px) brightness(1.4)" : "none",
        transition: "left .85s cubic-bezier(.76,0,.24,1), top .85s cubic-bezier(.76,0,.24,1), width .85s cubic-bezier(.76,0,.24,1), height .85s cubic-bezier(.76,0,.24,1), opacity 1s ease, filter 1s ease",
        pointerEvents: "none",
      }}
    />
  );
}
