# Satyam Bhardwaj — Producer · Strategist

**Film · Production · Business · Finance**

An interactive, real-time 3D narrative portfolio. You don't scroll a page: you
enter a dark production studio, follow Satyam (the avatar) to a table with a
script on it, and decide what happens after the story — **MAKE IT**,
**FINANCE IT** or **BUILD IT**. Each answer sends him down a corridor into a
different world, where the work is discovered as physical objects. Every path
converges on the career path, a quiet room with the resume on the desk, and a
door that opens onto the contact card.

A recruiter who wants none of that has **Quick Mode** (one clean page),
**Resume** and **Menu** in the corner of every screen, including the loading screen.

Built with **Next.js 16 (static export) · React 19 · three.js · React Three
Fiber · drei · postprocessing · zustand**.

---

## Run it

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # static site → ./out (deploy anywhere)
npm start              # serve ./out
npm run test:e2e       # walk the whole experience in headless Chromium (after a build)
npm run resume:pdf     # re-render the resume PDF from /resume (after a build)
```

`npm run build` writes a fully static site to `./out`. It runs as-is on
Vercel, Netlify, Cloudflare Pages, S3 or GitHub Pages. For a sub-path (e.g. a
GitHub Pages project site) build with `NEXT_PUBLIC_BASE_PATH=/repo-name`. Set
`NEXT_PUBLIC_SITE_URL` to the real domain so social previews resolve.

Routes:

| Route | What it is |
| --- | --- |
| `/` | The interactive film (WebGL). Deep links: `/?go=aster`, `/?go=finance`, `/?go=about`… |
| `/quick/` | Quick Mode as a plain static page — work, experience, capabilities, about, resume, contact |
| `/resume/` | The resume as a printable page (source of the PDF) |
| `/work/<slug>/` | A shareable page per film, with a link back into its world |

---

## The journey

```
BLACK → a seam of light → the door opens → the studio powers up → the avatar
  → the script: "EVERYTHING STARTS WITH A STORY." / "BUT WHAT HAPPENS AFTER THE STORY?"
  → MAKE IT ──────► FILM SET ── monitors ──► ASTER · HOUSE OF PURPLE · RANA · GLUTTONY (each its own world)
  │                    └─ "What interests you more?"  STORY → ASTER   HOW IT WAS MADE → PRODUCTION
  → FINANCE IT ───► FINANCE (glass room, budgets, research)  "Where would you put it to work?"
  → BUILD IT ─────► BUSINESS (monoliths, the ambition)        "An ambition is only as good as the work under it."
     PRODUCTION ─ "What makes a project work?"  CREATIVITY / EXECUTION (→ EVENTS) / ECONOMICS
     every junction, once two worlds are seen ─► "Who is behind this?"
  → THE PATH (Journalism → Filmmaking → Production → Global Management → Finance → Producer / Strategist)
  → ABOUT (desk, chair, screen; the resume file)  "Where would you take it next?"  MAKE / SCALE / BUILD
  → THE DOOR → light → fade to black → contact
```

The last answer changes the light outside the door and the closing line. The
contact card shows the visitor's own route. Choices, visited worlds and opened
films are remembered (`localStorage`), so a returning visitor can continue.

Interaction:

| Input | Does |
| --- | --- |
| Scroll / trackpad · swipe up · ↓ ↑ / Space / PgDn | Walk forward / back |
| Click / tap an object | The avatar walks to it, turns, uses it (VIEW · ENTER · OPEN · WATCH · READ · EXPLORE) |
| Click / tap a choice (or the buttons under the question) | Choose the route |
| Backspace / ← Back | Previous scene |
| Esc | Close what's open |
| Tab | Keyboard list of the objects in the current space |
| ▶ Auto-walk | Hands-free |

---

## Architecture

```
src/
  app/                      routes: /, /quick, /resume, /work/[slug]
  data/                     ← ALL CONTENT. Nothing in here touches rendering.
    profile.ts                name, contact, summary, education, experience, skills, tools
    projects/                 one file per film (sections become stations in its world)
    career/chapters.ts        the six career chapters
    worlds/                   events and business/finance content
    story/                    THE STORY GRAPH
      scenes.ts                 scenes: world, chapter, beats, hotspots, question / next
      questions.ts              questions, options → next scene, the converging "onward" exit, finale lines
      hotspots.ts               what every object does (panel · enter project · media · resume)
      types.ts                  the story model
  systems/
    StoryEngine/              store (zustand), engine API, persistence
    SceneManager/             director (the real-time loop), anchors & paths, SceneManager component
    AudioManager/             Web Audio synthesis (no samples, no music), off by default
    Input/                    scroll / touch / keys → walking
    Quality/                  device tiers (low / medium / high), WebGL detection
  scenes/                   the worlds — each folder has layout.ts (data) + a component
    Arrival/ Film/ Project/ Production/ Events/ Finance/ Business/ Career/ About/ Final/
    layouts.ts registry.tsx   world id → layout / component
  components/
    Avatar/                   the procedural character and its animation
    Camera/                   cinematography (follow, focus, keyframed intro) + CameraRig
    World/                    light rig, atmosphere, floor, haze, light shafts, prop library
    InteractiveObject/        <Hotspot> — glow, label, walk-to-use
    StoryChoice/              in-world choices, choice objects, question overlay
    Portal/                   the corridor between worlds
    Cursor/ Navigation/ QuickMode/ Resume/ Overlay/ Experience/
