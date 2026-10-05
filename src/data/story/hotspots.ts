import { career } from "../career/chapters";
import { profile } from "../profile";
import { projects } from "../projects";
import { aster } from "../projects/aster";
import { purple } from "../projects/purple";
import { ambition, arihant, globalFinance, ibr } from "../worlds/business";
import { events } from "../worlds/events";
import type { HotspotDef, HotspotVerb, SceneId } from "./types";

/**
 * HOTSPOTS — what each object in the world does when the visitor uses it.
 * Worlds place the physical object; this file owns the behaviour and the words.
 */

const verbFor: Record<string, HotspotVerb> = {
  production: "READ",
  story: "READ",
  locations: "EXPLORE",
  schedule: "OPEN",
  crew: "VIEW",
  sets: "EXPLORE",
  fire: "VIEW",
  bts: "VIEW",
  stills: "VIEW",
  video: "WATCH",
};

const projectHotspots: HotspotDef[] = projects.flatMap((p) => [
  {
    id: `monitor-${p.scene}`,
    verb: "ENTER" as const,
    label: p.title,
    action: { type: "project" as const, scene: p.scene as SceneId },
    reach: true,
  },
  ...p.sections.map<HotspotDef>((s) => ({
    id: `${p.scene}-${s.kind}`,
    verb: verbFor[s.kind] ?? "VIEW",
    label: s.title,
    action: {
      type: "panel",
      content: { kicker: `${p.title} · ${s.kicker ?? s.title}`, title: s.title, body: s.body, facts: s.facts, media: s.media },
    },
  })),
]);

const careerHotspots: HotspotDef[] = career.map((c) => ({
  id: `career-${c.id}`,
  verb: "READ",
  label: c.title,
  action: {
    type: "panel",
    content: {
      kicker: `Chapter ${c.index}`,
      title: c.title,
      facts: [
        { label: "Where", value: c.place },
        { label: "What", value: c.detail },
        ...(c.when ? [{ label: "When", value: c.when }] : []),
      ],
      body: c.points,
    },
  },
}));

