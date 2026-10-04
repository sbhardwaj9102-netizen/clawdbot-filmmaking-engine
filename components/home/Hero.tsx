"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { usePageTransition } from "@/components/layout/TransitionProvider";
import { MaskText } from "@/components/motion/MaskText";
import { Timecode } from "@/components/ui/Timecode";
import { site } from "@/data/site";
import { EASE, EASE_OUT } from "@/lib/motion";
import styles from "./Hero.module.css";

/**
 * Opening shot. Pinned for one screen of scroll: the plate pushes in and
 * darkens while the type lifts away, and Selected Work slides over the top.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { ready } = usePageTransition();
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => setPlay(true), 120);
    return () => window.clearTimeout(t);
  }, [ready]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1, 1.16]);
  const shade = useTransform(scrollYProgress, [0, 0.9], [0, 0.8]);
  const frame = useTransform(scrollYProgress, [0, 1], ["inset(0% 0% 0% 0%)", "inset(5% 3% 9% 3%)"]);
  const lift = useTransform(scrollYProgress, [0, 1], ["0vh", "-18vh"]);
  const fade = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const stripFade = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  return (
    <section ref={ref} id="top" className={styles.hero} aria-label="Introduction">
      <div className={styles.sticky}>
        <motion.div className={styles.frame} style={{ clipPath: frame }}>
          <motion.div
            className={styles.intro}
            initial={{ opacity: 0, scale: 1.14 }}
            animate={play ? { opacity: 1, scale: 1 } : undefined}
            transition={{ opacity: { duration: 2.2, ease: EASE_OUT }, scale: { duration: 3.6, ease: EASE_OUT } }}
          >
            <motion.div className={styles.media} style={{ scale: mediaScale }}>
              <video
                className={styles.video}
                src={site.hero.video}
                poster={site.hero.poster}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-label={site.hero.alt}
              />
            </motion.div>
          </motion.div>
          <div className={styles.grade} />
          <motion.div className={styles.shade} style={{ opacity: shade }} />
        </motion.div>

        <motion.div className={styles.recWrap} style={{ opacity: fade }}>
          <motion.div
            className={`${styles.rec} label`}
            initial={{ opacity: 0 }}
            animate={play ? { opacity: 1 } : undefined}
            transition={{ duration: 1, delay: 1.9 }}
          >
            <span className={styles.recDot} />
            <span>REC</span>
            <Timecode className={styles.tc} />
          </motion.div>
        </motion.div>

        <motion.div className={styles.content} style={{ y: lift, opacity: fade }}>


          <h1 className={styles.name}>
            <span className="sr-only">
              {site.name.first} {site.name.last} — {site.roles.join(" and ")}
            </span>
            <MaskText
              as="span"
              lines={[site.name.first, site.name.last]}
              chars
              play={play}
              delay={0.25}
              duration={1.5}
              className={`${styles.nameLines} display`}
            />
          </h1>

          <div className={styles.under}>
            <div className={styles.roles}>
              {site.roles.map((r, i) => (
                <span key={r} className={styles.roleMask}>
                  <motion.span
                    className={styles.role}
                    initial={{ y: "110%" }}
                    animate={play ? { y: "0%" } : undefined}
                    transition={{ duration: 1.2, ease: EASE_OUT, delay: 1.05 + i * 0.12 }}
                  >
                    {r}
                  </motion.span>
                </span>
              ))}
            </div>
            <motion.p
              className={`${styles.tagline} serif`}
              initial={{ opacity: 0, y: 18 }}
              animate={play ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 1.6, ease: EASE_OUT, delay: 1.45 }}
            >
              {site.tagline}
            </motion.p>
          </div>
        </motion.div>

        <motion.div className={styles.strip} style={{ opacity: stripFade }}>
          <motion.div
            className={styles.stripRule}
            initial={{ scaleX: 0 }}
            animate={play ? { scaleX: 1 } : undefined}
            transition={{ duration: 1.8, ease: EASE, delay: 1.4 }}
          />
          <ul className={styles.proof} aria-label="Production scale">
            {site.proof.map((p, i) => (
              <motion.li
                key={p.label}
                className={styles.proofItem}
                initial={{ opacity: 0, y: 14 }}
                animate={play ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 1.1, ease: EASE_OUT, delay: 1.7 + i * 0.1 }}
              >
                <span className={`${styles.proofValue} display`}>{p.value}</span>
                <span className={styles.proofText}>
                  <span className="label">{p.label}</span>
                  <span className={`${styles.proofProject} label`}>{p.project}</span>
                </span>
              </motion.li>
            ))}
          </ul>
          <motion.div
            className={`${styles.cue} label`}
            initial={{ opacity: 0 }}
            animate={play ? { opacity: 1 } : undefined}
            transition={{ duration: 1.2, delay: 2.3 }}
          >
            <span>Scroll to explore</span>
            <span className={styles.cueArrow} aria-hidden>
              ↓
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
