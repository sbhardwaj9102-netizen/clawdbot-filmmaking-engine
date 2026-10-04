"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { site } from "@/data/site";
import { EASE_OUT } from "@/lib/motion";
import styles from "./Toolkit.module.css";

function Tool({ name, note, index }: { name: string; note: string; index: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const dir = index % 2 === 0 ? 1 : -1;
  const x = useTransform(scrollYProgress, [0, 1], [`${dir * 5}vw`, `${dir * -5}vw`]);

  return (
    <li ref={ref} className={styles.tool} tabIndex={0}>
      <span className={`${styles.index} label`}>{String(index + 1).padStart(2, "0")}</span>
      <motion.span className={styles.drift} style={{ x }}>
        <span className={styles.mask}>
          <motion.span
            className={`${styles.word} display`}
            data-text={name}
            initial={{ y: "105%" }}
            animate={{ y: inView ? "0%" : "105%" }}
            transition={{ duration: 1.4, ease: EASE_OUT, delay: 0.05 }}
          >
            {name}
          </motion.span>
        </span>
      </motion.span>
      <span className={`${styles.note} label`}>{note}</span>
    </li>
  );
}

/** Skills as moving type, not progress bars. Hover fills each word. */
export function Toolkit() {
  return (
    <section id="toolkit" className={styles.section} aria-labelledby="toolkit-title">
      <div className={styles.head}>
        <SectionLabel index="05">Toolkit</SectionLabel>
        <Reveal as="p" className={`${styles.intro} serif`} delay={0.15}>
          Tools of the trade — from the stripboard to the spreadsheet.
        </Reveal>
        <h2 id="toolkit-title" className="sr-only">
          Toolkit
        </h2>
      </div>
      <ul className={styles.list}>
        {site.toolkit.map((t, i) => (
          <Tool key={t.name} name={t.name} note={t.note} index={i} />
        ))}
      </ul>
    </section>
  );
}
