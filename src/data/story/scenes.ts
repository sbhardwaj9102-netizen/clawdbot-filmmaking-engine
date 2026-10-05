import { career } from "../career/chapters";
import { projects } from "../projects";
import type { Beat, SceneId, StoryScene } from "./types";

/**
 * SCENES — the story graph.
 *
 *   studio ──(after-story)──┬─ MAKE IT ────► film ──┬─ STORY ─────────► aster ─┐
 *                           │                       └─ HOW IT WAS MADE ► production
 *                           ├─ FINANCE IT ─► finance                          │
 *                           └─ BUILD IT ───► business                         │
 *   production ─(project-works)─► film / events / finance                     │
 *   every junction ─(onward, after 2 worlds)─► career ─► about ─(next)─► final
 *
 * Add a branch: add a scene here, a question in questions.ts, and (if it is a
 * new kind of place) a world in /src/scenes/registry.ts.
 */

const projectScenes: StoryScene[] = projects.map((p) => ({
  id: p.scene,
  world: "project",
  project: p.slug,
  chapter: { index: p.number, title: p.title, subtitle: `${p.role} · ${p.format}` },
  beats: [
    {
      id: `${p.scene}-title`,
      at: "entry",
      until: "s0",
      lines: p.titleLines ?? [p.title],
      sub: [p.role, p.format, p.scale].filter(Boolean).join(" · "),
      style: "title",
    },
    ...(p.status
      ? [{ id: `${p.scene}-status`, at: "end", lines: [p.status], style: "caption" } satisfies Beat]
      : []),
  ],
  hotspots: p.sections.map((s) => `${p.scene}-${s.kind}`),
  question: "after-project",
}));

const careerBeats: Beat[] = career.map((c, i) => ({
  id: `career-${c.id}`,
  at: `c${i}`,
  until: i < career.length - 1 ? `c${i + 1}` : "end",
  lines: [`${c.index} — ${c.title}`],
  sub: [c.place, c.detail, c.when].filter(Boolean).join(" · "),
  style: "title",
  event: `chapter-${c.id}`,
}));

