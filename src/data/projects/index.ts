import { aster } from "./aster";
import { gluttony } from "./gluttony";
import { purple } from "./purple";
import { rana } from "./rana";
import type { Project } from "./types";

export type { Project, ProjectSection, SectionKind } from "./types";

/**
 * PROJECTS — add a film by adding a file next to these and listing it here.
 * Its world, its monitor in the film set, its Quick Mode entry and its
 * /work/<slug> page are all generated from the object.
 */
export const projects: Project[] = [aster, purple, rana, gluttony];

export const getProject = (key: string) => projects.find((p) => p.slug === key || p.scene === key);

/** Where a film lives in Explore → Work (RANA and GLUTTONY share a page). */
export const workOf = (p: Project) => (p.scene === "aster" ? "aster" : p.scene === "purple" ? "purple" : "more") as "aster" | "purple" | "more";
