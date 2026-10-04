import { MaskText } from "@/components/motion/MaskText";
import { Reveal } from "@/components/motion/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { projects } from "@/data/projects";
import { site } from "@/data/site";
import { ProjectCard } from "./ProjectCard";
import styles from "./SelectedWork.module.css";

/**
 * The first two projects run full-width; any further projects pair up as tall,
 * staggered cards. Add projects in data/projects.ts — the layout adapts.
 */
export function SelectedWork() {
  const featured = projects.slice(0, 2);
  const rest = projects.slice(2);

  return (
    <section id="work" className={styles.work} aria-labelledby="work-title">
      <header className={styles.header}>
        <SectionLabel index="01">Selected work</SectionLabel>
        <MaskText as="h2" lines={["SELECTED", "WORK"]} className={`${styles.title} display`} lineClassNames={[undefined, styles.indent]} />
        <div className={styles.aside}>
          <Reveal as="p" className={`${styles.intro} serif`} delay={0.2}>
            {site.work.intro}
          </Reveal>
          <Reveal className={`${styles.count} label`} delay={0.35}>
            <span>{String(projects.length).padStart(2, "0")} Projects</span>
            <span>Film / Production</span>
          </Reveal>
        </div>
      </header>
      <span id="work-title" className="sr-only">
        Selected work
      </span>

      <div className={styles.featured}>
        {featured.map((p) => (
          <ProjectCard key={p.slug} project={p} variant="wide" />
        ))}
      </div>

      <div className={styles.pairs}>
        {rest.map((p) => (
          <ProjectCard key={p.slug} project={p} variant="tall" className={styles.pairCard} />
        ))}
      </div>
    </section>
  );
}
