"use client";

import { useEffect, useRef } from "react";

import { hotspots } from "@/data/story/hotspots";
import type { SceneId } from "@/data/story/types";
import type { PanelContent } from "@/data/types";
import { tex } from "@/lib/assets";
import { closeHotspot, jump } from "@/systems/StoryEngine/engine";
import { useStory } from "@/systems/StoryEngine/store";

import styles from "./Dossier.module.css";

/**
 * The dossier: what an object in the world opens into. A side panel on
 * desktop (the camera keeps the object in frame beside it), a bottom sheet on
 * phones. Images open in the lightbox.
 */
export function Dossier() {
  const hs = useStory((s) => s.hotspot);
  const blocked = useStory((s) => !!s.overlay || !!s.lightbox);
  const close = useRef<HTMLButtonElement>(null);
  const def = hs ? hotspots[hs.id] : undefined;
  const open = !!hs && hs.status === "open" && def?.action.type === "panel";

  useEffect(() => {
    if (open && !blocked) close.current?.focus({ preventScroll: true });
  }, [open, blocked]);

  if (!open || !def || def.action.type !== "panel") return null;
  const c = def.action.content;
  return (
    <aside className={styles.panel} role="dialog" aria-modal="false" aria-labelledby="dossier-title" data-ui-scroll>
      <header className={styles.head}>
        <span className={styles.verb}>{def.verb}</span>
        <button ref={close} type="button" className={styles.close} onClick={closeHotspot} aria-label="Close and keep walking">
          Close <kbd>esc</kbd>
        </button>
      </header>
      <PanelBody content={c} />
      <p className={styles.footer}>Scroll the world to keep walking</p>
    </aside>
  );
}

export function PanelBody({ content: c, onLink }: { content: PanelContent; onLink?: () => void }) {
  const openLightbox = (i: number) => c.media && useStory.setState({ lightbox: { items: c.media, index: i } });
  return (
    <div className={styles.body}>
      {c.kicker && <p className={styles.kicker}>{c.kicker}</p>}
      <h2 id="dossier-title" className={styles.title}>
        {c.title}
      </h2>
      {c.body?.map((p) => (
        <p key={p} className={styles.text}>
          {p}
        </p>
      ))}
      {c.facts && (
        <dl className={styles.facts}>
          {c.facts.map((f) => (
            <div key={f.label + f.value}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {c.list && (
        <ol className={styles.list}>
          {c.list.map((l, i) => (
            <li key={l.title}>
              <span className={styles.n}>{String(i + 1).padStart(2, "0")}</span>
              <span>
                <b>{l.title}</b>
                {l.body && <em>{l.body}</em>}
              </span>
            </li>
          ))}
        </ol>
      )}
      {c.media && c.media.length > 0 && (
        <ul className={styles.media}>
          {c.media.map((m, i) => (
            <li key={m.src + i}>
              <button type="button" onClick={() => openLightbox(i)} aria-label={`View image: ${m.alt}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tex(m.src)} alt={m.alt} loading="lazy" />
                {m.label && <span>{m.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {c.note && <p className={styles.note}>{c.note}</p>}
      {c.link && (
        <button
          type="button"
          className={styles.link}
          onClick={() => {
            onLink?.();
            jump(c.link!.scene as SceneId);
          }}
        >
          {c.link.label} →
        </button>
      )}
    </div>
  );
}