```

**How it fits together.** The story is data. A scene names the *world* it
plays in and lists its beats (which reference the world's named waypoints),
its interactive objects and its question. A world exports a `layout` (walking
path, exits, object positions, camera shots, palette, lights) and a component
that builds the environment from a shared prop library.

The **director** (`systems/SceneManager/director.ts`) runs every frame: it turns
scroll into the avatar walking along the world's path, pauses at timed beats,
opens questions at the end of a path, walks the avatar to objects, and runs the
three transitions — **walk** (a corridor of light gates; the next world is
attached to the corridor's end and swapped in at the fog peak), **dive** (into a
monitor's screen) and **cut** (fade, for jumps and reduced motion). Worlds are
placed by anchors, so any world can follow any other — that is what lets the
story branch freely.

**Adding a branch** — e.g. a new "DISTRIBUTION" world:
1. `src/data/story/scenes.ts`: add a scene `{ id: "distribution", world: "…", beats, hotspots, question }`.
2. Route to it from any question's option in `questions.ts` (`next: "distribution"`).
3. If it's a new kind of place, add `src/scenes/Distribution/{layout.ts,DistributionWorld.tsx}` and register it in `scenes/layouts.ts` and `scenes/registry.tsx`.

**Adding a film:** add `src/data/projects/<name>.ts` and list it in
`projects/index.ts`. It gets a monitor in the film set, its own generated world
(one station per section), a Quick Mode entry and a `/work/<slug>` page.

**The avatar** is a procedural, realistically proportioned figure (1.8 m,
dark jacket, navy crew-neck, trousers, leather shoes) built from lathed forms —
no external model. It walks (stride and cadence from speed), idles, turns,
looks at nearby objects and reaches for what it uses. To swap in a rigged GLB
later, replace `components/Avatar/Avatar.tsx`; it only reads `rt.avatar`
(position, heading, speed, look target, reach target).

**Performance.** Quality tiers pick resolution, shadows, reflections,
post-processing and particle counts; a performance monitor lowers resolution
if frame rate drops. Worlds load their textures while the avatar is still in
the corridor (GPU copies at 1024–1280 px, built by `scripts/optimize-textures.mjs`).
The light rig has a fixed number of lights, so crossing between worlds never
recompiles shaders. Quick Mode and the resume never load three.js.

**Accessibility.** Quick Mode is linked first in the page (skip link). The
story is announced through a live region, every object in a space is reachable
by keyboard, choices are real buttons, dialogs trap focus and close with Esc.
`prefers-reduced-motion` (or the Menu toggle) turns camera moves into cuts and
removes parallax and drift. Without WebGL — or if the GPU fails — the site
opens straight into Quick Mode.

---

## Content and what is real

Facts come only from the CV content already in this repository: the four films
and the roles on them (Producer on ASTER, seven locations, four shoot days;
production on DEATH AT THE HOUSE OF PURPLE, four constructed sets and a
controlled hut-fire sequence; film production on RANA and GLUTTONY), event
operations in the family business (Jai Mata Di Caterers & Event Management,
Bhagalpur), the two SP Jain academic projects, education, skills, tools and
contact details. Nothing else — no awards, festival selections, budgets,
clients or job titles — is stated. The BUILD IT world is explicitly framed as
direction, not a claim.

**Placeholders to replace:**

- **All images and the reel** in `public/assets/**` are generated placeholders
  (see `public/assets/README.md`). Replace any file with a real still of the same
  name. When they are all real, set `assetsArePlaceholders: false` in
  `src/data/profile.ts` to remove the notice in Quick Mode.
- **LinkedIn** isn't in the repository. Add the URL to `profile.contact.linkedin`
  and it appears on the contact card, the menu, Quick Mode and the resume.
- **The resume PDF** (`public/resume/Satyam-Bhardwaj-Resume.pdf`) is rendered from
  the site's own resume page. Re-run `npm run resume:pdf` after editing
  `profile.ts`, or replace the file with your own PDF.
- RANA and GLUTTONY have no production details yet; their worlds and pages say so.

## Tooling

- `scripts/optimize-textures.mjs` — builds `public/tex/` (runs before dev/build).
- `scripts/resume-pdf.mjs` — renders `/resume` to PDF with Chromium.
- `scripts/e2e.mjs` — the end-to-end walk-through (`npm run test:e2e`).
- `scripts/placeholders/` — the generator that produced the placeholder stills.

Earlier prototypes (the section-based motion portfolio, *Director's Cut* and
*SB Originals*) are preserved in git history and on the
`claude/wonderful-keller-rgzpt7` branch. The ClawdBot script-to-prompt engine
lives on `claude/clawdbot-filmmaking-ai-03r00g`.
