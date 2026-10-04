"use client";

import { motion, useInView, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";

import { HorizontalScroll } from "@/components/motion/HorizontalScroll";
import { Line } from "@/components/motion/Line";
import { MaskText } from "@/components/motion/MaskText";
import { Reveal } from "@/components/motion/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { site } from "@/data/site";
import { EASE, EASE_OUT } from "@/lib/motion";
import styles from "./Production.module.css";

type Step = { title: string; body: string };

function Stage({ step, index, total }: { step: Step; index: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.55 });
  const last = index === total - 1;
  return (
    <div ref={ref} className={styles.stage} data-active={inView || undefined}>
      <motion.span
        className={`${styles.ghost} display`}
        aria-hidden
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: inView ? 1 : 0, x: inView ? 0 : 40 }}
        transition={{ duration: 1.8, ease: EASE_OUT }}
      >
        {String(index + 1).padStart(2, "0")}
      </motion.span>
      <div className={`${styles.stageTop} label`}>
        <span className={styles.stageNum}>{String(index + 1).padStart(2, "0")}</span>
        <span className={styles.stageOf}>/ {String(total).padStart(2, "0")}</span>
      </div>
      <h3 className={`${styles.word} display`}>
        <span className={styles.wordMask}>
          <motion.span
            className={styles.wordInner}
            initial={{ y: "105%" }}
            animate={{ y: inView ? "0%" : "105%" }}
            transition={{ duration: 1.4, ease: EASE_OUT }}
          >
            {step.title}
          </motion.span>
        </span>
      </h3>
      <motion.p
        className={styles.body}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
        transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.35 }}
      >
        {step.body}
      </motion.p>
      {!last && (
        <div className={styles.connector} aria-hidden>
          <motion.span
            className={styles.connectorLine}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: inView ? 1 : 0 }}
            transition={{ duration: 1.6, ease: EASE, delay: 0.5 }}
          />
          <motion.span
            className={styles.connectorHead}
            initial={{ opacity: 0 }}
            animate={{ opacity: inView ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 1.6 }}
          >
            <span className={styles.arrowH}>→</span>
            <span className={styles.arrowV}>↓</span>
          </motion.span>
        </div>
      )}
    </div>
  );
}

function Progress({ progress, steps }: { progress: MotionValue<number>; steps: Step[] }) {
  const scaleX = useTransform(progress, [0, 1], [0, 1]);
  return (
    <div className={styles.progress} aria-hidden>
      <div className={styles.progressTrack}>
        <motion.div className={styles.progressFill} style={{ scaleX }} />
      </div>
      <div className={`${styles.progressLabels} label`}>
        {steps.map((s, i) => (
          <ProgressLabel key={s.title} progress={progress} index={i} total={steps.length} title={s.title} />
        ))}
      </div>
    </div>
  );
}

function ProgressLabel({ progress, index, total, title }: { progress: MotionValue<number>; index: number; total: number; title: string }) {
  // Input ranges must stay inside 0..1: framer-motion hands them to WAAPI
  // scroll timelines, which reject out-of-range / non-monotonic offsets.
  const at = index / (total - 1);
  const a = Math.max(0, at - 0.18);
  const b = Math.max(a + 0.001, at - 0.02);
  const opacity = useTransform(progress, [a, b], [0.3, 1]);
  return <motion.span style={{ opacity }}>{title}</motion.span>;
}

export function Production() {
  const { process } = site;
  return (
    <section id="production" className={styles.section} aria-labelledby="production-title">
      <header className={styles.header}>
        <SectionLabel index="02">Production</SectionLabel>
        <MaskText
          as="h2"
          lines={process.heading}
          className={`${styles.title} display`}
          lineClassNames={[undefined, styles.l2, styles.l3]}
        />
        <span id="production-title" className="sr-only">
          From script to screen
        </span>
        <Reveal as="p" className={`${styles.intro} serif`} delay={0.25}>
          {process.intro}
        </Reveal>
      </header>

      <HorizontalScroll
        minWidth={900}
        className={styles.h}
        trackClassName={styles.track}
        before={
          <div className={`${styles.hTop} label`}>
            <span>Process</span>
            <span>Script → Screen</span>
            <span>{String(process.steps.length).padStart(2, "0")} Stages</span>
          </div>
        }
        after={(p) => <Progress progress={p} steps={process.steps} />}
      >
        {() => process.steps.map((s, i) => <Stage key={s.title} step={s} index={i} total={process.steps.length} />)}
      </HorizontalScroll>

      <div className={styles.caps}>
        <div className={styles.capsHead}>
          <SectionLabel index="02.1">Capabilities</SectionLabel>
          <Reveal as="p" className={`${styles.capsIntro} serif`} delay={0.15}>
            The work behind the work — the disciplines that keep a production and a live event moving.
          </Reveal>
        </div>
        <ul className={styles.capsList}>
          {process.capabilities.map((c, i) => (
            <li key={c} className={styles.cap}>
              <Line delay={(i % 2) * 0.12} />
              <Reveal className={styles.capRow} y={18} delay={(i % 2) * 0.12 + 0.1}>
                <span className={`${styles.capIndex} label`}>{String(i + 1).padStart(2, "0")}</span>
                <span className={`${styles.capName} display`}>{c}</span>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
