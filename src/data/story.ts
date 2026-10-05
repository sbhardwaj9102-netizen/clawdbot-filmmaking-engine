import type { Media } from "./types";

/**
 * THE STORY
 * ------------------------------------------------------------------
 * A short film in two rooms: THE PRODUCER, then THE STRATEGIST.
 * Everything the visitor reads or hears comes from here; the tour
 * controller plays these chapters in order and every room, camera
 * and sound reads the current chapter. Facts only from profile.ts
 * and the project files.
 */

export type ChapterId =
  | "intro"
  | "who"
  | "job"
  | "aster"
  | "purple"
  | "live"
  | "shift"
  | "strategist"
  | "finance"
  | "combination"
  | "future";

export type SectionId = "about" | "work" | "strategy" | "contact";
export type WorkId = "aster" | "purple" | "live" | "more";

/** Camera set-ups, defined in systems/Experience/shots.ts. */
export type ShotId =
  | "landing"
  | "establish"
  | "satyam"
  | "set"
  | "aster"
  | "purple"
  | "live"
  | "shift"
  | "strategist"
  | "finance"
  | "wide"
  | "future"
  | "end"
  | "explore-about"
  | "explore-aster"
  | "explore-purple"
  | "explore-live"
  | "explore-more"
  | "explore-strategy"
  | "explore-contact";

/** One thing to read on screen. Short: each should land in 2–4 seconds. */
export type Caption = {
  /** Seconds into the chapter. */
  at: number;
  kicker?: string;
  title: string;
  lines?: string[];
  /** Big numerals (ASTER). */
  stats?: { value: string; label: string }[];
  /** Short labels shown as a row. */
  chips?: string[];
  /** Words joined by a symbol (→ or +). */
  chain?: { words: string[]; joiner: "→" | "+" };
  /** Up to three images revealed beside the text. */
  media?: Media[];
  /** "title" — the film's title card; "statement" — one large line. */
  style?: "title" | "statement";
};

export type RobotLine = { at: number; text: string };

export type Act = "Opening" | "The Producer" | "The Shift" | "The Strategist" | "What's next";

export type Chapter = {
  id: ChapterId;
  act: Act;
  /** Seconds. The controller holds a little longer if PA-1 is still talking. */
  duration: number;
  shot: ShotId;
  captions: Caption[];
  robot?: RobotLine;
  /** Where "Exit tour" lands in Explore. */
  exit: { section: SectionId; work?: WorkId };
};

export const ROBOT = { name: "PA-1", role: "Production assistant" };

const A = "/assets/aster";
const P = "/assets/purple";
const E = "/assets/events";

