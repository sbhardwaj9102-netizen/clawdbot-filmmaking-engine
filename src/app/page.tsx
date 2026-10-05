import Link from "next/link";

import { ExperienceRoot } from "@/components/Experience/ExperienceRoot";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { emailHref, whatsappHref } from "@/lib/contact";

/**
 * Home: the interactive film. The static HTML carries a readable summary and
 * links for crawlers, no-JS visitors and screen readers; the 3D experience
 * mounts on top of it on the client.
 */
export default function Home() {
  return (
    <>
      <Link className="skip" href="/quick/">
        Skip to Quick Mode — the whole portfolio on one page
      </Link>
      <main id="main" className="sr-only">
        <h1>
          {profile.name} — {profile.title}
        </h1>
        <p>{profile.summary}</p>
        <h2>Work</h2>
        <ul>
          {projects.map((p) => (
            <li key={p.slug}>
              <Link href={`/work/${p.slug}/`}>
                {p.title} — {p.role}, {p.format}
              </Link>
            </li>
          ))}
        </ul>
        <p>
          <Link href="/quick/">Quick Mode</Link> · <Link href="/resume/">Resume</Link> · <a href={emailHref()}>{profile.contact.email}</a> ·{" "}
          <a href={whatsappHref()}>WhatsApp</a>
        </p>
      </main>
      <noscript>
        <div style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", background: "#050506", color: "#ece6da", textAlign: "center", padding: 24, zIndex: 100 }}>
          <div>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: 40, margin: 0 }}>{profile.name}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase" }}>{profile.title}</p>
            <p style={{ marginTop: 24 }}>
              The interactive experience needs JavaScript.{" "}
              <Link href="/quick/" style={{ textDecoration: "underline" }}>
                Open Quick Mode
              </Link>{" "}
              ·{" "}
              <Link href="/resume/" style={{ textDecoration: "underline" }}>
                Resume
              </Link>
            </p>
          </div>
        </div>
      </noscript>
      <ExperienceRoot />
    </>
  );
}
