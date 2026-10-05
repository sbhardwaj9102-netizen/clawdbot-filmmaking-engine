import type { StoryScene } from "@/data/story/types";

/**
 * WORLD LAYOUT CONTRACT
 * ------------------------------------------------------------------
 * Every world exports a layout in its own local space (metres, y-up, ground at 0).
 * The SceneManager places the world anywhere, at any heading, by an anchor —
 * so worlds can be chained in any order the story chooses.
 */
export type V2 = [number, number];
export type V3 = [number, number, number];

export type Shot = { pos: V3; target: V3; fov?: number };

export type Palette = {
  /** Fog + background colour. */
  fog: string;
  fogDensity: number;
  /** Hemisphere light: sky / ground / intensity. */
  sky: string;
  ground: string;
  ambient: number;
  /** Global floor tint + roughness. */
  floor: string;
  floorRoughness: number;
  /** UI accent and transit portal colour. */
  accent: string;
  exposure: number;
  /** Bloom strength (post-processing tiers only). */
  bloom: number;
};

export type LightSpec =
  | {
      kind: "spot";
      pos: V3;
      target: V3;
      color: string;
      intensity: number;
      angle?: number;
      penumbra?: number;
      distance?: number;
    }
  | { kind: "point"; pos: V3; color: string; intensity: number; distance?: number };

export type FollowConfig = {
  distance: number;
  height: number;
  side: number;
  lookHeight: number;
  lookAhead: number;
  fov: number;
};

export type WorldLayout = {
  /** Walking path; the first waypoint is the entry, the last is where questions appear. */
  path: { id: string; p: V2 }[];
  /** Where the avatar leaves, keyed by option id, next scene id, or "default". */
  exits: Record<string, { p: V2; dir: V2; via?: V2[] }>;
  /** Interactive objects: where the object is, and where the avatar stands to use it. */
  hotspots: Record<string, { object: V3; mark: V2; shot?: Shot; size?: [number, number] }>;
  /** Positions for question options (option id → point), plus "onward". */
  anchors?: Record<string, V3>;
  shots?: Record<string, Shot>;
  follow?: Partial<FollowConfig>;
  palette: Palette;
  /** Key directional light (moon / sun / overhead). */
  key: { dir: V3; color: string; intensity: number };
  /** Up to 4 spots and 4 points (the light rig has fixed slots). */
  lights: LightSpec[];
  /** Optional: lighting / palette that change as the avatar walks (0–1 along the path). */
  lightsAt?: (u: number) => LightSpec[];
  paletteAt?: (u: number) => Palette;
  /** Draw light columns under question options (worlds with physical choice objects turn this off). */
  choicePillars?: boolean;
  /** Textures to preload before the world appears. */
  textures: string[];
  /** Opening camera move (studio only): keyframes in seconds. */
  intro?: { t: number; pos: V3; target: V3; fov: number }[];
};

export type WorldProps = {
  scene: StoryScene;
  layout: WorldLayout;
};
