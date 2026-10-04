import type { Project } from "@/lib/types";

/**
 * PROJECTS
 * ------------------------------------------------------------------
 * Every card on the home page and every case-study page (/work/<slug>)
 * is generated from this array. To add a project, copy one object,
 * give it a new `slug`, and drop its images into /public/assets/<slug>/.
 *
 * PLACEHOLDER COPY: the chapter / timeline / statement text below is sample
 * writing for the prototype. Only the titles, roles and scale figures
 * (7 locations, 4 days, 4 sets, controlled fire sequence) come from the brief.
 * Replace the rest with the real production details before publishing.
 *
 * Optional fields you can add to any project: `year`, `format`, `poster`.
 */

const A = "/assets/aster";
const P = "/assets/purple";
const R = "/assets/rana";
const G = "/assets/gluttony";

export const projects: Project[] = [
  {
    slug: "aster",
    number: "01",
    title: "ASTER",
    role: "Producer",
    scale: "7 Locations / 4 Days",
    logline: "Production coordination across a compressed four-day shoot spanning seven locations.",
    cover: { src: `${A}/cover.jpg`, alt: "ASTER — a lone road through layered hills at dawn" },
    accent: "#d9a066",
    facts: [
      { label: "Role", value: "Producer" },
      { label: "Locations", value: "07" },
      { label: "Shoot", value: "04 days" },
      { label: "Scope", value: "Development → Delivery" },
    ],
    blocks: [
      {
        type: "stats",
        items: [
          { value: 7, label: "Locations" },
          { value: 4, label: "Days" },
        ],
      },
      {
        type: "statement",
        kicker: "The brief",
        text: "Production coordination across a compressed four-day shoot spanning seven locations.",
      },
      {
        type: "chapters",
        items: [
          {
            title: "Production",
            body: "Taking the film from an approved script to a locked shooting plan — holding budget, schedule and creative intent together from prep to wrap.",
            images: [
              { src: `${A}/production.jpg`, alt: "Night exterior set with camera and crew", caption: "UNIT — NIGHT EXT." },
              { src: `${A}/bts-02.jpg`, alt: "Light stand and crew member on set", caption: "PREP — DAY 0" },
            ],
          },
          {
            title: "Location Logistics",
            body: "Seven locations scouted, permitted and sequenced so company moves cost minutes, not hours — each one planned around access, power, light direction and unit base.",
            images: [
              { src: `${A}/location-01.jpg`, alt: "Misty ridgelines at blue hour", caption: "LOC 02 — BLUE HOUR" },
              { src: `${A}/location-02.jpg`, alt: "Hills at dusk", caption: "LOC 05 — DUSK" },
            ],
          },
          {
            title: "Scheduling",
            body: "A four-day schedule built scene by scene — stripboards, day-out-of-days and call sheets balanced against daylight, cast availability and travel time.",
            images: [{ src: `${A}/scheduling.jpg`, alt: "Production stripboard on a desk", caption: "STRIPBOARD — V4" }],
          },
          {
            title: "Cast & Crew Coordination",
            body: "Call times, transport, meals and turnarounds coordinated so every department arrived ready to shoot, at every location, on every day.",
            images: [
              { src: `${A}/crew.jpg`, alt: "Crew silhouettes during a briefing", caption: "BRIEFING — DAY 1" },
              { src: `${A}/location-04.jpg`, alt: "Interior location with window light", caption: "LOC 04 — INT." },
            ],
          },
          {
            title: "On-Ground Execution",
            body: "On set, the plan meets reality. Real-time decisions on weather, overruns and resets keep the day moving and the film on schedule.",
            images: [{ src: `${A}/execution.jpg`, alt: "Field monitor at video village", caption: "VIDEO VILLAGE — DAY 3" }],
          },
        ],
      },
      {
        type: "gallery",
        kicker: "Behind the scenes",
        title: "BTS",
        images: [
          { src: `${A}/bts-01.jpg`, alt: "Camera operator at the lens", caption: "DAY 1 — LOC 01" },
          { src: `${A}/bts-04.jpg`, alt: "Monitor during a take", caption: "DAY 2 — LOC 03" },
          { src: `${A}/bts-03.jpg`, alt: "Crew under a cold backlight", caption: "DAY 2 — LOC 04" },
          { src: `${A}/bts-06.jpg`, alt: "Operator and crew on set", caption: "DAY 3 — LOC 06" },
          { src: `${A}/bts-05.jpg`, alt: "Crew moving the camera", caption: "DAY 4 — LOC 07" },
        ],
      },
      {
        type: "sequence",
        kicker: "Frames",
        title: "Sequence",
        images: [
          { src: `${A}/frame-01.jpg`, alt: "Road into the hills at dawn", caption: "01:02:14:08" },
          { src: `${A}/frame-02.jpg`, alt: "Figure against misty ridges", caption: "01:05:41:17" },
          { src: `${A}/frame-03.jpg`, alt: "Figure in warm window light", caption: "01:09:03:02" },
          { src: `${A}/frame-04.jpg`, alt: "Silhouette among city lights", caption: "01:13:27:21" },
          { src: `${A}/frame-05.jpg`, alt: "Figure walking at dusk", caption: "01:16:55:11" },
          { src: `${A}/frame-06.jpg`, alt: "Doorway at the end of a room", caption: "01:20:12:04" },
          { src: `${A}/frame-07.jpg`, alt: "Sun over the valley mist", caption: "01:24:38:19" },
          { src: `${A}/frame-08.jpg`, alt: "Light trails at night", caption: "01:27:09:00" },
        ],
      },
      {
        type: "festivals",
        title: "Festival Selections",
        note: "Festival information to be announced.",
        items: [
          { name: "Festival Name", award: "Official Selection", year: "20XX" },
          { name: "Festival Name", award: "Official Selection", year: "20XX" },
          { name: "Festival Name", award: "Official Selection", year: "20XX" },
        ],
      },
    ],
  },
  {
    slug: "death-at-the-house-of-purple",
    number: "02",
    title: "DEATH AT THE HOUSE OF PURPLE",
    titleLines: ["DEATH AT THE", "HOUSE OF PURPLE"],
    role: "Production",
    scale: "4 Sets / Controlled Fire Sequence",
    logline: "Four constructed sets and a controlled fire sequence — dramatic on screen, methodical behind it.",
    cover: { src: `${P}/cover.jpg`, alt: "A violet room with a lit doorway and a figure" },
    accent: "#a68cff",
    facts: [
      { label: "Role", value: "Production" },
      { label: "Sets", value: "04 constructed" },
      { label: "Sequence", value: "Controlled fire" },
      { label: "Safety", value: "SFX-supervised" },
    ],
    blocks: [
      {
        type: "stats",
        items: [
          { value: 4, label: "Constructed sets" },
          { text: "Controlled", label: "Fire sequence" },
        ],
      },
      {
        type: "statement",
        kicker: "The brief",
        text: "Four sets built from the ground up, and a fire sequence designed to look dangerous on screen while staying controlled on the floor.",
      },
      {
        type: "timeline",
        title: "Fire Sequence",
        items: [
          {
            title: "Planning",
            body: "Set designs, floor plans and the fire sequence broken down shot by shot with the director, art department and special-effects team.",
            image: { src: `${P}/planning.jpg`, alt: "Floor plan with the effects zone marked", caption: "FLOOR PLAN — FX ZONE" },
          },
          {
            title: "Set Construction",
            body: "Four sets constructed and dressed to schedule, with materials and layouts chosen around how the fire would be staged and filmed.",
            image: { src: `${P}/construction.jpg`, alt: "Set flats under construction", caption: "BUILD — STAGE A" },
          },
          {
            title: "Safety",
            body: "A qualified special-effects crew, a dedicated safety officer, briefings, rehearsals and standby suppression in place before any flame is lit.",
            image: { src: `${P}/safety.jpg`, alt: "Extinguishers on standby behind a marked exclusion line", caption: "STANDBY — EXCLUSION ZONE" },
          },
          {
            title: "Execution",
            body: "The sequence filmed in controlled takes with clear exclusion zones and resets — supervised by the effects team throughout.",
            image: { src: `${P}/execution.jpg`, alt: "Controlled flame bar on set, supervised by crew", caption: "TAKE 3 — SFX SUPERVISED" },
          },
        ],
      },
      {
        type: "chapters",
        items: [
          {
            title: "Four Constructed Sets",
            body: "Each set was designed as a room in the same house — corridors, bedroom, study and dining room — so the story could move through one continuous world.",
            images: [
              { src: `${P}/set-01.jpg`, alt: "Long violet corridor set", caption: "SET 01 — CORRIDOR" },
              { src: `${P}/set-02.jpg`, alt: "Bedroom set with window light", caption: "SET 02 — BEDROOM" },
            ],
          },
          {
            title: "Controlled Fire Sequence",
            body: "Gas-fed effects run by the special-effects team, with every take rehearsed, briefed and covered by standby crew.",
            images: [{ src: `${P}/fire-01.jpg`, alt: "Supervised fire effect on set", caption: "FX — CONTROLLED BURN" }],
          },
          {
            title: "The House",
            body: "Production design, lighting and scheduling built around the rooms — so every set change was planned before the build began.",
            images: [
              { src: `${P}/set-03.jpg`, alt: "Study set lit by a single lamp", caption: "SET 03 — STUDY" },
              { src: `${P}/set-04.jpg`, alt: "Dining room set", caption: "SET 04 — DINING ROOM" },
            ],
          },
        ],
      },
      {
        type: "gallery",
        kicker: "Behind the scenes",
        title: "BTS",
        images: [
          { src: `${P}/bts-01.jpg`, alt: "Crew on the violet set", caption: "STAGE A — DAY 1" },
          { src: `${P}/bts-02.jpg`, alt: "Light stand and crew", caption: "STAGE B — DAY 2" },
          { src: `${P}/bts-03.jpg`, alt: "Team briefing before the fire take", caption: "SAFETY BRIEF — DAY 3" },
        ],
      },
      {
        type: "festivals",
        title: "Festival Selections",
        note: "Festival information to be announced.",
        items: [
          { name: "Festival Name", award: "Official Selection", year: "20XX" },
          { name: "Festival Name", award: "Official Selection", year: "20XX" },
        ],
      },
    ],
  },
  {
    slug: "rana",
    number: "03",
    title: "RANA",
    role: "Film Production",
    logline: "Case study in progress — production details, stills and credits coming soon.",
    cover: { src: `${R}/cover.jpg`, alt: "A fort on a ridge in dust-filled evening light" },
    poster: { src: `${R}/poster.jpg`, alt: "A fort silhouetted against a dusty sky" },
    accent: "#e0a35c",
    facts: [{ label: "Role", value: "Film Production" }],
    blocks: [
      { type: "statement", kicker: "Project", text: "Production details for RANA will be added here — scale, locations, schedule and team." },
      {
        type: "gallery",
        kicker: "Stills",
        title: "Stills",
        images: [
          { src: `${R}/still-01.jpg`, alt: "Sunlit corridor of arches", caption: "STILL 01" },
          { src: `${R}/still-03.jpg`, alt: "Figure among torch light", caption: "STILL 02" },
          { src: `${R}/still-02.jpg`, alt: "Desert road at evening", caption: "STILL 03" },
          { src: `${R}/still-04.jpg`, alt: "Crew on location", caption: "BTS" },
        ],
      },
    ],
  },
  {
    slug: "gluttony",
    number: "04",
    title: "GLUTTONY",
    role: "Film Production",
    logline: "Case study in progress — production details, stills and credits coming soon.",
    cover: { src: `${G}/cover.jpg`, alt: "A long candle-lit banquet table in a crimson room" },
    poster: { src: `${G}/poster.jpg`, alt: "Banquet table in crimson light" },
    accent: "#e0574a",
    facts: [{ label: "Role", value: "Film Production" }],
    blocks: [
      { type: "statement", kicker: "Project", text: "Production details for GLUTTONY will be added here — scale, locations, schedule and team." },
      {
        type: "gallery",
        kicker: "Stills",
        title: "Stills",
        images: [
          { src: `${G}/still-02.jpg`, alt: "Figure in a crimson doorway", caption: "STILL 01" },
          { src: `${G}/still-01.jpg`, alt: "Red and amber bokeh", caption: "STILL 02" },
          { src: `${G}/still-03.jpg`, alt: "Dining room in red light", caption: "STILL 03" },
          { src: `${G}/still-04.jpg`, alt: "Crew on set", caption: "BTS" },
        ],
      },
    ],
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);

export const getNextProject = (slug: string) => {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
};
