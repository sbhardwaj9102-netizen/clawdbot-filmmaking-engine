"use client";

import { useEffect, useRef } from "react";

import { profile } from "@/data/profile";
import { asset } from "@/lib/assets";
import { closeHotspot } from "@/systems/StoryEngine/engine";
import { getStory, useStory } from "@/systems/StoryEngine/store";

import styles from "./ResumeOverlay.module.css";
import { ResumeDocument } from "./ResumeDocument";

/** The file on the desk, opened: the resume as a document, with the PDF one click away. */
export function ResumeOverlay() {
  const open = useStory((s) => s.overlay === "resume");
  const btn = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (open) btn.current?.focus({ preventScroll: true });
  }, [open]);

  if (!open) return null;
  const close = () => {
    useStory.setState({ overlay: null });
    if (getStory().hotspot?.id === "about-resume") closeHotspot();
  };
  return (
    <div className={styles.wrap} role="dialog" aria-modal="true" aria-label="Resume" data-ui-scroll onClick={(e) => e.target === e.currentTarget && close()}>
      <div className={styles.bar}>
        <span className={styles.label}>Resume</span>
        <div className={styles.actions}>
          <a ref={btn} href={asset(profile.resumePdf)} download className={styles.download}>
            Download resume (PDF)
          </a>
          <a href={asset("/resume/")} target="_blank" rel="noreferrer">
            Open as page ↗
          </a>
          <button type="button" onClick={close}>
            Close <kbd>esc</kbd>
          </button>
        </div>
      </div>
      <div className={styles.sheet}>
        <ResumeDocument />
      </div>
    </div>
  );
}
