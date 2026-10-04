import { Reveal } from "@/components/motion/Reveal";
import styles from "./ui.module.css";

/** "(02) — Production" style index label used to open every section. */
export function SectionLabel({ index, children, className }: { index: string; children: React.ReactNode; className?: string }) {
  return (
    <Reveal className={`${styles.sectionLabel} label ${className ?? ""}`} y={12}>
      <span className={styles.sectionIndex}>({index})</span>
      <span className={styles.sectionRule} />
      <span>{children}</span>
    </Reveal>
  );
}
