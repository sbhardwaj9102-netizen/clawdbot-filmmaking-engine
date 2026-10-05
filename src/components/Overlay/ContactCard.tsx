"use client";

import { useEffect, useRef } from "react";

import { profile } from "@/data/profile";
import { finale, questions } from "@/data/story/questions";
import { sceneById } from "@/data/story/scenes";
import { restart } from "@/systems/StoryEngine/engine";
import { useStory } from "@/systems/StoryEngine/store";

import { ContactLinks } from "@/components/Contact/ContactLinks";

import styles from "./ContactCard.module.css";

/**
 * FADE TO BLACK — the end card. Name, title, the four disciplines, the line
 * chosen by the visitor's last answer, and the ways to get in touch. It also
 * shows the route this visitor took, built from their choices.
 */
export function ContactCard() {
  const open = useStory((s) => s.contactOpen);
  const choices = useStory((s) => s.choices);
  const visited = useStory((s) => s.visitedScenes);
  const ended = useStory((s) => s.currentScene === "final");
  const first = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => first.current?.focus({ preventScroll: true }), 1200);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;
  const variant = (choices[finale.questionId] && finale.variants[choices[finale.questionId]]) || finale.fallback;
  const route = visited
    .filter((v) => v !== "studio" && v !== "final")
    .map((v) => sceneById[v]?.chapter.title)
    .filter(Boolean);
  const answers = Object.entries(choices)
    .map(([q, o]) => questions[q]?.options.find((x) => x.id === o)?.label)
    .filter(Boolean);

  return (
    <section className={styles.card} role="dialog" aria-modal="true" aria-labelledby="contact-name" data-ui-scroll>
      <div className={styles.inner}>
        <p className={styles.kicker}>{profile.disciplines.join(" · ")}</p>
        <h2 id="contact-name" className={styles.name}>
          {profile.first}
          <br />
          {profile.last}
        </h2>
        <p className={styles.title}>{profile.title}</p>
        <p className={styles.variant}>{variant.line}</p>
        <p className={styles.cta}>Let&apos;s make something.</p>

        <ContactLinks className={styles.links} firstRef={first} kinds={["email", "whatsapp", "resume", "phone", "linkedin"]} />

        {route.length > 0 && (
          <p className={styles.route}>
            Your cut: {answers.length ? `${answers.join(" → ")} · ` : ""}
            {route.join(" → ")}
          </p>
        )}

        <div className={styles.actions}>
          {!ended && (
            <button type="button" onClick={() => useStory.setState({ contactOpen: false })}>
              Back to the story
            </button>
          )}
          <button type="button" onClick={() => useStory.setState({ overlay: "quick" })}>
            Quick mode
          </button>
          <button type="button" onClick={restart}>
            Watch again
          </button>
        </div>
      </div>
    </section>
  );
}
