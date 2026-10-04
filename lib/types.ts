/**
 * Content model for the portfolio.
 *
 * Everything you see on the site is driven by the plain data in /data.
 * Add a project = add one object to `projects` in data/projects.ts.
 */

/** Any image (or video) on the site. Paths are relative to /public. */
export type Asset = {
  src: string;
  alt: string;
  /** Small mono caption shown under/over the image, e.g. "LOC 03 — DAY 2". */
  caption?: string;
  /** Optional video. When set, `src` is used as the poster frame. */
  video?: string;
};

export type Stat =
  /** Animated counter: 7 → "7 LOCATIONS" */
  | { value: number; label: string; pad?: boolean }
  /** Text tile for things that aren't numbers: "CONTROLLED FIRE SEQUENCE" */
  | { text: string; label: string };

export type Chapter = {
  title: string;
  body: string;
  images: Asset[];
};

export type TimelineStep = {
  title: string;
  body: string;
  image: Asset;
};

export type Festival = {
  name: string;
  award?: string;
  year?: string;
};

/**
 * A case-study page is a stack of blocks. Re-order, remove or repeat them freely —
 * the page template renders whatever is listed, in order.
 */
export type Block =
  | { type: "stats"; items: Stat[] }
  | { type: "statement"; text: string; kicker?: string }
  | { type: "chapters"; items: Chapter[] }
  | { type: "timeline"; title: string; items: TimelineStep[] }
  | { type: "gallery"; title: string; kicker?: string; images: Asset[] }
  | { type: "sequence"; title: string; kicker?: string; images: Asset[] }
  | { type: "festivals"; title: string; items: Festival[]; note?: string }
  | { type: "note"; text: string };

export type Project = {
  slug: string;
  number: string;
  title: string;
  /** Optional manual line breaks for long titles. */
  titleLines?: string[];
  role: string;
  /** Short scale line used on cards, e.g. "7 Locations / 4 Days". */
  scale?: string;
  format?: string;
  year?: string;
  logline: string;
  /** Wide image used for the case-study hero and full-width cards. */
  cover: Asset;
  /** Optional portrait image used when the card is displayed tall. */
  poster?: Asset;
  /** Grade colour used for small accents on the case-study page. */
  accent?: string;
  /** Key / value facts in the case-study intro. */
  facts?: { label: string; value: string }[];
  blocks: Block[];
};
