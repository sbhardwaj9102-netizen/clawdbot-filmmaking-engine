import { Line } from "@/components/motion/Line";
import { MaskText } from "@/components/motion/MaskText";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { Reveal } from "@/components/motion/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { site } from "@/data/site";
import styles from "./About.module.css";

/** A bone-paper editorial page between two dark scenes. The nav flips to ink here. */
export function About() {
  const { about, name } = site;
  return (
    <section id="about" className={styles.about} data-theme="light" aria-labelledby="about-title">
      <div className={styles.grid}>
        <div className={styles.labelRow}>
          <SectionLabel index="04" className={styles.label}>
            About
          </SectionLabel>
        </div>

        <div className={styles.portraitCol}>
          <ParallaxImage asset={about.portrait} className={styles.portrait} speed={0.08} />
          <Reveal className={`${styles.caption} label`} y={10}>
            <span>Portrait</span>
            <span>Placeholder</span>
          </Reveal>
        </div>

        <div className={styles.textCol}>
          <MaskText
            as="h2"
            lines={[name.first, name.last]}
            className={`${styles.name} display`}
          />
          <span id="about-title" className="sr-only">
            About Satyam Bhardwaj
          </span>
          <Reveal as="p" className={`${styles.bio} serif`} delay={0.2}>
            {about.bio}
          </Reveal>

          <div className={styles.edu}>
            <Reveal className={`${styles.eduHead} label`} y={10}>
              <span>Education</span>
              <span>{String(about.education.length).padStart(2, "0")}</span>
            </Reveal>
            <ul>
              {about.education.map((e, i) => (
                <li key={e.school} className={styles.eduItem}>
                  <Line delay={i * 0.12} />
                  <Reveal className={styles.eduRow} y={16} delay={i * 0.12 + 0.1}>
                    <span className={`${styles.school} display`}>{e.school}</span>
                    <span className={styles.degree}>{e.degree}</span>
                    <span className={`${styles.note} label`}>{e.note}</span>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
