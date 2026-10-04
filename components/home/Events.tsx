"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef, useState } from "react";

import { MaskText } from "@/components/motion/MaskText";
import { Media } from "@/components/motion/Media";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { StickyStory } from "@/components/motion/StickyStory";
import { Reveal } from "@/components/motion/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { site } from "@/data/site";
import { EASE_OUT } from "@/lib/motion";
import styles from "./Events.module.css";

const { events } = site;

/* ----------------------------------------------------------------------------
   Venue transformation: Empty venue → Setup → Live event.
   Scroll drives two hard wipes across a locked-off frame.
---------------------------------------------------------------------------- */

function Wipe({ progress, range, children }: { progress: MotionValue<number>; range: [number, number]; children: React.ReactNode }) {
  const clip = useTransform(progress, range, ["inset(0% 100% 0% 0%)", "inset(0% 0% 0% 0%)"]);
  const scale = useTransform(progress, [range[0], range[1] + 0.15], [1.08, 1]);
  return (
    <motion.div className={styles.layer} style={{ clipPath: clip }}>
      <motion.div className={styles.layerInner} style={{ scale }}>
        {children}
      </motion.div>
    </motion.div>
  );
}

function Edge({ progress, range }: { progress: MotionValue<number>; range: [number, number] }) {
  const left = useTransform(progress, range, ["0%", "100%"]);
  const opacity = useTransform(progress, [range[0], range[0] + 0.02, range[1] - 0.02, range[1]], [0, 1, 1, 0]);
  return <motion.span className={styles.edge} style={{ left, opacity }} aria-hidden />;
}

function Transformation() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [stage, setStage] = useState(0);
  const wipes: [number, number][] = [
    [0.16, 0.42],
    [0.56, 0.82],
  ];
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setStage(v < (wipes[0][0] + wipes[0][1]) / 2 ? 0 : v < (wipes[1][0] + wipes[1][1]) / 2 ? 1 : 2);
  });
  const bar = useTransform(scrollYProgress, [0.05, 0.92], [0, 1]);
  const t = events.transformation;

  return (
    <div ref={ref} className={styles.transform}>
      <div className={styles.transformSticky}>
        <div className={styles.layer}>
          <Media asset={t[0].image} />
        </div>
        <Wipe progress={scrollYProgress} range={wipes[0]}>
          <Media asset={t[1].image} />
        </Wipe>
        <Wipe progress={scrollYProgress} range={wipes[1]}>
          <Media asset={t[2].image} />
        </Wipe>
        <Edge progress={scrollYProgress} range={wipes[0]} />
        <Edge progress={scrollYProgress} range={wipes[1]} />
        <div className={styles.transformShade} />

        <div className={styles.transformTop}>
          <span className="label">The transformation</span>
          <span className={`${styles.tag} label`} data-after={stage === 2 || undefined}>
            {stage === 0 ? "Before" : stage === 1 ? "In progress" : "After"}
          </span>
        </div>

        <div className={styles.clock}>
          <AnimatePresence mode="wait">
            <motion.span
              key={stage}
              className={`${styles.clockTime} display`}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.7, ease: EASE_OUT }}
            >
              {t[stage].time}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className={styles.stages}>
          <div className={styles.stagesTrack}>
            <motion.div className={styles.stagesFill} style={{ scaleX: bar }} />
          </div>
          <ol className={styles.stageList}>
            {t.map((s, i) => (
              <li key={s.label} className={styles.stageItem} data-active={i <= stage || undefined}>
                <span className="label">{String(i + 1).padStart(2, "0")}</span>
                <span className={`${styles.stageName} display`}>{s.label}</span>
                {i < t.length - 1 && <span className={styles.stageArrow} aria-hidden>→</span>}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export function Events() {
  return (
    <section id="events" className={styles.section} aria-labelledby="events-title">
      <header className={styles.header}>
        <SectionLabel index="03">Event operations</SectionLabel>
        <MaskText as="h2" lines={events.heading} className={`${styles.title} display`} lineClassNames={[undefined, styles.indent]} />
        <span id="events-title" className="sr-only">
          Live execution
        </span>
        <Reveal as="p" className={`${styles.intro} serif`} delay={0.25}>
          {events.intro}
        </Reveal>
      </header>

      <StickyStory items={events.pillars} />
      <Transformation />

      <div className={styles.coda}>
        <ParallaxImage asset={events.gallery[0]} className={styles.codaWide} speed={0.1} />
        <div className={styles.codaSide}>
          <ParallaxImage asset={events.gallery[1]} className={styles.codaTall} speed={0.08} />
          <Reveal as="p" className={`${styles.codaText} serif`}>
            {events.closing}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
