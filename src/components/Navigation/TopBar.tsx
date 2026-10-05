"use client";

import { Moon, SoundOff, SoundOn, Sun } from "@/components/UI/Icons";
import { profile } from "@/data/profile";
import { sections } from "@/data/story";
import { toggleSound, toggleTheme } from "@/systems/Experience/preferences";
import { setExperience, useExperience } from "@/systems/Experience/store";
import { goExplore, goLanding } from "@/systems/Experience/tour";

import styles from "./TopBar.module.css";

/**
 * Always there once the visitor is in: who this is, the four Explore
 * sections (in Explore), and the recruiter's way out — Quick view, Resume,
 * Contact — plus sound and theme.
 */
export function TopBar() {
  const mode = useExperience((s) => s.mode);
  const section = useExperience((s) => s.section);
  const sound = useExperience((s) => s.sound);
  const theme = useExperience((s) => s.theme);
  if (mode === "landing") return null;

  return (
    <header className={styles.bar}>
      <button type="button" className={styles.name} onClick={goLanding} aria-label={`${profile.name} — back to the start`}>
        <span className="serif">{profile.name}</span>
        <span className={styles.role}>{profile.title}</span>
      </button>

      {mode === "explore" && (
        <nav className={styles.nav} aria-label="Sections">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              className={styles.navItem}
              aria-current={section === s.id ? "page" : undefined}
              onClick={() => goExplore(s.id)}
              data-section={s.id}
            >
              {s.label}
            </button>
          ))}
        </nav>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.link} onClick={() => setExperience({ overlay: "quick" })} data-action="quick">
          Quick view
        </button>
        <button type="button" className={styles.link} onClick={() => setExperience({ overlay: "resume" })} data-action="resume">
          Resume
        </button>
        <button type="button" className={`${styles.link} ${styles.contact}`} onClick={() => setExperience({ overlay: "contact" })} data-action="contact">
          Contact
        </button>
        <button type="button" className={styles.icon} onClick={toggleSound} aria-pressed={sound} aria-label={sound ? "Sound on — turn off" : "Sound off — turn on"} data-action="sound">
          {sound ? <SoundOn /> : <SoundOff />}
        </button>
        <button type="button" className={styles.icon} onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} data-action="theme">
          {theme === "dark" ? <Sun /> : <Moon />}
        </button>
      </div>
    </header>
  );
}
