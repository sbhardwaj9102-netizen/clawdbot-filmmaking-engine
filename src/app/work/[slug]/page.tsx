import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProject, projects } from "@/data/projects";
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
 * A plain, shareable page per film (for links in emails and search), with the
 * way back into the film's world in the experience.
 */
export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();
  return (
    <main className={styles.page}>
      <nav className={styles.bar}>
        <Link href="/quick/#work">← All work</Link>
        <a href={asset(`/?go=${p.scene}`)} className={styles.enter}>
          Enter {p.title.length > 16 ? "the film" : p.title}&apos;s world →
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
    </main>
  );
}
