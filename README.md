# Satyam Bhardwaj — Producer · Strategist

**Film · Production · Business · Finance**

A portfolio told as a two-minute interactive film. Two rooms — **The Producer**
and **The Strategist** — a short transformation between them, and a dry little
production-assistant robot, **PA-1**, who has been asked to explain Satyam's
career and would like everyone to know he's on schedule.

The story it tells, in order:

1. Satyam is a producer.
2. He has hands-on production experience (ASTER: seven locations in four days;
   Death at the House of Purple: four constructed sets and a controlled hut-fire
   sequence; RANA and GLUTTONY; weddings and live events).
3. He understands scheduling, budgeting, operations and execution.
4. He is deliberately building finance and business expertise (SP Jain, Global Finance).
5. He wants to combine both in a production company of his own.

Three ways in, on every screen:

| | |
| --- | --- |
| **Take the tour** | ~2¼ minutes, plays itself. Pause, skip, go back or exit at any point. |
| **Explore** | About · Work · Strategy · Contact, over the same rooms. |
| **Quick view** | Everything on one plain page — about, selected work, resume, skills, education, contact. Also at `/quick/`. |

**Resume** and **Contact** are in the top bar everywhere. Sound is off until the
visitor turns it on; everything PA-1 says is also on screen. Light and dark mode
are both designed (the 3D rooms change too).

Built with **Next.js 16 (static export) · React 19 · three.js · React Three Fiber
· drei · postprocessing · zustand**.

---

## Run it

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # static site → ./out (deploy anywhere)
npm start              # serve ./out
npm run test:e2e       # the whole site in headless Chromium (after a build)
npm run resume:pdf     # re-render the resume PDF from /resume (after a build)
```

`npm run build` writes a fully static site to `./out` — Vercel, Netlify,
Cloudflare Pages, S3 or GitHub Pages. For a sub-path (e.g. a GitHub Pages
project site) build with `NEXT_PUBLIC_BASE_PATH=/repo-name`. Set
`NEXT_PUBLIC_SITE_URL` to the real domain so social previews resolve.

| Route | |
| --- | --- |
| `/` | The film. Deep links: `/#tour`, `/#about`, `/#work`, `/#work-purple`, `/#work-live`, `/#work-more`, `/#strategy`, `/#contact` |
| `/quick/` | Quick view as a static page |
| `/resume/` | The resume as a printable page (source of the PDF) |
| `/work/<slug>/` | A shareable page per film, with a link to see it on set |

Old links (`/?go=aster` etc.) still land in the right place.

---

## The tour

One state machine (`src/systems/Experience/tour.ts`) plays the chapters in
`src/data/story.ts`:

| Act | Chapter | What you see |
| --- | --- | --- |
| Opening | intro | The studio lights come up; the title; PA-1 arrives |
| The Producer | who | Satyam at the monitor. MA Producing, Whistling Woods |
| | job | The set: scheduling, budgeting, locations, crew, execution |
| | aster | Seven pins light on a map, four days on a stripboard |
| | purple | A constructed set; a hut fire on cue behind a safety line |
| | live | Festoon lights: weddings and live events |
| The Shift | shift | He walks across; the louvre wall turns production → business → finance |
| The Strategist | strategist | A glass office: Global Business, Global Finance, SP Jain |
| | finance | Production → cost → operations → business → finance |
| | combination | Both rooms at once: Film + Production + Business + Finance |
| What's next | future | The louvre opens onto a door of light: *Build the production house.* |

Then the end card: **View work · Download resume · Contact Satyam**.

A chapter lasts its `duration`, but never cuts PA-1 off mid-line (it waits a few
seconds at most). Everything the rooms do — the pins, the fire, the lights,
where Satyam stands — is a pure function of the chapter and its clock
(`src/systems/Experience/choreography.ts`), so pause, skip, back and exit always
land in a consistent picture.

Keys in the tour: **Space** pause · **→** skip · **←** back · **Esc** exit.

---

## Architecture

