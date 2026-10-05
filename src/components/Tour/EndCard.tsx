"use client";

import { useEffect, useRef } from "react";

import { Download } from "@/components/UI/Icons";
import { profile } from "@/data/profile";
import { asset } from "@/lib/assets";
import { setExperience, useExperience } from "@/systems/Experience/store";
import { goExplore, tour } from "@/systems/Experience/tour";

import styles from "./EndCard.module.css";

/** The last frame: the story has ended, the career is beginning. Three ways forward. */
export function EndCard() {
  const show = useExperience((s) => s.mode === "tour" && s.ended);
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (show) first.current?.focus({ preventScroll: true });
  }, [show]);
  if (!show) return null;
  return (
    <section className={styles.card} aria-labelledby="end-title">
      <div className={styles.inner}>
        <p className={`label ${styles.kicker}`}>Film + Production + Business + Finance</p>
        <h2 id="end-title" className={styles.title}>
          {profile.name}
        </h2>
        <p className={styles.role}>{profile.title}</p>
        <p className={styles.lead}>A producer who understands the creative and the financial side of production — building toward a production company.</p>
        <div className={styles.actions}>
          <button ref={first} type="button" className="btn btn-primary" onClick={() => goExplore("work", "aster")} data-action="view-work">
            View work
          </button>
          <a className="btn" href={asset(profile.resumePdf)} download data-action="download-resume">
            <Download />
            Download resume
          </a>
          <button type="button" className="btn" onClick={() => setExperience({ overlay: "contact" })} data-action="contact-satyam">
            Contact Satyam
          </button>
        </div>
        <div className={styles.more}>
          <button type="button" className="btn btn-quiet" onClick={tour.replay} data-action="replay">
            Watch again
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => goExplore("about")} data-action="explore">
            Explore
          </button>
        </div>
      </div>
    </section>
  );
}
