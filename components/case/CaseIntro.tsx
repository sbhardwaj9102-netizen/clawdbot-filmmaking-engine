import { Line } from "@/components/motion/Line";
import { Reveal } from "@/components/motion/Reveal";
import type { Project } from "@/lib/types";
import styles from "./case.module.css";

/** Credits-style fact sheet under the hero. */
export function CaseIntro({ project }: { project: Project }) {
  const facts = project.facts ?? [{ label: "Role", value: project.role }];
  return (
    <section className={styles.intro}>
      <dl className={styles.facts}>
        {facts.map((f, i) => (
          <div key={f.label} className={styles.fact}>
            <Line delay={i * 0.1} />
            <Reveal className={styles.factRow} y={12} delay={0.1 + i * 0.1}>
              <dt className="label">{f.label}</dt>
              <dd className="display">{f.value}</dd>
            </Reveal>
          </div>
        ))}
      </dl>
    </section>
  );
}
