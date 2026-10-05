import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { arihant, ibr } from "@/data/worlds/business";
import { events } from "@/data/worlds/events";
import { asset, tex } from "@/lib/assets";

import styles from "./QuickMode.module.css";

/**
 * QUICK MODE — the whole portfolio on one clean page, for people with two
 * minutes. Shared by the in-experience overlay and the static /quick route.
 * `onEnter(scene)` (overlay) jumps into the world; without it, links go to /?go=…
 */
export function QuickMode({
  onClose,
  onEnter,
  noExperience = false,
}: {
  onClose?: () => void;
  onEnter?: (scene: string) => void;
  /** This device can't run WebGL: hide links into the 3D experience. */
  noExperience?: boolean;
}) {
  const enterHref = (scene: string) => asset(`/?go=${scene}`);
  const EnterLink = ({ scene, children }: { scene: string; children: React.ReactNode }) =>
    onEnter ? (
      <button type="button" className={styles.enter} onClick={() => onEnter(scene)}>
        {children}
      </button>
    ) : (
      <a className={styles.enter} href={enterHref(scene)}>
        {children}
      </a>
    );

  return (
    <div className={styles.quick}>
      <header className={styles.top}>
        <span className={styles.mark}>Quick mode</span>
        <nav className={styles.nav} aria-label="Sections">
          <a href="#work">Work</a>
          <a href="#experience">Experience</a>
          <a href="#capabilities">Capabilities</a>
          <a href="#about">About</a>
          <a href="#resume">Resume</a>
          <a href="#contact">Contact</a>
        </nav>
        {noExperience ? (
          <span />
        ) : onClose ? (
          <button type="button" className={styles.back} onClick={onClose}>
            Back to the experience →
          </button>
        ) : (
          <a className={styles.back} href={asset("/")}>
            Enter the experience →
          </a>
        )}
      </header>

      <section className={styles.hero} aria-labelledby="qm-name">
        <p className={styles.kicker}>{profile.disciplines.join(" · ")}</p>
        <h1 id="qm-name" className={styles.name}>
          {profile.name}
        </h1>
        <p className={styles.role}>{profile.title}</p>
        <p className={styles.lede}>{profile.summary}</p>
        <div className={styles.cta}>
          <a href={asset(profile.resumePdf)} download className={styles.primary}>
            Download resume (PDF)
          </a>
          <a href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a>
          {profile.contact.linkedin && (
            <a href={profile.contact.linkedin} target="_blank" rel="noreferrer">
              LinkedIn ↗
            </a>
          )}
          <span>{profile.base}</span>
        </div>
      </section>

      <section id="work" className={styles.section} aria-labelledby="qm-work">
        <h2 id="qm-work" className={styles.h2}>
          <span>01</span> Work
        </h2>
        <ol className={styles.films}>
          {projects.map((p) => {
            const stills = p.sections.flatMap((s) => s.media).slice(0, 3);
            return (
              <li key={p.slug} className={styles.film}>
                <div className={styles.filmText}>
                  <p className={styles.num}>{p.number}</p>
                  <h3 className={styles.filmTitle}>{p.title}</h3>
                  <p className={styles.meta}>{[p.role, p.format, p.scale].filter(Boolean).join(" · ")}</p>
                  {p.sections[0]?.body?.[0] && <p className={styles.body}>{p.sections[0].body[0]}</p>}
                  {p.status && <p className={styles.status}>{p.status}</p>}
                  <div className={styles.links}>
                    {!noExperience && <EnterLink scene={p.scene}>Enter the film&apos;s world →</EnterLink>}
                    <a href={asset(`/work/${p.slug}/`)}>Project page</a>
                  </div>
                </div>
                <div className={styles.strip}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tex(p.cover.src)} alt={p.cover.alt} loading="lazy" className={styles.cover} />
                  {stills.slice(0, 2).map((m) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={m.src} src={tex(m.src)} alt={m.alt} loading="lazy" />
                  ))}
                </div>
              </li>
            );
          })}
        </ol>

        <div className={styles.twoCol}>
          <div>
            <h3 className={styles.h3}>Live events</h3>
            <p className={styles.metaDark}>
              {events.org} · {events.place}
            </p>
            <p className={styles.body}>{events.summary}</p>
            <ul className={styles.bullets}>
              {events.pillars.map((p) => (
                <li key={p.id}>{p.body}</li>
              ))}
            </ul>
            <p className={styles.status}>{events.note}</p>
            {!noExperience && (
              <div className={styles.links}>
                <EnterLink scene="events">Enter the venue →</EnterLink>
              </div>
            )}
          </div>
          <div>
            <h3 className={styles.h3}>Academic projects</h3>
            {[arihant, ibr].map((a) => (
              <div key={a.title} className={styles.academic}>
                <p className={styles.metaDark}>{a.context}</p>
                <p className={styles.academicTitle}>{a.title}</p>
                <p className={styles.body}>{a.summary}</p>
              </div>
            ))}
            <p className={styles.status}>Academic projects — not paid employment or consulting.</p>
          </div>
        </div>
      </section>

      <section id="experience" className={styles.section} aria-labelledby="qm-exp">
        <h2 id="qm-exp" className={styles.h2}>
          <span>02</span> Experience
        </h2>
        <ol className={styles.rows}>
          {profile.experience.map((e) => (
            <li key={e.org} className={styles.row}>
              <div>
                <p className={styles.rowTitle}>{e.org}</p>
                <p className={styles.metaDark}>
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
      </section>

      <section id="capabilities" className={styles.section} aria-labelledby="qm-cap">
        <h2 id="qm-cap" className={styles.h2}>
          <span>03</span> Capabilities
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

      <section id="about" className={styles.section} aria-labelledby="qm-about">
        <h2 id="qm-about" className={styles.h2}>
          <span>04</span> About
        </h2>
        <div className={styles.twoCol}>
          <p className={styles.aboutText}>{profile.summary}</p>
          <ol className={styles.rows}>
            {profile.education.map((e) => (
              <li key={e.school} className={styles.edu}>
                <p className={styles.rowTitle}>{e.degree}</p>
                <p className={styles.metaDark}>
                  {e.school}
                  {e.when ? ` · ${e.when}` : ""}
                  {e.note ? ` · ${e.note}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="resume" className={styles.section} aria-labelledby="qm-resume">
        <h2 id="qm-resume" className={styles.h2}>
          <span>05</span> Resume
        </h2>
        <div className={styles.cta}>
          <a href={asset(profile.resumePdf)} download className={styles.primary}>
            Download resume (PDF)
          </a>
          <a href={asset("/resume/")}>View as a page</a>
        </div>
      </section>

      <section id="contact" className={styles.section} aria-labelledby="qm-contact">
        <h2 id="qm-contact" className={styles.h2}>
          <span>06</span> Contact
        </h2>
        <p className={styles.closing}>Let&apos;s make something.</p>
        <dl className={styles.contact}>
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a>
            </dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>
              <a href={profile.contact.phoneHref}>{profile.contact.phone}</a>
            </dd>
          </div>
          {profile.contact.linkedin && (
            <div>
              <dt>LinkedIn</dt>
              <dd>
                <a href={profile.contact.linkedin} target="_blank" rel="noreferrer">
                  Profile ↗
                </a>
              </dd>
            </div>
          )}
          <div>
            <dt>Based in</dt>
            <dd>{profile.base}</dd>
          </div>
        </dl>
      </section>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} {profile.name}</span>
        {profile.assetsArePlaceholders && <span>Images and reel on this site are placeholders pending production stills.</span>}
      </footer>
    </div>
  );
}
