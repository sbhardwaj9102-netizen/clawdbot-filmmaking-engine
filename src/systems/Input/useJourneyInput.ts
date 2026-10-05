"use client";

import { useEffect } from "react";

import { back, closeHotspot, rt, setHeldWalk, walk } from "@/systems/SceneManager/director";
import { getStory, useStory } from "@/systems/StoryEngine/store";

/**
 * INPUT — scroll is not a page scroll here; it is the walk.
 *   wheel / trackpad     → walk forward / back
 *   touch swipe          → walk (with a little inertia)
 *   ↓ ↑ / PgDn / Space   → walk; held keys keep walking
 *   Backspace            → back to the previous scene
 *   Esc                  → close what is open
 * UI elements marked [data-ui-scroll] keep their own native scrolling.
 */
const PX_PER_METRE = 95;

function uiOwns(target: EventTarget | null) {
  return target instanceof Element && !!target.closest("[data-ui-scroll], [role=dialog]");
}

export function useJourneyInput(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const onWheel = (e: WheelEvent) => {
      const s = getStory();
      if (s.overlay || s.lightbox || s.contactOpen || uiOwns(e.target)) return;
      e.preventDefault();
      const scale = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerHeight : 1;
      const dy = (Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * scale;
      walk(Math.max(-3, Math.min(3, dy / PX_PER_METRE)));
    };

    let lastY = 0;
    let lastT = 0;
    let vel = 0;
    let touching = false;
    let raf = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (uiOwns(e.target)) return;
      touching = true;
      lastY = e.touches[0].clientY;
      lastT = performance.now();
      vel = 0;
      cancelAnimationFrame(raf);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touching) return;
      const s = getStory();
      if (s.overlay || s.lightbox || s.contactOpen) return;
      const y = e.touches[0].clientY;
      const now = performance.now();
      const dy = lastY - y;
      lastY = y;
      const metres = (dy / PX_PER_METRE) * 1.35;
      vel = metres / Math.max(1, now - lastT);
      lastT = now;
      if (e.cancelable) e.preventDefault();
      walk(metres);
    };
    const onTouchEnd = () => {
      if (!touching) return;
      touching = false;
      // inertia
      let v = vel * 16;
      const step = () => {
        v *= 0.92;
        if (Math.abs(v) < 0.01) return;
        walk(v);
        raf = requestAnimationFrame(step);
      };
      if (Math.abs(v) > 0.05) raf = requestAnimationFrame(step);
    };

    const held = new Set<string>();
    const updateHeld = () => {
      const f = held.has("f") ? 1.4 : 0;
      const b = held.has("b") ? 1.4 : 0;
      setHeldWalk(f - b);
    };
    const onKey = (e: KeyboardEvent) => {
      const s = getStory();
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.key === "Escape") {
        if (s.lightbox) useStory.setState({ lightbox: null });
        else if (s.overlay) {
          useStory.setState({ overlay: null });
          if (s.hotspot?.id === "about-resume") closeHotspot();
        } else if (s.contactOpen && s.currentScene !== "final") useStory.setState({ contactOpen: false });
        else if (s.hotspot) closeHotspot();
        return;
      }
      if (s.overlay || s.lightbox || s.contactOpen) return;
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S" || e.key === "PageDown" || (e.key === " " && !el?.closest("button, a"))) {
        e.preventDefault();
        if (e.key === "PageDown" || e.key === " ") walk(3);
        else if (!e.repeat) {
          walk(0.8);
          held.add("f");
          updateHeld();
        }
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === "PageUp") {
        e.preventDefault();
        if (e.key === "PageUp") walk(-3);
        else if (!e.repeat) {
          walk(-0.8);
          held.add("b");
          updateHeld();
        }
      } else if (e.key === "Backspace") {
        e.preventDefault();
        back();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (["ArrowDown", "s", "S"].includes(e.key)) held.delete("f");
      if (["ArrowUp", "w", "W"].includes(e.key)) held.delete("b");
      updateHeld();
    };
    const onBlur = () => {
      held.clear();
      updateHeld();
    };
    const onPointer = (e: PointerEvent) => {
      rt.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      rt.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [enabled]);
}
