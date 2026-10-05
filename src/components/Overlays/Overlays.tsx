"use client";

import { useCallback, useEffect, useRef } from "react";

import { ContactLinks } from "@/components/Contact/ContactLinks";
import { QuickView } from "@/components/QuickView/QuickView";
import { ResumeDocument } from "@/components/Resume/ResumeDocument";
import { Close, Download } from "@/components/UI/Icons";
import { Modal } from "@/components/UI/Modal";
import { profile } from "@/data/profile";
import { asset } from "@/lib/assets";
import { getExperience, setExperience, useExperience } from "@/systems/Experience/store";
import { goExplore } from "@/systems/Experience/tour";

import styles from "./Overlays.module.css";

const close = () => setExperience({ overlay: null });

/** Quick view over the experience (the tour waits underneath). */
export function QuickViewOverlay() {
  const open = useExperience((s) => s.overlay === "quick");
  if (!open) return null;
  return (
    <Modal label="Quick view" onClose={close} className={styles.sheetWrap}>
      <div className={styles.quick}>
        <QuickView
          onClose={close}
          onWork={(w) => {
            close();
            goExplore("work", w);
          }}
        />
      </div>
    </Modal>
  );
}

/** The resume as a document, with the PDF one click away. */
export function ResumeOverlay() {
  const open = useExperience((s) => s.overlay === "resume");
  const btn = useRef<HTMLAnchorElement>(null);
  if (!open) return null;
  return (
    <Modal label="Resume" onClose={close} className={styles.sheetWrap} initialFocus={btn}>
      <div className={styles.bar}>
        <span className={styles.barLabel}>Resume</span>
        <div className={styles.barActions}>
          <a ref={btn} href={asset(profile.resumePdf)} download className="btn btn-primary" data-action="resume-pdf">
            <Download /> Download PDF
          </a>
          <a href={asset("/resume/")} target="_blank" rel="noreferrer" className="btn btn-quiet">
            Open as a page ↗
          </a>
          <button type="button" className={styles.close} onClick={close} aria-label="Close resume">
            <Close />
          </button>
        </div>
      </div>
      <div className={styles.paper}>
        <ResumeDocument />
      </div>
    </Modal>
  );
}

/** Contact, from anywhere: email (copied as well), WhatsApp, phone, the resume. */
export function ContactOverlay() {
  const open = useExperience((s) => s.overlay === "contact");
  if (!open) return null;
  return (
    <Modal label="Contact Satyam" onClose={close} className={styles.centerWrap}>
      <section className={styles.contactCard}>
        <button type="button" className={styles.close} onClick={close} aria-label="Close contact">
          <Close />
        </button>
        <p className={`label ${styles.kicker}`}>Contact</p>
        <h2 className={styles.contactTitle}>Let&apos;s talk.</h2>
        <p className={styles.contactLead}>
          {profile.name} · {profile.title} · {profile.base}
        </p>
        <ContactLinks className={styles.links} itemClassName={styles.linkItem} />
      </section>
    </Modal>
  );
}

/** Full-screen viewer for stills. Arrow keys / swipe to move through a set. */
export function Lightbox() {
  const lb = useExperience((s) => s.lightbox);
  const touchX = useRef<number | null>(null);
  const shut = useCallback(() => setExperience({ lightbox: null }), []);
  const step = useCallback((d: number) => {
    const s = getExperience().lightbox;
    if (!s) return;
    setExperience({ lightbox: { ...s, index: (s.index + d + s.items.length) % s.items.length } });
  }, []);

  useEffect(() => {
    if (!lb) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lb, step]);

  if (!lb) return null;
  const item = lb.items[lb.index];
  const many = lb.items.length > 1;
  return (
    <Modal label={item.alt} onClose={shut} className={styles.lightbox}>
      <figure
        className={styles.figure}
        key={item.src + lb.index}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(item.src)} alt={item.alt} className={styles.media} />
        <figcaption>
          <span>{item.alt}</span>
          {many && (
            <span>
              {lb.index + 1} / {lb.items.length}
            </span>
          )}
        </figcaption>
      </figure>
      {many && (
        <>
          <button type="button" className={`${styles.nav} ${styles.prev}`} onClick={() => step(-1)} aria-label="Previous image">
            ←
          </button>
          <button type="button" className={`${styles.nav} ${styles.next}`} onClick={() => step(1)} aria-label="Next image">
            →
          </button>
        </>
      )}
      <button type="button" className={`${styles.close} ${styles.lbClose}`} onClick={shut} aria-label="Close image">
        <Close />
      </button>
    </Modal>
  );
}
