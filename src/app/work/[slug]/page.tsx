import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { profile } from "@/data/profile";
import { getProject, projects, workOf } from "@/data/projects";
import { asset, tex } from "@/lib/assets";

import styles from "./work.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  return p ? { title: p.title, description: `${p.title} — ${p.role}, ${p.format}. ${p.logline}` } : {};
}

/**
 * A plain, shareable page per film (for links in emails and search), with a
 * way into the film on set in the experience.
 */
export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();
  return (
    <main className={styles.page}>
      <nav className={styles.bar}>
        <a href={asset("/quick/#qv-work")}>← All work</a>
        <a href={asset(`/#work-${workOf(p)}`)} className={styles.enter}>
          See it on set →
        </a>
      </nav>
      <header className={styles.head}>
        <p className={styles.kicker}>
          {p.number} · {p.format}
        </p>
        <h1 className={styles.title}>{p.title}</h1>
        <p className={styles.meta}>{[p.role, p.scale].filter(Boolean).join(" · ")}</p>
      </header>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.cover} src={asset(p.cover.src)} alt={p.cover.alt} />
      <dl className={styles.facts}>
        {p.facts.map((f) => (
          <div key={f.label}>
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>
      {p.sections.map((s) => (
        <section key={s.kind} className={styles.section}>
          <h2>{s.title}</h2>
          {s.body?.map((b) => (
            <p key={b}>{b}</p>
          ))}
          {s.media.length > 0 && (
            <ul className={styles.grid}>
              {s.media.map((m) => (
                <li key={m.src + m.label}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tex(m.src)} alt={m.alt} loading="lazy" />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
      {profile.assetsArePlaceholders && <p className={styles.note}>Images on this site are illustrations, not production stills.</p>}
    </main>
  );
}
