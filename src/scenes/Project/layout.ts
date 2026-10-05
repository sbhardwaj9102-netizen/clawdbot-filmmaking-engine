import type { Project, ProjectSection } from "@/data/projects";

import type { LightSpec, Palette, V2, V3, WorldLayout } from "../types";

/**
 * A film's world is generated from its data: every section becomes a station
 * along a path (alternating sides), so adding a section to a project adds a
 * place to the world. The theme sets the environment and the light.
 */

export const STATION_SPACING = 6.2;
export const STATION_X = 3.3;

export type StationPlacement = { section: ProjectSection; index: number; side: -1 | 1; z: number; object: V3; mark: V2 };

const objectHeight: Record<string, number> = {
  production: 1.6,
  locations: 1.0,
  schedule: 1.7,
  crew: 1.6,
  bts: 1.7,
  stills: 2.0,
  sets: 1.5,
  fire: 1.1,
  video: 1.6,
  story: 1.5,
};

export function stations(project: Project): StationPlacement[] {
  return project.sections.map((section, index) => {
    const side = (index % 2 === 0 ? -1 : 1) as -1 | 1;
    const z = -(4.5 + index * STATION_SPACING);
    return {
      section,
      index,
      side,
      z,
      object: [side * STATION_X, objectHeight[section.kind] ?? 1.5, z],
      mark: [side * 1.55, z],
    };
  });
}

export const endZ = (project: Project) => -(4.5 + project.sections.length * STATION_SPACING);

const THEMES: Record<Project["theme"], { palette: Palette; key: WorldLayout["key"]; warm: string; cool: string }> = {
  aster: {
    palette: {
      fog: "#24222d",
      fogDensity: 0.021,
      sky: "#8c7f95",
      ground: "#1c130e",
      ambient: 0.55,
      floor: "#1f1d22",
      floorRoughness: 0.55,
      accent: "#d9a066",
      exposure: 1.08,
      bloom: 0.7,
    },
    key: { dir: [-0.15, -0.25, 1], color: "#ffb27a", intensity: 1.3 },
    warm: "#ffc89a",
    cool: "#9fb3e6",
  },
  purple: {
    palette: {
      fog: "#170f22",
      fogDensity: 0.03,
      sky: "#5a4280",
      ground: "#0e0815",
      ambient: 0.7,
      floor: "#1e1724",
      floorRoughness: 0.42,
      accent: "#a68cff",
      exposure: 1.0,
      bloom: 0.8,
    },
    key: { dir: [0.4, -0.6, -0.3], color: "#b9a2ff", intensity: 0.5 },
    warm: "#ffb680",
    cool: "#b9a2ff",
  },
  rana: {
    palette: {
      fog: "#2b1f13",
      fogDensity: 0.028,
      sky: "#7a5d3a",
      ground: "#1a1008",
      ambient: 0.5,
      floor: "#2e2419",
      floorRoughness: 0.7,
      accent: "#e0a35c",
      exposure: 1.05,
      bloom: 0.7,
    },
    key: { dir: [0.5, -0.35, 0.6], color: "#ffbf7a", intensity: 1.2 },
    warm: "#ffc078",
    cool: "#e8c9a0",
  },
  gluttony: {
    palette: {
      fog: "#1d0705",
      fogDensity: 0.032,
      sky: "#5a1a14",
      ground: "#100403",
      ambient: 0.42,
      floor: "#24100d",
      floorRoughness: 0.35,
      accent: "#e0574a",
      exposure: 1.0,
      bloom: 0.85,
    },
    key: { dir: [0.2, -0.7, -0.5], color: "#ff8a6a", intensity: 0.45 },
    warm: "#ffab6b",
    cool: "#ff6a52",
  },
};

export function projectLayout(project: Project): WorldLayout {
  const st = stations(project);
  const end = endZ(project);
  const theme = THEMES[project.theme];
  const hotspots: WorldLayout["hotspots"] = {};
  for (const s of st) {
    hotspots[`${project.scene}-${s.section.kind}`] = {
      object: s.object,
      mark: s.mark,
      size: s.section.kind === "stills" || s.section.kind === "sets" ? [1.4, 2.2] : [1.6, 1.8],
    };
  }

  // a light over each station, in order (the rig has 4 spot slots, the rest are points)
  const lights: LightSpec[] = st.slice(0, 4).map((s) => ({
    kind: "spot" as const,
    pos: [s.side * 1.2, 6, s.z + 1.5] as V3,
    target: [s.object[0], 1.2, s.z] as V3,
    color: theme.warm,
    intensity: 38,
    angle: 0.42,
    penumbra: 0.8,
  }));
  st.slice(4, 7).forEach((s) => lights.push({ kind: "point", pos: [s.side * 2.2, 3, s.z], color: theme.warm, intensity: 10, distance: 8 }));
  lights.push({ kind: "point", pos: [0, 3.5, end - 3], color: theme.cool, intensity: 8, distance: 10 });

  const textures = [project.cover.src, ...project.sections.flatMap((s) => s.media.map((m) => m.src))];

  return {
    path: [{ id: "entry", p: [0, 0] }, ...st.map((s) => ({ id: `s${s.index}`, p: [0, s.z] as V2 })), { id: "end", p: [0, end] }],
    exits: {
      film: { p: [-5, end], dir: [-1, 0], via: [[-1.8, end]] },
      set: { p: [-5, end], dir: [-1, 0], via: [[-1.8, end]] },
      production: { p: [5, end], dir: [1, 0], via: [[1.8, end]] },
      made: { p: [5, end], dir: [1, 0], via: [[1.8, end]] },
      career: { p: [0, end - 3], dir: [0, -1] },
      onward: { p: [0, end - 3], dir: [0, -1] },
      default: { p: [-5, end], dir: [-1, 0], via: [[-1.8, end]] },
    },
    hotspots,
    anchors: {
      set: [-3.6, 1.9, end - 2.2],
      made: [3.6, 1.9, end - 2.2],
      onward: [0, 1.9, end - 4.6],
      center: [0, 1.4, end - 3],
    },
    shots: {
      question: { pos: [0, 3.5, end + 7.8], target: [0, 1.4, end - 3], fov: 50 },
    },
    palette: theme.palette,
    key: theme.key,
    lights,
    textures,
  };
}