const list: HotspotDef[] = [
  // ── Studio ────────────────────────────────────────────────
  {
    id: "script",
    verb: "READ",
    label: "The script",
    reach: true,
    action: {
      type: "panel",
      content: {
        kicker: "Scene 1",
        title: "Everything starts with a story.",
        body: [
          "Every film in this portfolio started as pages on a table. What came after — the schedule, the crew, the sets, the budget — is the work you are about to walk through.",
        ],
      },
    },
  },

  // ── Film set ──────────────────────────────────────────────
  {
    id: "reel-camera",
    verb: "WATCH",
    label: "Reel",
    reach: true,
    action: { type: "media", items: [profile.reel] },
  },
  {
    id: "stills-board",
    verb: "VIEW",
    label: "Stills wall",
    action: {
      type: "panel",
      content: {
        kicker: "Make it · Stills",
        title: "From the films",
        body: ["Frames and production stills from ASTER, DEATH AT THE HOUSE OF PURPLE, RANA and GLUTTONY."],
        media: [
          ...aster.sections.find((s) => s.kind === "stills")!.media.slice(0, 4),
          ...projects.slice(1).map((p) => ({ ...p.cover, label: p.title })),
        ],
      },
    },
  },
  {
    id: "edit-bay",
    verb: "OPEN",
    label: "The films",
    action: {
      type: "panel",
      content: {
        kicker: "Make it · Filmography",
        title: "Four films",
        list: projects.map((p) => ({
          title: `${p.title} — ${p.role}`,
          body: [p.format, p.scale].filter(Boolean).join(" · "),
        })),
        note: "Walk up to a monitor to enter a film.",
      },
    },
  },
  ...projectHotspots,

  // ── Production office ─────────────────────────────────────
  {
    id: "prod-callsheets",
    verb: "READ",
    label: "Call sheets",
    reach: true,
    action: {
      type: "panel",
      content: {
        kicker: "Production · Call sheets",
        title: "Call sheets",
        body: [
          "ASTER: cast and crew kept moving as one unit across four shoot days and seven locations — creative and operational needs aligned.",
        ],
        media: [aster.sections.find((s) => s.kind === "crew")!.media[0]],
        link: { label: "Enter ASTER", scene: "aster" },
      },
    },
  },
  {
    id: "prod-schedules",
    verb: "OPEN",
    label: "Schedules",
    action: {
      type: "panel",
      content: {
        kicker: "Production · Schedules",
        title: "Schedules",
        body: ["Breakdowns and stripboards in Movie Magic Scheduling.", "ASTER: a compressed four-day shoot."],
        facts: [{ label: "ASTER shoot days", value: "04" }],
        media: [aster.sections.find((s) => s.kind === "schedule")!.media[0]],
      },
    },
  },
  {
    id: "prod-budgets",
    verb: "OPEN",
    label: "Budgets",
    reach: true,
    action: {
      type: "panel",
      content: {
        kicker: "Production · Budgets",
        title: "Budgets",
        body: ["Production budgets in Movie Magic Budgeting; trackers, analysis and reporting in Excel."],
        link: { label: "Production finance", scene: "finance" },
      },
    },
  },
  {
    id: "prod-locations",
    verb: "EXPLORE",
    label: "Locations",
    action: {
      type: "panel",
      content: {
        kicker: "Production · Locations",
        title: "Locations",
        body: ["ASTER: seven locations inside a four-day shoot."],
        facts: [{ label: "ASTER locations", value: "07" }],
        media: aster.sections.find((s) => s.kind === "locations")!.media,
      },
    },
  },
  {
    id: "prod-crew",
    verb: "VIEW",
    label: "Crew",
    action: {
      type: "panel",
      content: {
        kicker: "Production · Crew",
        title: "Crew",
        body: [
          "Team coordination across departments — cast and crew on set for ASTER; vendors, service teams and on-ground staff at live events.",
        ],
        media: [aster.sections.find((s) => s.kind === "bts")!.media[0]],
      },
    },
  },
  {
    id: "prod-logistics",
    verb: "VIEW",
    label: "Logistics",
    action: {
      type: "panel",
      content: {
        kicker: "Production · Logistics",
        title: "Logistics",
        body: ["DEATH AT THE HOUSE OF PURPLE: production-design and logistics needs coordinated across four constructed sets."],
        media: [purple.sections.find((s) => s.kind === "sets")!.media[4]],
        link: { label: "Enter the House of Purple", scene: "purple" },
      },
    },
  },
  {
    id: "prod-design",
    verb: "EXPLORE",
    label: "Production design",
    action: {
      type: "panel",
      content: {
        kicker: "Production · Design",
        title: "Four constructed sets",
        body: ["DEATH AT THE HOUSE OF PURPLE — four sets built for the film."],
        facts: [{ label: "Constructed sets", value: "04" }],
        media: purple.sections.find((s) => s.kind === "sets")!.media.slice(0, 4),
      },
    },
  },
  {
    id: "prod-execution",
    verb: "VIEW",
    label: "Execution",
    action: {
      type: "panel",
      content: {
        kicker: "Production · Execution",
        title: "Execution",
        body: [
          "Safety and on-set execution for a controlled hut-fire sequence on DEATH AT THE HOUSE OF PURPLE.",
          "At live events: issues resolved as they come up, under time pressure.",
        ],
        media: purple.sections.find((s) => s.kind === "fire")!.media,
      },
    },
  },

  // ── Events ────────────────────────────────────────────────
  {
    id: "evt-house",
    verb: "READ",
    label: events.org,
    action: {
      type: "panel",
      content: {
        kicker: `Events · ${events.place}`,
        title: events.org,
        body: [events.summary],
        facts: [
          { label: "Role", value: events.role },
          { label: "Where", value: events.place },
        ],
        media: events.gallery,
        note: events.note,
      },
    },
  },
  ...events.pillars.map<HotspotDef>((p) => ({
    id: `evt-${p.id}`,
    verb: "VIEW",
    label: p.title,
    action: { type: "panel", content: { kicker: `Events · ${events.org}`, title: p.title, body: [p.body], media: p.media } },
  })),

  // ── Finance ───────────────────────────────────────────────
  {
    id: "fin-budget",
    verb: "OPEN",
    label: "Production finance",
    reach: true,
    action: {
      type: "panel",
      content: {
        kicker: "Finance it · Production finance",
        title: "Production finance",
        body: [
          "Budgeting with Movie Magic Budgeting and Excel.",
          "A schedule is also a cost plan: ASTER's four shoot days across seven locations; four constructed sets and a controlled fire sequence on DEATH AT THE HOUSE OF PURPLE.",
        ],
      },
    },
  },
  {
    id: "fin-model",
    verb: "VIEW",
    label: "Global finance",
    action: {
      type: "panel",
      content: {
        kicker: `Finance it · ${globalFinance.when}`,
        title: globalFinance.degree,
        body: [globalFinance.summary],
        facts: [
          { label: "School", value: globalFinance.school },
          { label: "Status", value: globalFinance.when },
        ],
      },
    },
  },
  {
    id: "fin-research",
    verb: "READ",
    label: "Industry research",
    reach: true,
    action: {
      type: "panel",
      content: { kicker: ibr.context, title: ibr.title, body: [ibr.summary], list: ibr.parts, note: ibr.note },
    },
  },
  {
    id: "fin-tools",
    verb: "VIEW",
    label: "Toolkit",
    action: {
      type: "panel",
      content: {
        kicker: "Finance it · Toolkit",
        title: "The tools behind the plan",
        list: profile.tools.map((t) => ({ title: t.name, body: t.note })),
      },
    },
  },

  // ── Build it ──────────────────────────────────────────────
  {
    id: "biz-core",
    verb: "READ",
    label: "The ambition",
    action: {
      type: "panel",
      content: {
        kicker: "Build it · Direction",
        title: "Build the system",
        body: [ambition.statement],
        list: ambition.nodes.map((n) => ({ title: n })),
        note: ambition.honesty,
      },
    },
  },
  {
    id: "biz-strategy",
    verb: "READ",
    label: "Strategy",
    action: {
      type: "panel",
      content: { kicker: arihant.context, title: arihant.title, body: [arihant.summary], list: arihant.parts, note: arihant.note },
    },
  },
  {
    id: "biz-teams",
    verb: "VIEW",
    label: "Teams",
    action: {
      type: "panel",
      content: {
        kicker: "Build it · Teams",
        title: "Teams",
        body: [
          "Cast and crew moving as one unit across ASTER's seven locations.",
          "Vendors, service teams, clients and on-ground staff at live events for Jai Mata Di Caterers & Event Management.",
        ],
        link: { label: "Enter the events venue", scene: "events" },
      },
    },
  },
  {
    id: "biz-content",
    verb: "VIEW",
    label: "Content",
    action: {
      type: "panel",
      content: {
        kicker: "Build it · Content",
        title: "Content",
        list: projects.map((p) => ({ title: p.title, body: `${p.role} · ${p.format}` })),
        link: { label: "Go to the film set", scene: "film" },
      },
    },
  },
  {
    id: "biz-infrastructure",
    verb: "VIEW",
    label: "Production infrastructure",
    action: {
      type: "panel",
      content: {
        kicker: "Build it · Infrastructure",
        title: "Production infrastructure",
        body: ["The production toolkit so far: scheduling, budgeting, location logistics, set construction coordination and on-set safety."],
        list: profile.tools.map((t) => ({ title: t.name, body: t.note })),
        link: { label: "The production office", scene: "production" },
      },
    },
  },

  // ── Career ────────────────────────────────────────────────
  ...careerHotspots,

  // ── About ─────────────────────────────────────────────────
  {
    id: "about-screen",
    verb: "READ",
    label: "About",
    action: {
      type: "panel",
      content: {
        kicker: profile.title,
        title: profile.name,
        body: [profile.summary],
        facts: profile.education.map((e) => ({ label: e.school, value: [e.degree, e.when, e.note].filter(Boolean).join(" · ") })),
      },
    },
  },
  { id: "about-resume", verb: "OPEN", label: "Resume", reach: true, action: { type: "resume" } },
];

export const hotspots: Record<string, HotspotDef> = Object.fromEntries(list.map((h) => [h.id, h]));
