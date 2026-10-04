"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/data/site";
import { scrollToTarget, useLenis } from "@/lib/smooth-scroll";
import styles from "./Contact.module.css";

function Word({ word, i, n, progress }: { word: string; i: number; n: number; progress: MotionValue<number> }) {
  const a = 0.06 + (i / n) * 0.52;
  const b = a + 0.14;
  const opacity = useTransform(progress, [a, b], [0.08, 1]);
  const y = useTransform(progress, [a, b], ["0.18em", "0em"]);
  return (
    <motion.span className={styles.word} style={{ opacity, y }}>
      {word}
    </motion.span>
  );
}

/** End credits: the closing line lights up word by word, then the contact card. */
export function Contact() {
  const ref = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const cardOpacity = useTransform(scrollYProgress, [0.68, 0.84], [0, 1]);
  const cardY = useTransform(scrollYProgress, [0.68, 0.84], [40, 0]);
  const words = site.closing;
  const { contact, name } = site;

  return (
    <section id="contact" className={styles.section} aria-labelledby="contact-title">
      <div ref={ref} className={styles.credits}>
        <div className={styles.sticky}>
          <h2 id="contact-title" className={`${styles.line} display`} aria-label={words.join(" ")}>
            {words.map((w, i) => (
              <Word key={w} word={w} i={i} n={words.length} progress={scrollYProgress} />
            ))}
          </h2>

          <motion.div className={styles.card} style={{ opacity: cardOpacity, y: cardY }}>
            <span className={`${styles.cardName} display`}>
              {name.first} {name.last}
            </span>
            <a className={styles.cardLink} href={contact.phoneHref} data-cursor="link">
              {contact.phone}
            </a>
            <a className={styles.cardLink} href={`mailto:${contact.email}`} data-cursor="link">
              {contact.email.toUpperCase()}
            </a>
            <span className={`${styles.cardLoc} label`}>{contact.locations}</span>
            <a className={styles.cta} href={`mailto:${contact.email}?subject=Let%27s%20make%20something`} data-cursor="link">
              <span className={styles.ctaText}>Contact</span>
              <span className={styles.ctaArrow} aria-hidden>
                →
              </span>
            </a>
          </motion.div>
        </div>
      </div>

      <footer className={styles.footer}>
        <Reveal className={`${styles.footRow} label`} y={10}>
          <span>© {new Date().getFullYear()} Satyam Bhardwaj</span>
          <span className={styles.footMid}>Portfolio prototype — placeholder imagery</span>
          <button className={styles.top} onClick={() => scrollToTarget(lenis, 0)} data-cursor="link">
            Back to top ↑
          </button>
        </Reveal>
      </footer>
    </section>
  );
}