export const chapters: Chapter[] = [
  {
    id: "intro",
    act: "Opening",
    duration: 7,
    shot: "establish",
    captions: [{ at: 0.4, style: "title", title: "Satyam Bhardwaj", lines: ["Producer · Strategist"] }],
    robot: {
      at: 2.6,
      text: "I'm PA-1, production assistant. I've been given two minutes to explain Satyam. I've worked to tighter schedules.",
    },
    exit: { section: "about" },
  },
  {
    id: "who",
    act: "The Producer",
    duration: 12,
    shot: "satyam",
    captions: [
      {
        at: 0.6,
        kicker: "Who is he",
        title: "A producer.",
        lines: ["MA Filmmaking — Producing, Whistling Woods International.", "Before that: journalism, Amity University Kolkata."],
      },
    ],
    robot: { at: 4.6, text: "That's him, at the monitor. Directors imagine the film. Producers make sure it exists." },
    exit: { section: "about" },
  },
  {
    id: "job",
    act: "The Producer",
    duration: 11,
    shot: "set",
    captions: [
      {
        at: 0.5,
        kicker: "The job",
        title: "Making it happen.",
        chips: ["Scheduling", "Budgeting", "Locations", "Crew", "Execution"],
        lines: ["On set: ASTER · Death at the House of Purple · RANA · GLUTTONY"],
      },
    ],
    robot: { at: 5, text: "None of this ends up on the poster. All of it ends up in the film." },
    exit: { section: "work", work: "aster" },
  },
  {
    id: "aster",
    act: "The Producer",
    duration: 17,
    shot: "aster",
    captions: [
      {
        at: 0.6,
        kicker: "ASTER · Short film · Producer",
        title: "Seven locations. Four days.",
        stats: [
          { value: "07", label: "Locations" },
          { value: "04", label: "Shoot days" },
        ],
        lines: ["Production coordination on a compressed shoot, with cast and crew moving as one unit."],
        media: [
          { src: `${A}/location-01.jpg`, alt: "ASTER — ridgelines at blue hour", label: "Location" },
          { src: `${A}/scheduling.jpg`, alt: "ASTER — the production stripboard", label: "Stripboard" },
          { src: `${A}/production.jpg`, alt: "ASTER — night exterior with camera and crew", label: "On set" },
        ],
      },
    ],
    robot: { at: 9.5, text: "Seven locations in four days. Somebody had to make that schedule work. That was him." },
    exit: { section: "work", work: "aster" },
  },
  {
    id: "purple",
    act: "The Producer",
    duration: 14,
    shot: "purple",
    captions: [
      {
        at: 0.6,
        kicker: "Death at the House of Purple · Production",
        title: "Four sets. One controlled fire.",
        lines: ["Coordinated production design and logistics across four constructed sets.", "Safety and on-set execution for a hut-fire sequence."],
        media: [
          { src: `${P}/set-01.jpg`, alt: "Death at the House of Purple — the violet corridor set", label: "Set" },
          { src: `${P}/fire-01.jpg`, alt: "Death at the House of Purple — the supervised fire effect", label: "Fire" },
          { src: `${P}/planning.jpg`, alt: "Death at the House of Purple — floor plan with the effects zone", label: "Plan" },
        ],
      },
    ],
    robot: { at: 7, text: "Four sets built from nothing, and a hut that had to burn on cue. Safely." },
    exit: { section: "work", work: "purple" },
  },
  {
    id: "live",
    act: "The Producer",
    duration: 10,
    shot: "live",
    captions: [
      {
        at: 0.5,
        kicker: "Live events · Family business",
        title: "Weddings and live events.",
        lines: ["Jai Mata Di Caterers & Event Management, Bhagalpur: vendors, crews and clients on one timeline."],
        media: [
          { src: `${E}/venue-live.jpg`, alt: "An event hall during a live event", label: "Live" },
          { src: `${E}/vendors.jpg`, alt: "Vendors building the setup under work lights", label: "Setup" },
        ],
      },
    ],
    robot: { at: 4.4, text: "Also weddings. There are no second takes at a wedding." },
    exit: { section: "work", work: "live" },
  },
  {
    id: "shift",
    act: "The Shift",
    duration: 8,
    shot: "shift",
    captions: [
      { at: 0.5, style: "statement", title: "Production" },
      { at: 3, style: "statement", title: "Business" },
      { at: 5.5, style: "statement", title: "Finance" },
    ],
    robot: { at: 0.2, text: "Every shoot day has a budget. So he went to learn where budgets come from." },
    exit: { section: "strategy" },
  },
  {
    id: "strategist",
    act: "The Strategist",
    duration: 12,
    shot: "strategist",
    captions: [
      {
        at: 0.6,
        kicker: "The strategist",
        title: "Global business. Finance.",
        lines: ["Master of Global Business — Global Finance, in progress.", "SP Jain School of Global Management."],
      },
    ],
    robot: { at: 5, text: "A master's in global business, specialising in finance. He signed up for this voluntarily." },
    exit: { section: "strategy" },
  },
  {
    id: "finance",
    act: "The Strategist",
    duration: 14,
    shot: "finance",
    captions: [
      {
        at: 0.6,
        kicker: "Why finance",
        title: "Every creative decision has a cost.",
        chain: { words: ["Production", "Cost", "Operations", "Business", "Finance"], joiner: "→" },
        lines: ["Academic work: market strategy for Arihant Plus, UAE, and industry research (IBR)."],
      },
    ],
    robot: { at: 7.2, text: "Market analysis, industry research, a great deal of Excel. Both academic projects. I'm obliged to say so." },
    exit: { section: "strategy" },
  },
  {
    id: "combination",
    act: "The Strategist",
    duration: 11,
    shot: "wide",
    captions: [
      {
        at: 0.6,
        style: "statement",
        title: "Film + Production + Business + Finance",
        lines: ["A producer who reads the call sheet and the balance sheet."],
      },
    ],
    robot: { at: 5, text: "Most people pick a side: the set or the spreadsheet. He's kept both." },
    exit: { section: "strategy" },
  },
  {
    id: "future",
    act: "What's next",
    duration: 13,
    shot: "future",
    captions: [
      { at: 0.5, style: "statement", title: "What comes next?" },
      { at: 3.6, style: "statement", title: "Film + Business + Finance" },
      { at: 6.6, style: "statement", kicker: "The ambition", title: "Build the production house." },
    ],
    robot: { at: 9.2, text: "The plan is a production company of his own. I've asked if they'll need an assistant." },
    exit: { section: "contact" },
  },
];

