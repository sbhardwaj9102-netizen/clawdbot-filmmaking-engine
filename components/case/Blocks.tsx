"use client";

import { AnimatePresence, motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { CountUp } from "@/components/motion/CountUp";
import { HorizontalScroll } from "@/components/motion/HorizontalScroll";
import { Line } from "@/components/motion/Line";
import { MaskText } from "@/components/motion/MaskText";
import { Media } from "@/components/motion/Media";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { Reveal } from "@/components/motion/Reveal";
import { StickyStory } from "@/components/motion/StickyStory";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { EASE_OUT } from "@/lib/motion";
import { useLenis } from "@/lib/smooth-scroll";
import { balance } from "@/lib/text";
import type { Asset, Block, Chapter, Festival, Stat } from "@/lib/types";
import styles from "./case.module.css";

/* ------------------------------------------------------------------ stats */

function StatTile({ stat, i }: { stat: Stat; i: number }) {
  const isNumber = "value" in stat;
  return (
    <div className={styles.stat} data-kind={isNumber ? "number" : "text"}>
      <Line delay={i * 0.15} />
      <div className={`${styles.statLabelTop} label`}>
        <span>{String(i + 1).padStart(2, "0")}</span>
      </div>
      {isNumber ? (
        <span className={`${styles.statValue} display`}>
          <CountUp value={stat.value} delay={0.2 + i * 0.2} />
        </span>
      ) : (
        <MaskText as="span" lines={[stat.text]} className={`${styles.statText} display`} delay={0.2 + i * 0.2} />
      )}
      <Reveal className={`${styles.statLabel} display`} delay={0.5 + i * 0.2} y={16}>
        {stat.label}
      </Reveal>
    </div>
  );
}

function Stats({ items }: { items: Stat[] }) {
  return (
    <section className={styles.stats} data-count={items.length}>
      {items.map((s, i) => (
        <StatTile key={s.label} stat={s} i={i} />
      ))}
    </section>
  );
}

/* -------------------------------------------------------------- statement */

function ScrollWord({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span className={styles.sword} style={{ opacity }}>
      {word}{" "}
    </motion.span>
  );
}

/** Words light up as the paragraph scrolls through the frame. */
function Statement({ text, kicker }: { text: string; kicker?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = text.split(" ");
  return (
    <section className={styles.statement}>
      {kicker && <SectionLabel index="—">{kicker}</SectionLabel>}
      <p ref={ref} className={`${styles.statementText} serif`} aria-label={text}>
        {words.map((w, i) => (
          <ScrollWord key={i} word={w} progress={scrollYProgress} range={[i / words.length, Math.min(1, (i + 2) / words.length)]} />
        ))}
      </p>
    </section>
  );
}

/* --------------------------------------------------------------- chapters */

function ChapterView({ chapter, index, total }: { chapter: Chapter; index: number; total: number }) {
  const variant = index % 4;
  const [a, b] = chapter.images;
  return (
    <article className={styles.chapter} data-variant={variant} data-images={chapter.images.length}>
      <div className={styles.chapterText}>
        <Reveal className={`${styles.chapterIndex} label`} y={10}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span className={styles.chapterRule} />
          <span>{String(total).padStart(2, "0")}</span>
        </Reveal>
        <MaskText as="h3" lines={balance(chapter.title)} className={`${styles.chapterTitle} display`} />
        <Reveal as="p" className={styles.chapterBody} delay={0.2}>
          {chapter.body}
        </Reveal>
      </div>
      {a && (
        <figure className={styles.chapterA}>
          <ParallaxImage asset={a} className={styles.chapterAFrame} speed={0.1} />
          {a.caption && <figcaption className="label">{a.caption}</figcaption>}
        </figure>
      )}
      {b && (
        <figure className={styles.chapterB}>
          <ParallaxImage asset={b} className={styles.chapterBFrame} speed={0.14} />
          {b.caption && <figcaption className="label">{b.caption}</figcaption>}
        </figure>
      )}
    </article>
  );
}

function Chapters({ items }: { items: Chapter[] }) {
  return (
    <section className={styles.chapters}>
      {items.map((c, i) => (
        <ChapterView key={c.title} chapter={c} index={i} total={items.length} />
      ))}
    </section>
  );
}

/* ---------------------------------------------------------------- gallery */

function Lightbox({ images, index, onClose, onStep }: { images: Asset[]; index: number; onClose: () => void; onStep: (d: number) => void }) {
  const img = images[index];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onStep(1);
      if (e.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onStep]);

  return (
    <motion.div
      className={styles.lightbox}
      role="dialog"
      aria-modal="true"
      aria-label={img.alt}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
      onClick={onClose}
    >
      <div className={styles.lightboxStage}>
        <AnimatePresence initial={false}>
          <motion.div
            key={index}
            className={styles.lightboxImage}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt={img.alt} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className={`${styles.lightboxBar} label`} onClick={(e) => e.stopPropagation()}>
        <span>{img.caption ?? img.alt}</span>
        <span className={styles.lightboxNav}>
          <button onClick={() => onStep(-1)} aria-label="Previous image" data-cursor="link">
            ← Prev
          </button>
          <span>
            {String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
          </span>
          <button onClick={() => onStep(1)} aria-label="Next image" data-cursor="link">
            Next →
          </button>
          <button onClick={onClose} aria-label="Close" data-cursor="link">
            Close ✕
          </button>
        </span>
      </div>
    </motion.div>
  );
}

function Gallery({ title, kicker, images }: { title: string; kicker?: string; images: Asset[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const lenis = useLenis();
  useEffect(() => {
    if (open === null) lenis?.start();
    else lenis?.stop();
  }, [open, lenis]);
  const step = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + images.length) % images.length)), [images.length]);
  const close = useCallback(() => setOpen(null), []);

  return (
    <section className={styles.gallery}>
      <header className={styles.blockHead}>
        <SectionLabel index="BTS">{kicker ?? title}</SectionLabel>
        <MaskText as="h2" lines={[title]} className={`${styles.blockTitle} display`} />
        <Reveal className={`${styles.blockNote} label`}>{String(images.length).padStart(2, "0")} frames — select to enlarge</Reveal>
      </header>
      <div className={styles.galleryGrid}>
        {images.map((img, i) => (
          <figure key={img.src} className={styles.galleryItem} data-slot={i % 5}>
            <button className={styles.galleryButton} onClick={() => setOpen(i)} data-cursor="view" data-cursor-label="Open" aria-label={`Open ${img.alt}`}>
              <ParallaxImage asset={img} className={styles.galleryFrame} speed={0.07} />
            </button>
            <figcaption className={`${styles.galleryCaption} label`}>
              <span>{img.caption}</span>
              <span>{String(i + 1).padStart(2, "0")}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <AnimatePresence>{open !== null && <Lightbox images={images} index={open} onClose={close} onStep={step} />}</AnimatePresence>
    </section>
  );
}

/* --------------------------------------------------------------- sequence */

function Frame({ img, i, total }: { img: Asset; i: number; total: number }) {
  return (
    <figure className={styles.frame}>
      <div className={`${styles.frameTop} label`}>
        <span>FR {String(i + 1).padStart(2, "0")}</span>
        <span>{img.caption}</span>
      </div>
      <div className={styles.frameImage}>
        <Media asset={img} />
      </div>
      <figcaption className={`${styles.frameBottom} label`}>
        <span>{img.alt}</span>
        <span>
          {String(i + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </span>
      </figcaption>
    </figure>
  );
}

function SequenceProgress({ progress }: { progress: MotionValue<number> }) {
  const scaleX = useTransform(progress, [0, 1], [0, 1]);
  return (
    <div className={styles.seqProgress} aria-hidden>
      <motion.div className={styles.seqFill} style={{ scaleX }} />
    </div>
  );
}

function Sequence({ title, kicker, images }: { title: string; kicker?: string; images: Asset[] }) {
  return (
    <HorizontalScroll
      minWidth={900}
      className={styles.sequence}
      trackClassName={styles.seqTrack}
      before={
        <div className={styles.seqHead}>
          <span className="label">{kicker ?? "Sequence"}</span>
          <span className={`${styles.seqTitle} display`}>{title}</span>
          <span className="label">{String(images.length).padStart(2, "0")} frames</span>
        </div>
      }
      after={(p) => <SequenceProgress progress={p} />}
    >
      {() => images.map((img, i) => <Frame key={img.src} img={img} i={i} total={images.length} />)}
    </HorizontalScroll>
  );
}

/* -------------------------------------------------------------- festivals */

function Laurel({ side }: { side: "left" | "right" }) {
  const leaves = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    const ang = (-100 + t * 150) * (Math.PI / 180);
    const r = 58;
    const x = 64 + Math.cos(ang) * r * 0.62;
    const y = 70 + Math.sin(ang) * r;
    const rot = (ang * 180) / Math.PI + 90 + 28;
    return { x, y, rot, s: 1 - t * 0.35 };
  });
  return (
    <svg viewBox="0 0 80 140" className={styles.laurel} data-side={side} aria-hidden>
      <path d="M 64 128 Q 20 74 58 14" fill="none" stroke="currentColor" strokeWidth="1" />
      {leaves.map((l, i) => (
        <ellipse key={i} cx={l.x - 6} cy={l.y} rx={4.2 * l.s} ry={10 * l.s} transform={`rotate(${l.rot} ${l.x - 6} ${l.y})`} fill="currentColor" opacity={0.85} />
      ))}
    </svg>
  );
}

function Festivals({ title, items, note }: { title: string; items: Festival[]; note?: string }) {
  return (
    <section className={styles.festivals}>
      <header className={styles.blockHead}>
        <SectionLabel index="★">Recognition</SectionLabel>
        <MaskText as="h2" lines={balance(title.toUpperCase(), 9)} className={`${styles.blockTitle} display`} />
        {note && <Reveal className={`${styles.blockNote} label`}>{note}</Reveal>}
      </header>
      <ul className={styles.laurels}>
        {items.map((f, i) => (
          <Reveal as="li" key={i} className={styles.laurelItem} delay={i * 0.12}>
            <Laurel side="left" />
            <div className={styles.laurelText}>
              <span className="label">{f.award ?? "Official Selection"}</span>
              <span className={`${styles.laurelName} display`}>{f.name}</span>
              <span className="label">{f.year}</span>
            </div>
            <Laurel side="right" />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/* ----------------------------------------------------------------- render */

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "stats":
            return <Stats key={i} items={b.items} />;
          case "statement":
            return <Statement key={i} text={b.text} kicker={b.kicker} />;
          case "chapters":
            return <Chapters key={i} items={b.items} />;
          case "timeline":
            return (
              <section key={i} className={styles.timeline}>
                <header className={styles.blockHead}>
                  <SectionLabel index="FX">Timeline</SectionLabel>
                  <MaskText as="h2" lines={balance(b.title.toUpperCase(), 9)} className={`${styles.blockTitle} display`} />
                  <Reveal className={`${styles.timelineFlow} label`}>
                    {b.items.map((s, j) => (
                      <span key={s.title}>
                        {s.title}
                        {j < b.items.length - 1 && <span className={styles.flowArrow}> → </span>}
                      </span>
                    ))}
                  </Reveal>
                </header>
                <StickyStory items={b.items} imageSide="right" />
              </section>
            );
          case "gallery":
            return <Gallery key={i} title={b.title} kicker={b.kicker} images={b.images} />;
          case "sequence":
            return <Sequence key={i} title={b.title} kicker={b.kicker} images={b.images} />;
          case "festivals":
            return <Festivals key={i} title={b.title} items={b.items} note={b.note} />;
          case "note":
            return (
              <Reveal key={i} as="p" className={`${styles.note} serif`}>
                {b.text}
              </Reveal>
            );
          default:
            return null;
        }
      })}
    </>
  );
}
