# Satyam Bhardwaj — Motion Portfolio (prototype)

A cinematic, motion-driven portfolio prototype for **Satyam Bhardwaj — Film Producer / Entertainment Operations**.
Built with **Next.js 16 (App Router) + React 19 + Framer Motion + Lenis**, styled with CSS Modules.

> Every image and the hero video are **procedurally generated placeholders**. They sit in
> `public/assets/<project>/` with stable file names, so you can replace them with real
> production stills one file at a time without touching any code.

---

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static export → ./out  (deploy anywhere)
npm start            # serve ./out locally
```

`next.config.ts` uses `output: "export"`, so the build is a plain static site. It deploys as-is to
Vercel, Netlify, Cloudflare Pages, S3 or GitHub Pages. Set `NEXT_PUBLIC_SITE_URL` to your domain so
social-share previews resolve.

---

## Where things live

```
data/
  projects.ts        ← every project card + case-study page
  site.ts            ← name, hero, proof strip, process, events, about, toolkit, contact
public/assets/
  site/              hero.mp4, hero.jpg (poster), portrait.jpg, grain.png
  aster/             cover, location-0x, production, scheduling, crew, execution, bts-0x, frame-0x
  purple/            cover, planning, construction, safety, execution, fire-01, set-0x, bts-0x
  rana/              cover, poster, still-0x
  gluttony/          cover, poster, still-0x
  events/            cover, venue-empty / -setup / -live, clients, vendors, timelines, logistics, live, gallery-0x
app/
  page.tsx           home: Hero → Selected Work → Production → Event Ops → About → Toolkit → Contact
  work/[slug]/       one case-study template for all projects (static pages generated from data)
components/
  motion/            reusable motion primitives (MaskText, ParallaxImage, HorizontalScroll, StickyStory, CountUp…)
  layout/            Nav, Cursor, FilmGrain, TransitionProvider (full-screen page transitions)
  home/              home-page sections
  case/              case-study hero + content blocks
scripts/placeholders/ the generator that produced every placeholder plate
```

## Replace placeholders with real assets

1. Drop your file into the matching folder **with the same name** (e.g. `public/assets/aster/cover.jpg`).
   Recommended sizes: covers 2400×1350, wide images 2000×1125, portrait images 1200×1500, JPG ~80% quality.
2. Or point the data file at a new path — e.g. in `data/projects.ts` change
   `cover: { src: "/assets/aster/cover.jpg", alt: "…" }`.
3. **Video anywhere:** any asset accepts a `video` field — `{ src: "/assets/aster/poster.jpg", video: "/assets/aster/loop.mp4", alt: "…" }` —
   and `src` becomes the poster frame. The hero showreel is `site.hero.video` in `data/site.ts`.

Keep `alt` text meaningful; it is used for accessibility and the lightbox captions.

## Add or edit a project

Projects are plain objects in `data/projects.ts`:

```ts
{
  slug: "new-film",                       // → /work/new-film
  number: "05",
  title: "NEW FILM",
  titleLines: ["NEW", "FILM"],            // optional manual line breaks
  role: "Producer",
  scale: "3 Locations / 6 Days",          // shown on the card
  logline: "One line about the production.",
  cover: { src: "/assets/new-film/cover.jpg", alt: "…" },
  poster: { src: "/assets/new-film/poster.jpg", alt: "…" },   // optional tall card image
  accent: "#d9a066",                      // case-study accent colour
  facts: [{ label: "Role", value: "Producer" }],
  blocks: [
    { type: "stats", items: [{ value: 3, label: "Locations" }, { text: "Night", label: "Exteriors" }] },
    { type: "statement", kicker: "The brief", text: "…" },
    { type: "chapters", items: [{ title: "Production", body: "…", images: [/* 1–2 assets */] }] },
    { type: "timeline", title: "Stunt Sequence", items: [{ title: "Planning", body: "…", image: {/* asset */} }] },
    { type: "gallery", title: "BTS", images: [/* assets */] },
    { type: "sequence", title: "Sequence", images: [/* wide frames, 2.39:1 looks best */] },
    { type: "festivals", title: "Festival Selections", items: [{ name: "Festival", award: "Official Selection", year: "2026" }] },
  ],
}
```

Blocks render in the order listed. Leave one out and that section simply doesn't appear. The home page
places the first two projects full-width and pairs the rest as tall staggered cards automatically.

> **Copy note:** chapter, timeline and statement text in `data/projects.ts` is sample writing.
> Only the titles, roles and scale figures (7 locations / 4 days / 4 sets / controlled fire sequence)
> come from the brief — replace the rest with the real production details. Festival entries are
> placeholders until real selections are confirmed.

## Motion system

| Effect | Where |
| --- | --- |
| Smooth scrolling | `lib/smooth-scroll.tsx` (Lenis; native on touch, off for reduced motion) |
| Masked line / letter reveals | `components/motion/MaskText.tsx` |
| Parallax + scroll zoom + wipe-in | `components/motion/ParallaxImage.tsx` |
| Pinned horizontal sections | `components/motion/HorizontalScroll.tsx` (process, film-strip sequence) |
| Scroll-driven crossfades | `components/motion/StickyStory.tsx` (event pillars, fire-sequence timeline) |
| Number counters | `components/motion/CountUp.tsx` |
| Full-screen project transition | `components/layout/TransitionProvider.tsx` (card image expands → case study) |
| Curtain page transition | same provider (nav links between pages) |
| Before / after venue wipe | `components/home/Events.tsx` |
| Custom cursor | `components/layout/Cursor.tsx` (`data-cursor="view"` on any element) |
| Moving film grain | `components/layout/FilmGrain.tsx` |
| Theme-aware sticky nav | `components/layout/Nav.tsx` (reads `data-theme="light"` sections) |

All timing comes from `lib/motion.ts` (two easing curves, long durations, no springs or bounce).
`prefers-reduced-motion` is respected throughout.

## Regenerating the placeholder plates

```bash
pip install numpy opencv-python-headless
npm run placeholders                 # everything (≈5 min)
python3 scripts/placeholders/generate.py aster   # only paths containing "aster"
```
