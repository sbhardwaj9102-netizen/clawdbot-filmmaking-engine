import type { Fact, Media } from "../types";

/**
 * A project section becomes a physical station inside the project's world
 * (a map table, a stripboard, a wall of photographs…). Only sections that have
 * real content are listed — the world builds itself from whatever is here.
 */
export type SectionKind =
  | "production"
  | "story"
  | "locations"
  | "schedule"
  | "crew"
  | "sets"
  | "fire"
  | "bts"
  | "stills"
  | "video";

export type ProjectSection = {
  kind: SectionKind;
  title: string;
  kicker?: string;
  body?: string[];
  facts?: Fact[];
  media: Media[];
};

export type ProjectTheme = "aster" | "purple" | "rana" | "gluttony";

export type Project = {
  /** URL slug — /work/<slug> */
  slug: string;
  /** Story scene id for the project's world. */
  scene: "aster" | "purple" | "rana" | "gluttony";
  number: string;
  title: string;
  titleLines?: string[];
  role: string;
  format: string;
  /** Short scale line, e.g. "7 locations · 4 shoot days". */
  scale?: string;
  logline: string;
  cover: Media;
  accent: string;
  theme: ProjectTheme;
  facts: Fact[];
  sections: ProjectSection[];
  /** Shown when a case study is still being prepared. */
  status?: string;
};
