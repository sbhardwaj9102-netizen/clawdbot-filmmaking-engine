"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";

import { usePageTransition } from "@/components/layout/TransitionProvider";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { Reveal } from "@/components/motion/Reveal";
import { EASE_OUT } from "@/lib/motion";
import type { Project } from "@/lib/types";
import styles from "./ProjectCard.module.css";

/** Two stacked copies of each digit roll past on hover. */
function RollingNumber({ value, active }: { value: string; active: boolean }) {
  return (
    <span className={styles.roll} aria-hidden>
      {value.split("").map((d, i) => (
        <span key={i} className={styles.rollMask}>
          <motion.span
            className={styles.rollCol}
            animate={{ y: active ? "-50%" : "0%" }}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: i * 0.07 }}
          >
            <span>{d}</span>
            <span>{d}</span>
          </motion.span>
        </span>
      ))}
    </span>
  );
}

type Props = { project: Project; variant: "wide" | "tall"; className?: string };

export function ProjectCard({ project, variant, className }: Props) {
  const { navigate } = usePageTransition();
  const imageRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const asset = variant === "tall" ? project.poster ?? project.cover : project.cover;
  const lines = project.titleLines ?? [project.title];
  const href = `/work/${project.slug}/`;

  const open = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const rect = imageRef.current?.getBoundingClientRect();
    navigate({ href, mode: "project", rect, image: asset.src, fromScale: hover ? 1.06 : 1 });
  };

  return (
    <article className={`${styles.card} ${className ?? ""}`} data-variant={variant} data-hover={hover || undefined}>
      <a
        href={href}
        onClick={open}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        data-cursor="view"
        data-cursor-label="View"
        className={styles.link}
        aria-label={`${project.title} — ${project.role}. View project`}
      >
        <Reveal className={styles.head} y={16}>
          <span className={`${styles.number} display`}>
            <RollingNumber value={project.number} active={hover} />
          </span>
          <span className={`${styles.role} label`}>{project.role}</span>
          <span className={`${styles.view} label`}>
            View project <span className={styles.arrow}>→</span>
          </span>
        </Reveal>

        <div ref={imageRef} className={styles.imageWrap}>
          <ParallaxImage asset={asset} className={styles.image} innerClassName={styles.imageInner} speed={0.08} />
          <div className={styles.overlay} />
          <h3 className={`${styles.title} display`}>
            {lines.map((l) => (
              <span key={l} className={styles.titleLine}>
                {l}
              </span>
            ))}
          </h3>
        </div>

        <Reveal className={styles.meta} y={12} delay={0.1}>
          {project.scale ? <span className="label">{project.scale}</span> : <span className="label">{project.role}</span>}
          <span className={`${styles.metaRight} label`}>{project.format ?? "Case study"}</span>
        </Reveal>
      </a>
    </article>
  );
}
