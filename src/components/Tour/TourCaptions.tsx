"use client";

import { profile } from "@/data/profile";
import { chapterIndex, chapters } from "@/data/story";
import { tex } from "@/lib/assets";
import { setExperience, useExperience } from "@/systems/Experience/store";

import styles from "./TourCaptions.module.css";

/**
 * What the visitor reads during the tour: one caption at a time, short enough
 * to take in while the camera moves. A title card, a statement, or a beat
 * (kicker, title, a line or two, and — where it helps — numbers, a short
 * chain of words, or up to three images).
 */
export function TourCaptions() {
  const mode = useExperience((s) => s.mode);
  const chapter = useExperience((s) => s.chapter);
  const caption = useExperience((s) => s.caption);
  const ended = useExperience((s) => s.ended);
  if (mode !== "tour" || ended || caption < 0) return null;
  const ch = chapters[chapterIndex[chapter]];
  const c = ch.captions[caption];
  if (!c) return null;
  const key = `${chapter}:${caption}`;

  if (c.style === "title") {
    return (
      <div className={`${styles.layer} ${styles.titleLayer}`} key={key}>
        <div className={styles.titleCard}>
          <p className={`label ${styles.kicker}`}>{profile.disciplines.join(" · ")}</p>
          <h2 className={styles.titleName}>{c.title}</h2>
          {c.lines?.map((l) => (
            <p key={l} className={styles.titleRole}>
              {l}
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (c.style === "statement") {
    return (
      <div className={`${styles.layer} ${styles.statementLayer}`} key={key}>
        <div className={styles.statement}>
          {c.kicker && <p className={`label ${styles.kicker}`}>{c.kicker}</p>}
          <h2 className={styles.statementText}>{c.title}</h2>
          {c.lines?.map((l) => (
            <p key={l} className={styles.lead}>
              {l}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.layer} ${styles.beatLayer}`} key={key}>
      <div className={styles.beat}>
        {c.kicker && <p className={`label ${styles.kicker}`}>{c.kicker}</p>}
        <h2 className={styles.title}>{c.title}</h2>

        {c.stats && (
          <dl className={styles.stats}>
            {c.stats.map((s, i) => (
              <div key={s.label} style={{ animationDelay: `${0.5 + i * 0.25}s` }}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {c.chips && (
          <ul className={styles.chips}>
            {c.chips.map((chip, i) => (
              <li key={chip} style={{ animationDelay: `${0.4 + i * 0.18}s` }}>
                {chip}
              </li>
            ))}
          </ul>
        )}

        {c.chain && (
          <ol className={styles.chain} aria-label={c.chain.words.join(" to ")}>
            {c.chain.words.map((w, i) => (
              <li key={w} style={{ animationDelay: `${0.5 + i * 0.32}s` }}>
                {i > 0 && <span aria-hidden>{c.chain!.joiner}</span>}
                {w}
              </li>
            ))}
          </ol>
        )}

        {c.lines?.map((l) => (
          <p key={l} className={styles.line}>
            {l}
          </p>
        ))}

        {c.media && (
          <ul className={styles.media}>
            {c.media.map((m, i) => (
              <li key={m.src} style={{ animationDelay: `${0.8 + i * 0.22}s` }}>
                <button type="button" onClick={() => setExperience({ lightbox: { items: c.media!, index: i } })} aria-label={`View image: ${m.alt}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tex(m.src)} alt="" loading="eager" />
                  {m.label && <span>{m.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
