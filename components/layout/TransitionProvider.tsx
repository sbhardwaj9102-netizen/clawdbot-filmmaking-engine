"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { EASE } from "@/lib/motion";
import { scrollToTarget, useLenis } from "@/lib/smooth-scroll";
import styles from "./TransitionProvider.module.css";

type Mode = "project" | "curtain";
type Phase = "idle" | "cover" | "hold" | "reveal";

export type NavRequest = {
  href: string;
  mode?: Mode;
  /** project mode: where the card image currently sits on screen */
  rect?: DOMRect;
  image?: string;
  /** project mode: current scale of the card image (hover zoom) */
  fromScale?: number;
  /** curtain mode: word shown while the page changes */
  label?: string;
};

type Ctx = { navigate: (req: NavRequest) => void; phase: Phase; ready: boolean };

const TransitionContext = createContext<Ctx>({ navigate: () => {}, phase: "idle", ready: true });

export const usePageTransition = () => useContext(TransitionContext);

const clean = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p) || "/";

/**
 * Full-screen page transitions.
 *  - "project": the clicked card's image expands to fill the screen, the route
 *    changes underneath, and the case-study hero (same image) is revealed.
 *  - "curtain": a black panel wipes up, the route changes, the panel wipes away.
 */
export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();
  const [req, setReq] = useState<(NavRequest & { path: string; hash?: string }) | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const busy = useRef(false);

  const navigate = useCallback(
    (r: NavRequest) => {
      if (busy.current) return;
      const [rawPath, hash] = r.href.split("#");
      const path = clean(rawPath || "/");
      if (path === clean(pathname)) {
        // same page: just glide to the section
        scrollToTarget(lenis, hash ? `#${hash}` : 0);
        return;
      }
      busy.current = true;
      lenis?.stop();
      setReq({ mode: "curtain", ...r, path, hash });
      setPhase("cover");
    },
    [lenis, pathname],
  );

  const onCovered = useCallback(() => {
    if (!req) return;
    setPhase("hold");
    router.push(req.path === "/" ? "/" : `${req.path}/`, { scroll: false });
  }, [req, router]);

  // When the new route is mounted, reset scroll and reveal it.
  useEffect(() => {
    if (phase !== "hold" || !req || clean(pathname) !== req.path) return;
    window.scrollTo(0, 0);
    lenis?.scrollTo(0, { immediate: true, force: true });
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (req.hash) {
          const el = document.getElementById(req.hash);
          if (el) {
            if (lenis) lenis.scrollTo(el, { immediate: true, force: true });
            else el.scrollIntoView();
          }
        }
        setPhase("reveal");
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [pathname, phase, req, lenis]);

  const onRevealed = useCallback(() => {
    setPhase("idle");
    setReq(null);
    busy.current = false;
    lenis?.start();
  }, [lenis]);

  const value: Ctx = { navigate, phase, ready: phase === "idle" || phase === "reveal" };

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {req && req.mode === "project" && req.rect && req.image && (
          <motion.div
            key="project"
            className={styles.project}
            initial={{
              top: req.rect.top,
              left: req.rect.left,
              width: req.rect.width,
              height: req.rect.height,
              opacity: 1,
            }}
            animate={
              phase === "reveal"
                ? { top: 0, left: 0, width: "100vw", height: "100vh", opacity: 0, transition: { duration: 0.9, ease: EASE, delay: 0.1 } }
                : { top: 0, left: 0, width: "100vw", height: "100vh", opacity: 1, transition: { duration: 1.1, ease: EASE } }
            }
            onAnimationComplete={() => {
              if (phase === "cover") onCovered();
              else if (phase === "reveal") onRevealed();
            }}
          >
            <motion.img
              src={req.image}
              alt=""
              className={styles.projectImg}
              initial={{ scale: req.fromScale ?? 1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.1, ease: EASE }}
            />
            <motion.div
              className={styles.projectShade}
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === "cover" ? 0.25 : 0 }}
              transition={{ duration: 1.1, ease: EASE }}
            />
          </motion.div>
        )}
        {req && req.mode === "curtain" && (
          <motion.div
            key="curtain"
            className={styles.curtain}
            initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
            animate={
              phase === "reveal"
                ? { clipPath: "inset(0% 0% 100% 0%)", transition: { duration: 1.0, ease: EASE, delay: 0.15 } }
                : { clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 0.95, ease: EASE } }
            }
            onAnimationComplete={() => {
              if (phase === "cover") onCovered();
              else if (phase === "reveal") onRevealed();
            }}
          >
            {req.label && (
              <motion.span
                className={styles.curtainLabel}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: phase === "reveal" ? 0 : 1, y: phase === "reveal" ? -30 : 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: phase === "reveal" ? 0 : 0.35 }}
              >
                {req.label}
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </TransitionContext.Provider>
  );
}
