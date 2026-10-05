import { profile } from "@/data/profile";

import styles from "./ResumeDocument.module.css";

/**
 * The resume as a document — the same component is the file that opens on the
 * desk, the /resume page, and the source of the downloadable PDF.
 */
export function ResumeDocument() {
  const c = profile.contact;
  return (
    <article className={styles.doc} aria-label={`${profile.name} — resume`}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.name}>{profile.name}</h1>
          <p className={styles.title}>{profile.title}</p>
          <p className={styles.disc}>{profile.disciplines.join(" · ")}</p>
        </div>
        <ul className={styles.contact}>
          <li>
            <a href={`mailto:${c.email}`}>{c.email}</a>
          </li>
          <li>
            <a href={c.phoneHref}>{c.phone}</a>
          </li>
          {c.linkedin && (
            <li>
              <a href={c.linkedin}>{c.linkedin.replace(/^https?:\/\/(www\.)?/, "")}</a>
            </li>
          )}
          <li>{profile.base}</li>
        </ul>
      </header>

      <p className={styles.summary}>{profile.summary}</p>

      <section className={styles.block}>
        <h2>Experience</h2>
        {profile.experience.map((e) => (
          <div key={e.org} className={styles.item}>
            <div className={styles.itemHead}>
              <h3>{e.org}</h3>
              <span>
                {e.role} · {e.context}
              </span>
            </div>
            <ul>
              {e.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className={styles.block}>
        <h2>Academic projects</h2>
        {profile.academicProjects.map((a) => (
          <div key={a.title} className={styles.item}>
            <div className={styles.itemHead}>
              <h3>{a.title}</h3>
              <span>{a.context}</span>
            </div>
            <ul>
              {a.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className={styles.block}>
        <h2>Education</h2>
        {profile.education.map((e) => (
          <div key={e.school} className={styles.edu}>
            <h3>{e.degree}</h3>
            <span>
              {e.school}
              {e.when ? ` · ${e.when}` : ""}
              {e.note ? ` · ${e.note}` : ""}
            </span>
          </div>
        ))}
      </section>

      <section className={`${styles.block} ${styles.split}`}>
        <div>
          <h2>Skills</h2>
          <p className={styles.inline}>{profile.skills.join(" · ")}</p>
        </div>
        <div>
          <h2>Tools</h2>
          <p className={styles.inline}>{profile.tools.map((t) => t.name).join(" · ")}</p>
        </div>
      </section>
    </article>
  );
}
