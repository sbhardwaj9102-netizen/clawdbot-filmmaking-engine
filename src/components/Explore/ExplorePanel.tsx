"use client";

import { useEffect, useRef } from "react";

import { ContactLinks } from "@/components/Contact/ContactLinks";
import { Arrow } from "@/components/UI/Icons";
import { profile } from "@/data/profile";
import { aster } from "@/data/projects/aster";
import { gluttony } from "@/data/projects/gluttony";
import { purple } from "@/data/projects/purple";
import { rana } from "@/data/projects/rana";
import { type SectionId, type WorkId, workItems } from "@/data/story";
import type { Media } from "@/data/types";
import { arihant, ibr } from "@/data/worlds/business";
import { events } from "@/data/worlds/events";
import { asset, tex } from "@/lib/assets";
import { rt } from "@/systems/Experience/runtime";
import { setExperience, useExperience } from "@/systems/Experience/store";
import { goExplore } from "@/systems/Experience/tour";

import styles from "./ExplorePanel.module.css";

/**
 * EXPLORE — the same story without the film: four sections over the same two
 * rooms. The camera moves to the room each section is about; the panel holds
 * the facts. On wide screens it sits on the right (the camera reframes to
 * the left of it); on phones it is a sheet along the bottom.
 */
export function ExplorePanel() {
  const mode = useExperience((s) => s.mode);
  const section = useExperience((s) => s.section);
  const work = useExperience((s) => s.work);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || mode !== "explore") {
      rt.view.panel = 0;
      rt.view.sheet = 0;
      return;
    }
    const measure = () => {
      const side = window.innerWidth >= 1024 && window.innerHeight < window.innerWidth * 1.05;
      const r = el.getBoundingClientRect();
      rt.view.panel = side ? r.width : 0;
      rt.view.sheet = side ? 0 : Math.max(0, window.innerHeight - r.top);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      rt.view.panel = 0;
      rt.view.sheet = 0;
    };
  }, [mode]);

  // a new section starts at the top
  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [section, work]);

  if (mode !== "explore") return null;
  return (
    <aside ref={ref} className={styles.panel} aria-labelledby="explore-title" data-ui-scroll>
      <div className={styles.inner} key={`${section}:${section === "work" ? work : ""}`}>
        {section === "about" && <About />}
        {section === "work" && <Work work={work} />}
        {section === "strategy" && <Strategy />}
        {section === "contact" && <Contact />}
      </div>
    </aside>
  );
}

function Next({ to, label, work }: { to: SectionId; label: string; work?: WorkId }) {
  return (
    <button type="button" className={styles.next} onClick={() => goExplore(to, work)}>
      <span>{label}</span>
      <Arrow />
    </button>
  );
}

function About() {
  const path = [
    { k: "Journalism", v: "BA Journalism & Mass Communication — Amity University Kolkata", when: "2018–2021" },
    { k: "Filmmaking", v: "MA Filmmaking (Producing) — Whistling Woods International", when: "CGPA 8.5" },
    { k: "Production", v: "ASTER · Death at the House of Purple · RANA · GLUTTONY; weddings and live events in the family business" },
    { k: "Business & finance", v: "Master of Global Business (Global Finance) — SP Jain School of Global Management", when: "Current" },
    { k: "Next", v: "A production company of his own" },
  ];
  return (
    <>
      <p className={`label ${styles.kicker}`}>About</p>
      <h2 id="explore-title" className={styles.title}>
        {profile.name}
      </h2>
      <p className={styles.role}>{profile.title}</p>
      <p className={styles.lead}>
        A producer trained at Whistling Woods International, with film production and live event operations behind him — now studying global
        finance at SP Jain, to run the business of production as well as the set.
      </p>
      <h3 className={styles.h3}>The path</h3>
      <ol className={styles.path}>
        {path.map((p) => (
          <li key={p.k}>
            <p className={styles.pathK}>{p.k}</p>
            <p className={styles.pathV}>{p.v}</p>
            {p.when && <p className={styles.pathWhen}>{p.when}</p>}
          </li>
        ))}
      </ol>
      <div className={styles.actions}>
        <button type="button" className="btn btn-primary" onClick={() => setExperience({ overlay: "resume" })}>
          Resume
        </button>
        <button type="button" className="btn" onClick={() => goExplore("contact")}>
          Contact
        </button>
      </div>
      <Next to="work" work="aster" label="The work" />
    </>
  );
}

