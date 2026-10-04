"use client";

import { useRef, useState } from "react";

import { usePageTransition } from "@/components/layout/TransitionProvider";
import { MaskText } from "@/components/motion/MaskText";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { Reveal } from "@/components/motion/Reveal";
import type { Project } from "@/lib/types";
import styles from "./case.module.css";

/** Ends every case study: the next film, opened with the same full-screen transition. */
export function NextProject({ project }: { project: Project }) {
  const { navigate } = usePageTransition();
  const imageRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const href = `/work/${project.slug}/`;

  return (
    <section className={styles.next} data-hover={hover || undefined}>
      <Reveal className={`${styles.nextTop} label`} y={10}>
        <span>Next project</span>
        <span>
          {project.number} — {project.role}
        </span>
      </Reveal>
      <a
        href={href}
        className={styles.nextLink}
        data-cursor="view"
        data-cursor-label="Next"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          navigate({ href, mode: "project", rect: imageRef.current?.getBoundingClientRect(), image: project.cover.src, fromScale: hover ? 1.05 : 1 });
        }}
      >
        <div ref={imageRef} className={styles.nextImage}>
          <ParallaxImage asset={project.cover} className={styles.nextFrame} innerClassName={styles.nextInner} speed={0.1} />
        </div>
        <MaskText as="h2" lines={project.titleLines ?? [project.title]} className={`${styles.nextTitle} display`} />
      </a>
      <div className={styles.nextFoot}>
        <button
          className="label"
          onClick={() => navigate({ href: "/#work", mode: "curtain", label: "Selected Work" })}
          data-cursor="link"
        >
          ← All work
        </button>
        <button
          className="label"
          onClick={() => navigate({ href: "/#contact", mode: "curtain", label: "Contact" })}
          data-cursor="link"
        >
          Let&apos;s make something worth watching →
        </button>
      </div>
    </section>
  );
}
