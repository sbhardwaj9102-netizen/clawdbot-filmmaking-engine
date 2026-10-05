"use client";

import { useEffect, useRef } from "react";

import { profile } from "@/data/profile";
import { jumpTargets } from "@/data/story/scenes";
import { asset } from "@/lib/assets";
import { emailHref, whatsappHref } from "@/lib/contact";
import { jump, restart, setReducedMotion, setSound } from "@/systems/StoryEngine/engine";
import { useStory } from "@/systems/StoryEngine/store";

import styles from "./Menu.module.css";

/** The index: jump anywhere in the story, or straight to what a recruiter needs. */
export function Menu() {
  const open = useStory((s) => s.overlay === "menu");
  const visited = useStory((s) => s.visitedScenes);
  const current = useStory((s) => s.currentScene);
  const sound = useStory((s) => s.sound);
  const reduced = useStory((s) => s.reducedMotion);
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) first.current?.focus();
  }, [open]);

  if (!open) return null;
  const close = () => useStory.setState({ overlay: null });
  return (
    <div className={styles.menu} role="dialog" aria-modal="true" aria-label="Menu" data-ui-scroll onClick={(e) => e.target === e.currentTarget && close()}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <span>{profile.name}</span>
          <button ref={first} type="button" onClick={close}>
            Close <kbd>esc</kbd>
          </button>
        </div>

        <div className={styles.cols}>
          <nav aria-label="Go to">
            <p className={styles.label}>Go to</p>
            <ul className={styles.scenes}>
              {jumpTargets.map((t) => (
                <li key={t.scene}>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      jump(t.scene);
                    }}
                    aria-current={current === t.scene ? "location" : undefined}
                  >
                    <span>{t.label}</span>
                    {visited.includes(t.scene) && <em>visited</em>}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    useStory.setState({ contactOpen: true });
                  }}
                >
                  <span>Contact</span>
                </button>
              </li>
            </ul>
          </nav>

          <div>
            <p className={styles.label}>For recruiters</p>
            <ul className={styles.quick}>
              <li>
                <button type="button" onClick={() => useStory.setState({ overlay: "quick" })}>
                  Quick mode — everything on one page
                </button>
              </li>
              <li>
                <button type="button" onClick={() => useStory.setState({ overlay: "resume" })}>
                  Open resume
                </button>
              </li>
              <li>
                <a href={asset(profile.resumePdf)} download>
                  Download resume (PDF)
                </a>
              </li>
              <li>
                <a href={emailHref()}>{profile.contact.email}</a>
              </li>
              <li>
                <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" data-contact="whatsapp">
                  WhatsApp — {profile.contact.whatsapp.display} ↗
                </a>
              </li>
              {profile.contact.linkedin && (
                <li>
                  <a href={profile.contact.linkedin} target="_blank" rel="noreferrer">
                    LinkedIn ↗
                  </a>
                </li>
              )}
            </ul>

            <p className={styles.label}>Settings</p>
            <ul className={styles.quick}>
              <li>
                <button type="button" onClick={() => setSound(!sound)} aria-pressed={sound}>
                  Sound: {sound ? "on" : "off"}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setReducedMotion(!reduced)} aria-pressed={reduced}>
                  Reduced motion: {reduced ? "on" : "off"}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    restart();
                  }}
                >
                  Start the journey again
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
