import type { Metadata } from "next";

import { ResumeDocument } from "@/components/Resume/ResumeDocument";
import { profile } from "@/data/profile";
import { asset } from "@/lib/assets";

import styles from "./resume.module.css";

export const metadata: Metadata = {
  title: "Resume",
  description: `${profile.name} — ${profile.title}. Resume.`,
};

/** The resume as a printable page; `npm run resume:pdf` renders this to the downloadable PDF. */
export default function ResumePage() {
  return (
    <main className={styles.page}>
      <nav className={styles.bar} aria-label="Resume actions">
        <a href={asset("/")}>← The experience</a>
        <div>
          <a href={asset("/quick/")}>Quick mode</a>
          <a href={asset(profile.resumePdf)} download className={styles.download}>
            Download PDF
          </a>
        </div>
      </nav>
      <ResumeDocument />
    </main>
  );
}
