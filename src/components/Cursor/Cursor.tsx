"use client";

import { useEffect, useRef } from "react";

import { hotspots } from "@/data/story/hotspots";
import { useStory } from "@/systems/StoryEngine/store";

import styles from "./Cursor.module.css";

/**
 * Custom cursor for the world (fine pointers only). A small ring with a word:
 * EXPLORE over the space; VIEW · ENTER · OPEN · WATCH · READ over objects;
 * CHOOSE over a choice. Over interface it steps aside for the system cursor.
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const hovered = useStory((s) => s.hovered);
  const phase = useStory((s) => s.phase);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.documentElement.classList.add("has-cursor");
    let x = innerWidth / 2;
    let y = innerHeight / 2;
    let cx = x;
    let cy = y;
    let raf = 0;
    let overStage = false;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const el = e.target as Element | null;
      overStage = !!el?.closest?.("#stage");
    };
    const loop = () => {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      const r = ring.current;
      if (r) {
        r.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
        const s = useStory.getState();
        const ui = !!s.overlay || !!s.lightbox || s.contactOpen || s.phase === "ready" || s.phase === "boot";
        r.dataset.visible = overStage && !ui ? "1" : "0";
      }
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  let word = phase === "intro" ? "SKIP" : phase === "explore" ? "EXPLORE" : "";
  let hot = false;
  if (hovered?.startsWith("choice:")) {
    word = "CHOOSE";
    hot = true;
  } else if (hovered && hotspots[hovered]) {
    word = hotspots[hovered].verb;
    hot = true;
  }

  return (
    <div ref={ring} className={`${styles.cursor} ${hot ? styles.hot : ""}`} aria-hidden>
      <span className={styles.ring} />
      <span ref={label} className={styles.label}>
        {word}
      </span>
    </div>
  );
}
