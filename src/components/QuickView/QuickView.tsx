import { ContactLinks } from "@/components/Contact/ContactLinks";
import { profile } from "@/data/profile";
import { projects, workOf } from "@/data/projects";
import { arihant, ibr } from "@/data/worlds/business";
import { events } from "@/data/worlds/events";
import { asset, tex } from "@/lib/assets";
import { emailHref, whatsappHref } from "@/lib/contact";

import styles from "./QuickView.module.css";

/**
 * QUICK VIEW — everything on one plain page, for anyone with two minutes and
 * no interest in a film: about, selected work, resume, skills, education,
 * contact. The same component is the in-experience overlay and the static
 * /quick page. `onClose` (overlay) closes back to the experience; `onWork`
 * (overlay) shows a project on set.
 */
export function QuickView({
  onClose,
  onWork,
  noExperience = false,
}: {
  onClose?: () => void;
  onWork?: (work: "aster" | "purple" | "live" | "more") => void;
  /** The device can't run the 3D experience: don't link into it. */
  noExperience?: boolean;
}) {
  const work = [
    ...projects.slice(0, 2).map((p) => ({
      key: p.slug,
      work: workOf(p),
      title: p.title,
      meta: [p.role, p.format].join(" · "),
      facts: p.scale,
      body: profile.experience.find((e) => e.org === p.title)?.points[0] ?? p.logline,
      cover: p.cover,
      page: `/work/${p.slug}/`,
    })),
    {
      key: "events",
      work: "live" as const,
      title: "Weddings & live events",
      meta: `${events.role} · Family business`,
      facts: `${events.org}, ${events.place}`,
      body: events.summary,
      cover: events.venue[2],
      page: "",
    },
    ...projects.slice(2).map((p) => ({
      key: p.slug,
      work: workOf(p),
      title: p.title,
      meta: [p.role, p.format].join(" · "),
      facts: "",
      body: "",
      cover: p.cover,
      page: `/work/${p.slug}/`,
    })),
  ];

  return (
    <div className={styles.quick}>
      <header className={styles.top}>
        <span className={styles.mark}>Quick view</span>
        <nav className={styles.nav} aria-label="Sections">
          <a href="#qv-about">About</a>
          <a href="#qv-work">Work</a>
          <a href="#qv-resume">Resume</a>
          <a href="#qv-skills">Skills</a>
          <a href="#qv-education">Education</a>
          <a href="#qv-contact">Contact</a>
        </nav>
        {onClose ? (
          <button type="button" className={styles.back} onClick={onClose} data-action="close-quick">
            Back to the experience
          </button>
        ) : noExperience ? (
          <span />
        ) : (
          <a className={styles.back} href={asset("/")}>
            Watch the 2-minute film
          </a>
        )}
      </header>

      <section className={styles.hero} aria-labelledby="qv-name">
        <p className={styles.kicker}>{profile.disciplines.join(" · ")}</p>
        <h1 id="qv-name" className={styles.name}>
          {profile.name}
        </h1>
        <p className={styles.role}>{profile.title}</p>
        <p className={styles.lede}>
          Producer trained at Whistling Woods International. Produced the short film ASTER (seven locations, four shoot days) and worked on production
          for Death at the House of Purple (four constructed sets, a controlled hut-fire sequence). Runs weddings and live events in the family
          business. Now studying global finance at SP Jain — building the business side of production, toward a production company of his own.
        </p>
        <div className={styles.cta}>
          <a href={asset(profile.resumePdf)} download className={styles.primary}>
            Download resume (PDF)
          </a>
          <a href={emailHref()}>{profile.contact.email}</a>
          <a href={whatsappHref()} target="_blank" rel="noopener noreferrer">
            WhatsApp ↗
          </a>
          {profile.contact.linkedin && (
            <a href={profile.contact.linkedin} target="_blank" rel="noreferrer">
              LinkedIn ↗
            </a>
          )}
        </div>
      </section>

      <section id="qv-about" className={styles.section} aria-labelledby="qv-about-h">
        <h2 id="qv-about-h" className={styles.h2}>
          About
        </h2>
        <div className={styles.twoCol}>
          <p className={styles.body}>
            A producer who understands both sides of production: the schedule, the crew and the set, and the budget, the market and the analysis
            behind them. Started in journalism, trained in producing, learned operations on live events, and is now adding global business and
            finance. The long-term aim is a production company where the creative work and the business are planned together.
          </p>
          <ol className={styles.path}>
            <li>
              <b>Journalism</b> Amity University Kolkata · 2018–2021
            </li>
            <li>
              <b>Filmmaking</b> Whistling Woods International · MA Producing
            </li>
            <li>
              <b>Production</b> ASTER · House of Purple · RANA · GLUTTONY · live events
            </li>
            <li>
              <b>Business & finance</b> SP Jain School of Global Management · current
            </li>
          </ol>
        </div>
      </section>

      <section id="qv-work" className={styles.section} aria-labelledby="qv-work-h">
        <h2 id="qv-work-h" className={styles.h2}>
          Selected work
        </h2>
        <ul className={styles.work}>
          {work.map((w) => (
            <li key={w.key} className={styles.card}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tex(w.cover.src)} alt={w.cover.alt} loading="lazy" />
              <div className={styles.cardText}>
                <h3 className={styles.cardTitle}>{w.title}</h3>
                <p className={styles.meta}>{w.meta}</p>
                {w.facts && <p className={styles.facts}>{w.facts}</p>}
                {w.body && <p className={styles.cardBody}>{w.body}</p>}
                <div className={styles.links}>
                  {w.page && <a href={asset(w.page)}>Project page</a>}
                  {onWork && !noExperience && (
                    <button type="button" onClick={() => onWork(w.work)}>
                      See it on set
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="qv-resume" className={styles.section} aria-labelledby="qv-resume-h">
        <h2 id="qv-resume-h" className={styles.h2}>
          Resume
        </h2>
        <ol className={styles.rows}>
          {profile.experience.map((e) => (
            <li key={e.org} className={styles.row}>
              <div>
                <p className={styles.rowTitle}>{e.org}</p>
                <p className={styles.meta}>
                  {e.role} · {e.context}
                </p>
              </div>
              <ul className={styles.bullets}>
                {e.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <div className={styles.cta}>
          <a href={asset(profile.resumePdf)} download className={styles.primary}>
            Download resume (PDF)
          </a>
          <a href={asset("/resume/")}>View as a page</a>
        </div>
      </section>

      <section id="qv-skills" className={styles.section} aria-labelledby="qv-skills-h">
        <h2 id="qv-skills-h" className={styles.h2}>
          Skills
        </h2>
        <div className={styles.caps}>
          {profile.capabilities.map((c) => (
            <div key={c.group}>
              <h3 className={styles.h3}>{c.group}</h3>
              <ul className={styles.plain}>
                {c.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className={styles.h3}>Tools</h3>
            <ul className={styles.plain}>
              {profile.tools.map((t) => (
                <li key={t.name}>
                  {t.name} <em>— {t.note}</em>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="qv-education" className={styles.section} aria-labelledby="qv-education-h">
        <h2 id="qv-education-h" className={styles.h2}>
          Education
        </h2>
        <ol className={styles.rows}>
          {profile.education.map((e) => (
            <li key={e.school} className={styles.row}>
              <div>
                <p className={styles.rowTitle}>{e.degree}</p>
                <p className={styles.meta}>
                  {e.school}
                  {e.when ? ` · ${e.when}` : ""}
                  {e.note ? ` · ${e.note}` : ""}
                </p>
              </div>
            </li>
          ))}
          {[arihant, ibr].map((a) => (
            <li key={a.title} className={styles.row}>
              <div>
                <p className={styles.rowTitle}>{a.title}</p>
                <p className={styles.meta}>{a.context}</p>
              </div>
              <p className={styles.body}>{a.summary}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="qv-contact" className={styles.section} aria-labelledby="qv-contact-h">
        <h2 id="qv-contact-h" className={styles.h2}>
          Contact
        </h2>
        <p className={styles.closing}>Let&apos;s talk.</p>
        <ContactLinks className={styles.contact} itemClassName={styles.contactItem} />
      </section>

      <footer className={styles.footer}>
        <span>
          © {new Date().getFullYear()} {profile.name} · {profile.base}
        </span>
        {profile.assetsArePlaceholders && <span>Images on this site are illustrations, not production stills.</span>}
      </footer>
    </div>
  );
}
