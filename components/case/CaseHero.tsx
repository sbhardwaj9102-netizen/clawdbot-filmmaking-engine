"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import { usePageTransition } from "@/components/layout/TransitionProvider";
import { MaskText } from "@/components/motion/MaskText";
import { Media } from "@/components/motion/Media";
import { projects } from "@/data/projects";
import { EASE_OUT } from "@/lib/motion";
import type { Project } from "@/lib/types";
import styles from "./case.module.css";

/** Full-screen opening plate. Its image matches the card it was opened from. */
export function CaseHero({ project }: { project: Project }) {
  const ref = useRef<HTMLElement>(null);
  const { ready } = usePageTransition();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const shade = useTransform(scrollYProgress, [0, 0.85], [0, 0.75]);
  const lift = useTransform(scrollYProgress, [0, 1], ["0vh", "-14vh"]);
  const fade = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const lines = project.titleLines ?? [project.title];
  const longest = Math.max(...lines.map((l) => l.length));
  const fontSize = `min(24vw, calc(94vw / ${(longest * 0.5).toFixed(2)}))`;

  return (
    <section ref={ref} className={styles.hero} aria-labelledby="case-title">
      <motion.div className={styles.heroMedia} style={{ y }}>
        <div className={styles.heroKen}>
          <Media asset={project.cover} priority />
        </div>
      </motion.div>
      <div className={styles.heroGrade} />
      <motion.div className={styles.heroShade} style={{ opacity: shade }} />

      <motion.div className={styles.heroContent} style={{ y: lift, opacity: fade }}>
        <motion.div
          className={`${styles.heroMeta} label`}
          initial={{ opacity: 0, y: 14 }}
          animate={ready ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.5 }}
        >
          <span>
            {project.number} / {String(projects.length).padStart(2, "0")}
          </span>
          <span>{project.role}</span>
          {project.scale && <span className={styles.heroScale}>{project.scale}</span>}
        </motion.div>

        <h1 id="case-title" className={`${styles.heroTitle} display`} style={{ fontSize }}>
          <MaskText as="span" lines={lines} chars play={ready} delay={0.15} duration={1.4} />
        </h1>

        <motion.div
          className={styles.heroFoot}
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : undefined}
          transition={{ duration: 1.4, delay: 1.1 }}
        >
          <p className={`${styles.heroLogline} serif`}>{project.logline}</p>
          <span className={`${styles.heroCue} label`}>
            Scroll <span aria-hidden>↓</span>
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
