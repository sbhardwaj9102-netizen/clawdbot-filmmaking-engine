import type { Project } from "@/lib/types";
import { Blocks } from "./Blocks";
import { CaseHero } from "./CaseHero";
import { CaseIntro } from "./CaseIntro";
import { NextProject } from "./NextProject";

/** One template for every project. What appears is decided by `project.blocks`. */
export function CaseStudy({ project, next }: { project: Project; next: Project }) {
  return (
    <main id="main" style={project.accent ? ({ "--accent": project.accent } as React.CSSProperties) : undefined}>
      <CaseHero project={project} />
      <CaseIntro project={project} />
      <Blocks blocks={project.blocks} />
      <NextProject project={next} />
    </main>
  );
}
