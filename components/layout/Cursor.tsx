"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

import styles from "./Cursor.module.css";
import { usePageTransition } from "./TransitionProvider";

type State = { kind: "default" | "link" | "view" | "drag" | "hidden"; label?: string };

/**
 * Desktop-only cursor. Elements opt in with:
 *   data-cursor="view" data-cursor-label="View"   → large label disc
 *   data-cursor="link"                               → small ring
 */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState<State>({ kind: "default" });
  const [visible, setVisible] = useState(false);
  const { phase } = usePageTransition();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 260, damping: 32, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 260, damping: 32, mass: 0.6 });

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("has-cursor");
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor], a, button");
      if (!t) return setState({ kind: "default" });
      const kind = (t.dataset.cursor as State["kind"]) || "link";
      setState({ kind, label: t.dataset.cursorLabel });
    };
    const leave = () => setVisible(false);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.removeEventListener("pointerleave", leave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const transitioning = phase !== "idle";
  const big = !transitioning && (state.kind === "view" || state.kind === "drag");
  const show = visible && !transitioning;
  return (
    <>
      <motion.div
        className={styles.dot}
        style={{ x, y }}
        animate={{ scale: big || state.kind === "hidden" ? 0 : 1, opacity: show ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        aria-hidden
      />
      <motion.div
        className={styles.ring}
        data-big={big || undefined}
        style={{ x: sx, y: sy }}
        animate={{
          width: big ? 112 : state.kind === "link" ? 44 : 0,
          height: big ? 112 : state.kind === "link" ? 44 : 0,
          opacity: show && state.kind !== "default" && state.kind !== "hidden" ? 1 : 0,
          backgroundColor: big ? "rgba(236,230,218,1)" : "rgba(236,230,218,0)",
        }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        aria-hidden
      >
        <motion.span
          className={styles.label}
          animate={{ opacity: big ? 1 : 0, scale: big ? 1 : 0.6 }}
          transition={{ duration: 0.4, delay: big ? 0.1 : 0 }}
        >
          {state.label ?? (state.kind === "drag" ? "Drag" : "View")}
        </motion.span>
      </motion.div>
    </>
  );
}