function Gallery({ items }: { items: Media[] }) {
  return (
    <ul className={styles.gallery}>
      {items.map((m, i) => (
        <li key={m.src + i}>
          <button type="button" onClick={() => setExperience({ lightbox: { items, index: i } })} aria-label={`View image: ${m.alt}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tex(m.src)} alt="" loading="lazy" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function Work({ work }: { work: WorkId }) {
  const all = (p: typeof aster) => p.sections.flatMap((s) => s.media);
  return (
    <>
      <p className={`label ${styles.kicker}`}>Work</p>
      <div className={styles.tabs} role="tablist" aria-label="Projects">
        {workItems.map((w) => (
          <button key={w.id} type="button" role="tab" aria-selected={work === w.id} className={styles.tab} onClick={() => goExplore("work", w.id)} data-work={w.id}>
            {w.label}
          </button>
        ))}
      </div>

      {work === "aster" && (
        <article>
          <h2 id="explore-title" className={styles.title}>
            ASTER
          </h2>
          <p className={styles.role}>Producer · Short film</p>
          <dl className={styles.stats}>
            <div>
              <dd>07</dd>
              <dt>Locations</dt>
            </div>
            <div>
              <dd>04</dd>
              <dt>Shoot days</dt>
            </div>
          </dl>
          <ul className={styles.points}>
            {profile.experience[0].points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <Gallery items={all(aster).filter((m, i, a) => a.findIndex((x) => x.src === m.src) === i).slice(0, 9)} />
          <a className={styles.page} href={asset("/work/aster/")}>
            Project page <Arrow />
          </a>
        </article>
      )}

      {work === "purple" && (
        <article>
          <h2 id="explore-title" className={styles.title}>
            Death at the House of Purple
          </h2>
          <p className={styles.role}>Production · Film</p>
          <dl className={styles.stats}>
            <div>
              <dd>04</dd>
              <dt>Constructed sets</dt>
            </div>
            <div>
              <dd className={styles.word}>Fire</dd>
              <dt>Controlled hut-fire sequence</dt>
            </div>
          </dl>
          <ul className={styles.points}>
            {profile.experience[1].points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <Gallery items={all(purple).filter((m, i, a) => a.findIndex((x) => x.src === m.src) === i).slice(0, 9)} />
          <a className={styles.page} href={asset("/work/death-at-the-house-of-purple/")}>
            Project page <Arrow />
          </a>
        </article>
      )}

      {work === "live" && (
        <article>
          <h2 id="explore-title" className={styles.title}>
            Weddings and live events
          </h2>
          <p className={styles.role}>
            {events.role} · {events.org}, {events.place}
          </p>
          <ul className={styles.points}>
            {profile.experience[3].points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <Gallery items={[...events.venue, ...events.pillars.flatMap((p) => p.media)].filter((m, i, a) => a.findIndex((x) => x.src === m.src) === i).slice(0, 9)} />
          <p className={styles.note}>{events.note}</p>
        </article>
      )}

      {work === "more" && (
        <article>
          <h2 id="explore-title" className={styles.title}>
            RANA · GLUTTONY
          </h2>
          <p className={styles.role}>Film production</p>
          {[rana, gluttony].map((p) => (
            <div key={p.slug} className={styles.film}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tex(p.cover.src)} alt={p.cover.alt} loading="lazy" />
              <div>
                <p className={styles.filmTitle}>{p.title}</p>
                <p className={styles.filmRole}>
                  {p.role} · {p.format}
                </p>
                <a className={styles.page} href={asset(`/work/${p.slug}/`)}>
                  Project page <Arrow />
                </a>
              </div>
            </div>
          ))}
        </article>
      )}

      {profile.assetsArePlaceholders && <p className={styles.note}>Images on this site are illustrations, not production stills.</p>}
      <Next to="strategy" label="Strategy" />
    </>
  );
}

function Strategy() {
  return (
    <>
      <p className={`label ${styles.kicker}`}>Strategy</p>
      <h2 id="explore-title" className={styles.title}>
        Why finance
      </h2>
      <p className={styles.lead}>
        Every shoot day has a schedule, a crew and a cost. Studying finance is the same work taken one step further: understanding cost, operations
        and business well enough to build a production company.
      </p>
      <ol className={styles.chain}>
        {["Production", "Cost", "Operations", "Business", "Finance"].map((w, i) => (
          <li key={w}>
            {i > 0 && <span aria-hidden>→</span>}
            {w}
          </li>
        ))}
      </ol>

      <h3 className={styles.h3}>Education</h3>
      <ul className={styles.cards}>
        {profile.education.map((e) => (
          <li key={e.school}>
            <p className={styles.cardTitle}>{e.degree}</p>
            <p className={styles.cardMeta}>
              {e.school}
              {e.when ? ` · ${e.when}` : ""}
              {e.note ? ` · ${e.note}` : ""}
            </p>
          </li>
        ))}
      </ul>

      <h3 className={styles.h3}>Academic work</h3>
      <ul className={styles.cards}>
        {[arihant, ibr].map((a) => (
          <li key={a.title}>
            <p className={styles.cardTitle}>{a.title}</p>
            <p className={styles.cardBody}>{a.summary}</p>
            <p className={styles.cardMeta}>{a.note}</p>
          </li>
        ))}
      </ul>

      <h3 className={styles.h3}>Capabilities</h3>
      <div className={styles.caps}>
        {profile.capabilities.map((c) => (
          <div key={c.group}>
            <p className={styles.capGroup}>{c.group}</p>
            <ul>
              {c.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className={styles.capGroup}>Tools</p>
          <ul>
            {profile.tools.map((t) => (
              <li key={t.name}>{t.name}</li>
            ))}
          </ul>
        </div>
      </div>

      <h3 className={styles.h3}>The ambition</h3>
      <p className={styles.lead}>A production company of his own — where the creative work and the business behind it are planned together.</p>
      <Next to="contact" label="Contact" />
    </>
  );
}

function Contact() {
  return (
    <>
      <p className={`label ${styles.kicker}`}>Contact</p>
      <h2 id="explore-title" className={styles.title}>
        Let&apos;s talk.
      </h2>
      <p className={styles.lead}>
        {profile.title} · {profile.base}
      </p>
      <ContactLinks className={styles.contact} itemClassName={styles.contactItem} />
      <div className={styles.actions}>
        <button type="button" className="btn" onClick={() => setExperience({ overlay: "quick" })}>
          Quick view
        </button>
      </div>
    </>
  );
}