export const scenes: StoryScene[] = [
  {
    id: "studio",
    world: "studio",
    chapter: { index: "00", title: "The Studio" },
    beats: [
      { id: "studio-slug", at: "start", until: "mid", lines: ["INT. PRODUCTION STUDIO — NIGHT"], style: "slug" },
      {
        id: "studio-script",
        at: "table",
        lines: [],
        shot: "script",
        hold: [
          { text: "Everything starts with a story.", duration: 3.4, event: "script-glow" },
          { text: "But what happens after the story?", duration: 2.6, event: "reveal-choices" },
        ],
      },
    ],
    hotspots: ["script"],
    question: "after-story",
  },
  {
    id: "film",
    world: "filmset",
    primary: true,
    chapter: { index: "01", title: "Make It", subtitle: "Film · Production · Creative execution" },
    beats: [
      {
        id: "film-make",
        at: "entry",
        until: "dolly",
        lines: ["Make it."],
        sub: "Film · Production · Creative execution",
        style: "title",
      },
      {
        id: "film-statement",
        at: "dolly",
        until: "boards",
        lines: ["A script becomes a schedule,", "a crew, a set — and a film."],
        style: "statement",
      },
      { id: "film-village", at: "village", lines: ["Four films. Step up to a screen to enter it."], style: "caption" },
    ],
    hotspots: ["reel-camera", "stills-board", "edit-bay", "monitor-aster", "monitor-purple", "monitor-rana", "monitor-gluttony"],
    question: "film-interest",
  },
  ...projectScenes,
  {
    id: "production",
    world: "production",
    primary: true,
    chapter: { index: "02", title: "Production", subtitle: "Making it happen" },
    beats: [
      { id: "prod-title", at: "entry", until: "idea", lines: ["Production."], sub: "Making it happen.", style: "title" },
      { id: "prod-idea", at: "idea", until: "plan", lines: ["Idea."], style: "statement", event: "sign-idea" },
      { id: "prod-plan", at: "plan", until: "execution", lines: ["Plan."], style: "statement", event: "sign-plan" },
      {
        id: "prod-exec",
        at: "execution",
        until: "end",
        lines: ["Execution."],
        sub: "Call sheets · schedules · budgets · locations · crew · logistics · design",
        style: "statement",
        event: "sign-execution",
      },
    ],
    hotspots: [
      "prod-callsheets",
      "prod-schedules",
      "prod-budgets",
      "prod-locations",
      "prod-crew",
      "prod-logistics",
      "prod-design",
      "prod-execution",
    ],
    question: "project-works",
  },
  {
    id: "events",
    world: "events",
    primary: true,
    chapter: { index: "03", title: "Events", subtitle: "Live experiences" },
    beats: [
      { id: "evt-title", at: "entry", until: "empty", lines: ["Events."], sub: "Live experiences.", style: "title" },
      { id: "evt-empty", at: "empty", until: "setup", lines: ["Empty venue."], style: "caption" },
      { id: "evt-setup", at: "setup", until: "live", lines: ["Setup."], style: "caption" },
      { id: "evt-live", at: "live", until: "stage", lines: ["Live."], style: "caption", event: "venue-live" },
      {
        id: "evt-stage",
        at: "stage",
        lines: ["Vendors, service teams, clients and staff —", "moving to one timeline."],
        style: "statement",
      },
    ],
    hotspots: ["evt-house", "evt-vendors", "evt-setup", "evt-deadlines", "evt-manpower", "evt-live"],
    question: "after-events",
  },
  {
    id: "finance",
    world: "finance",
    primary: true,
    chapter: { index: "04", title: "Finance It", subtitle: "Business · Strategy · Production economics" },
    beats: [
      {
        id: "fin-title",
        at: "entry",
        until: "glass",
        lines: ["Finance it."],
        sub: "Business · Strategy · Production economics",
        style: "title",
      },
      {
        id: "fin-engine",
        at: "glass",
        until: "table",
        lines: ["A creative idea also needs", "an economic engine."],
        style: "statement",
      },
      {
        id: "fin-line",
        at: "table",
        until: "end",
        lines: ["Every shoot day, every location, every crew call", "is also a line in a budget."],
        style: "statement",
      },
    ],
    hotspots: ["fin-budget", "fin-model", "fin-research", "fin-tools"],
    question: "after-finance",
  },
  {
    id: "business",
    world: "business",
    primary: true,
    chapter: { index: "05", title: "Build It", subtitle: "Entrepreneurship · Systems · Future" },
    beats: [
      {
        id: "biz-title",
        at: "entry",
        until: "approach",
        lines: ["Build it."],
        sub: "Entrepreneurship · Systems · Future",
        style: "title",
      },
      {
        id: "biz-inside",
        at: "approach",
        until: "ring",
        lines: ["What if you didn't just work", "inside the system?"],
        style: "statement",
      },
      { id: "biz-built", at: "ring", until: "core", lines: ["What if you built one?"], style: "statement", event: "network-on" },
      {
        id: "biz-honest",
        at: "core",
        lines: ["Direction, not a claim — this is where the work is pointed."],
        style: "caption",
      },
    ],
    hotspots: ["biz-core", "biz-strategy", "biz-teams", "biz-content", "biz-infrastructure"],
    question: "after-business",
  },
  {
    id: "career",
    world: "career",
    chapter: { index: "06", title: "The Path", subtitle: "Journalism → Producer / Strategist" },
    beats: careerBeats,
    hotspots: career.map((c) => `career-${c.id}`),
    next: "about",
  },
  {
    id: "about",
    world: "about",
    chapter: { index: "07", title: "Satyam Bhardwaj", subtitle: "Producer · Strategist" },
    beats: [
      {
        id: "about-title",
        at: "screen",
        until: "desk",
        lines: ["Satyam Bhardwaj"],
        sub: "Producer · Strategist",
        style: "title",
        event: "screen-on",
      },
    ],
    hotspots: ["about-screen", "about-resume"],
    question: "next",
  },
  {
    id: "final",
    world: "final",
    auto: true,
    chapter: { index: "08", title: "Let's make something" },
    beats: [
      { id: "final-door", at: "door", lines: [], event: "open-door", shot: "door" },
      { id: "final-out", at: "outside", lines: [], event: "fade-out" },
    ],
    hotspots: [],
  },
];

export const sceneById = Object.fromEntries(scenes.map((s) => [s.id, s])) as Record<SceneId, StoryScene>;

/** Scenes a recruiter can jump to directly from the menu. */
export const jumpTargets: { label: string; scene: SceneId }[] = [
  { label: "Work — the films", scene: "film" },
  { label: "ASTER", scene: "aster" },
  { label: "Production", scene: "production" },
  { label: "Events", scene: "events" },
  { label: "Finance", scene: "finance" },
  { label: "Build", scene: "business" },
  { label: "Career path", scene: "career" },
  { label: "About", scene: "about" },
];
