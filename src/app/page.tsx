import { ExperienceRoot } from "@/components/Experience/ExperienceRoot";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { asset } from "@/lib/assets";
import { emailHref, whatsappHref } from "@/lib/contact";

/**
 * Home: the interactive film. The static HTML carries a readable summary and
 * links for crawlers, no-JS visitors and screen readers; the 3D experience
 * mounts on top of it on the client. Plain links: nothing here should be
 * prefetched while the studio loads.
 */
export default function Home() {
  return (
    <>
      <a className="skip" href={asset("/quick/")}>
        Skip to Quick Mode — the whole portfolio on one page
      </a>
      <main id="main" className="sr-only">
        <h1>
          {profile.name} — {profile.title}
        </h1>
        <p>{profile.summary}</p>
        <h2>Work</h2>
        <ul>
          {projects.map((p) => (
            <li key={p.slug}>
              <a href={asset(`/work/${p.slug}/`)}>
                {p.title} — {p.role}, {p.format}
              </a>
            </li>
          ))}
        </ul>
        <p>
          <a href={asset("/quick/")}>Quick Mode</a> · <a href={asset("/resume/")}>Resume</a> · <a href={emailHref()}>{profile.contact.email}</a> ·{" "}
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
              <a href={asset("/quick/")} style={{ textDecoration: "underline" }}>
                Open Quick Mode
              </a>{" "}
              ·{" "}
              <a href={asset("/resume/")} style={{ textDecoration: "underline" }}>
                Resume
              </a>
            </p>
          </div>
        </div>
      </noscript>
      <ExperienceRoot />
    </>
  );
}