export const chapterIndex = Object.fromEntries(chapters.map((c, i) => [c.id, i])) as Record<ChapterId, number>;

/** The acts, for the progress bar. */
export const acts: Act[] = ["Opening", "The Producer", "The Shift", "The Strategist", "What's next"];

export const tourLength = chapters.reduce((s, c) => s + c.duration, 0);

/** Explore: four sections over the same two rooms. */
export const sections: { id: SectionId; label: string }[] = [
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "strategy", label: "Strategy" },
  { id: "contact", label: "Contact" },
];

export const workItems: { id: WorkId; label: string }[] = [
  { id: "aster", label: "ASTER" },
  { id: "purple", label: "House of Purple" },
  { id: "live", label: "Live events" },
  { id: "more", label: "RANA · GLUTTONY" },
];

/** PA-1's one line when the visitor chooses to explore. */
export const exploreLine = "Explore at your own pace. I'll be around if anything needs explaining.";

/** Hash deep links: /#tour, /#about, /#work, /#work-purple, /#strategy, /#contact … */
export type Route = { mode: "tour" } | { mode: "explore"; section: SectionId; work?: WorkId };

export function parseRoute(token: string): Route | null {
  const t = token.replace(/^#/, "").toLowerCase();
  if (t === "tour") return { mode: "tour" };
  if (t === "about" || t === "strategy" || t === "contact") return { mode: "explore", section: t };
  if (t === "work") return { mode: "explore", section: "work", work: "aster" };
  const m = t.match(/^work-(aster|purple|live|more)$/);
  if (m) return { mode: "explore", section: "work", work: m[1] as WorkId };
  // links from the previous version of the site (?go=…)
  const legacy: Record<string, Route> = {
    aster: { mode: "explore", section: "work", work: "aster" },
    purple: { mode: "explore", section: "work", work: "purple" },
    rana: { mode: "explore", section: "work", work: "more" },
    gluttony: { mode: "explore", section: "work", work: "more" },
    events: { mode: "explore", section: "work", work: "live" },
    film: { mode: "explore", section: "work", work: "aster" },
    production: { mode: "explore", section: "work", work: "aster" },
    finance: { mode: "explore", section: "strategy" },
    business: { mode: "explore", section: "strategy" },
    career: { mode: "explore", section: "about" },
    final: { mode: "explore", section: "contact" },
  };
  return legacy[t] ?? null;
}

export const routeHash = (r: Route) => (r.mode === "tour" ? "tour" : r.section === "work" && r.work && r.work !== "aster" ? `work-${r.work}` : r.section);