```
src/
  app/                     routes: /, /quick, /resume, /work/[slug]
  data/                    ← ALL CONTENT
    profile.ts               name, contact, summary, education, experience, skills, tools
    projects/                one file per film
    worlds/                  live events; finance & business (academic work, the ambition)
    story.ts                 THE FILM: chapters, captions, PA-1's lines, Explore sections, deep links
  systems/
    Experience/
      store.ts               mode (landing / tour / explore), chapter, pause, theme, sound, overlays
      tour.ts                the tour controller (state machine) + stage direction + Explore/landing moves
      choreography.ts        the stage plan: marks, light levels, what each set piece is doing, per chapter
      shots.ts               camera set-ups (start frame, slow push), portrait framing
      runtime.ts             per-frame state (positions, clocks, light) — never re-renders React
      preferences.ts         theme (remembered), sound (off each visit), reduced motion
    AudioManager/audio.ts    the audio director: score, room tone, cues, PA-1's voice
    Quality/                 device tiers, WebGL detection
  scenes/
    Producer/ProducerRoom.tsx     the studio: ASTER wall, House of Purple set + fire, video village, film monitors
    Shift/ShiftZone.tsx           the louvre wall and the door of light
    Strategist/StrategistRoom.tsx the glass office: table, globe, the "why finance" display, the city
    palettes.ts                   each room in each theme
  components/
    Experience/   ExperienceRoot (the page), Stage (canvas), Choreographer, Effects
    Avatar/ Robot/ Camera/ World/ InteractiveObject/
    Landing/ Tour/ Explore/ Navigation/ Overlays/ QuickView/ Resume/ Contact/ Fallback/ UI/
```

**Adding a chapter:** add it to `chapters` in `src/data/story.ts` (captions,
PA-1's line, where Exit lands), give it a set-up in `choreography.ts` (shot,
Satyam's mark, room light) and, if it needs one, a camera set-up in `shots.ts`.

**Adding a film:** add `src/data/projects/<name>.ts` and list it in
`projects/index.ts`; it gets a Quick view card and a `/work/<slug>` page. To
put it on set, give it a monitor on the film rack in `ProducerRoom.tsx`.

**The avatar** is procedural (no external model) and only reads `rt.avatar`, so a
rigged GLB can replace `components/Avatar/Avatar.tsx` later. **PA-1** is
`components/Robot/Robot.tsx` (3D) and `RobotDialogue.tsx` (subtitles).

**Audio.** One synthesized ambient theme (no samples, nothing licensed): slow
pads in D, a low root and a few bell notes in the producer's room; brighter,
with a soft arpeggio, in the strategist's. A quiet room tone, a riser for the
shift, a soft swell on reveals. PA-1 speaks through the browser's speech
synthesis, with captions always on screen. No footsteps.

**Theme.** Semantic tokens in `src/app/globals.css` (`--background`,
`--surface`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent`,
`--border`, `--overlay`, `--scrim`…), applied before first paint; the 3D rooms
blend between day and night palettes (`scenes/palettes.ts`, `World/themed.ts`).

**Performance.** Both rooms are mounted once — nothing loads mid-tour. Quality
tiers pick resolution, shadows, reflections, post-processing and particles; a
performance monitor lowers resolution if the frame rate drops. Images in the
rooms use downsized copies (`scripts/optimize-textures.mjs`). Quick view and the
resume never load three.js.

**Accessibility.** Skip link to Quick view; every caption and every PA-1 line is
announced to screen readers; all controls are real buttons with labels and
visible focus; dialogs trap focus and close with Esc; Explore has a plain
button for everything clickable in 3D. `prefers-reduced-motion` turns camera
moves into cuts and stops drift, bob and parallax. Without WebGL the same story
plays over still images.

---

## Content and what is real

Facts come only from the CV content in this repository (`src/data`). No
employers, clients, awards, festival selections, budgets or figures are
invented. The academic projects are labelled as academic. The production
company is stated as an ambition.

**To replace:**

- **Images and the reel** in `public/assets/**` are generated illustrations (see
  `public/assets/README.md`); replace any file with a real still of the same name.
  When they are all real, set `assetsArePlaceholders: false` in
  `src/data/profile.ts` to remove the note under the work.
- **WhatsApp** uses the CV phone number; change `profile.contact.whatsapp.number` if needed.
- **LinkedIn** isn't in the repository; add the URL to `profile.contact.linkedin`.
- **The resume PDF** is rendered from `/resume`; re-run `npm run resume:pdf` after
  editing `profile.ts`, or replace the file.

## Tooling

- `scripts/optimize-textures.mjs` — builds `public/tex/` (runs before dev/build).
- `scripts/resume-pdf.mjs` — renders `/resume` to PDF with Chromium.
- `scripts/e2e.mjs` — the end-to-end check (`npm run test:e2e`).
- `scripts/placeholders/` — the generator that produced the illustrations.

Earlier versions (the ten-world walk-through, the section-based motion
portfolio, *Director's Cut*, *SB Originals*) are in git history; the
ClawdBot script-to-prompt engine lives on `claude/clawdbot-filmmaking-ai-03r00g`.
