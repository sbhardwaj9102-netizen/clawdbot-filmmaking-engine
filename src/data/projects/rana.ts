import type { Project } from "./types";

const R = "/assets/rana";

/** RANA — the CV lists the role as film production. Nothing further is claimed. */
export const rana: Project = {
  slug: "rana",
  scene: "rana",
  number: "03",
  title: "RANA",
  role: "Film production",
  format: "Film",
  logline: "Film production.",
  cover: { src: `${R}/cover.jpg`, alt: "A fort on a ridge in dust-filled evening light" },
  accent: "#e0a35c",
  theme: "rana",
  facts: [{ label: "Role", value: "Film production" }],
  sections: [
    {
      kind: "production",
      title: "Production",
      kicker: "Film production",
      body: ["Film production."],
      facts: [{ label: "Role", value: "Film production" }],
      media: [{ src: `${R}/poster.jpg`, alt: "A fort silhouetted against a dusty sky", label: "RANA" }],
    },
    {
      kind: "stills",
      title: "Stills",
      kicker: "Frames",
      media: [
        { src: `${R}/still-01.jpg`, alt: "Sunlit corridor of arches", label: "STILL 01" },
        { src: `${R}/still-02.jpg`, alt: "Desert road at evening", label: "STILL 02" },
        { src: `${R}/still-03.jpg`, alt: "Figure among torch light", label: "STILL 03" },
        { src: `${R}/still-04.jpg`, alt: "Crew on location", label: "STILL 04" },
      ],
    },
  ],
};
