/** Shared content types. Everything the visitor reads comes from /src/data. */

/** An image (or video) referenced from /public. `src` is always a still. */
export type Media = {
  src: string;
  alt: string;
  /** Short mono caption, e.g. "LOCATION 02". */
  label?: string;
  /** Optional video file. When set, `src` is the poster frame. */
  video?: string;
};

export type Fact = { label: string; value: string };

/** Readable content opened from an object in the world (and reused by Quick Mode). */
export type PanelContent = {
  kicker?: string;
  title: string;
  body?: string[];
  facts?: Fact[];
  list?: { title: string; body?: string }[];
  media?: Media[];
  note?: string;
  /** Optional onward link into another part of the story. */
  link?: { label: string; scene: string };
};
