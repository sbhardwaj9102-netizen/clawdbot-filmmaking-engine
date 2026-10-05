import type { Metadata } from "next";
import Link from "next/link";

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
        <Link href="/">← The experience</Link>
        <div>
          <Link href="/quick/">Quick mode</Link>
          <a href={asset(profile.resumePdf)} download className={styles.download}>
            Download PDF
          </a>
        </div>
      </nav>
      <ResumeDocument />
    </main>
  );
}
