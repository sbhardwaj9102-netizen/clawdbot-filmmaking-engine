import type { Project } from "./types";

const G = "/assets/gluttony";

/** GLUTTONY — the CV lists the role as film production. Nothing further is claimed. */
export const gluttony: Project = {
  slug: "gluttony",
  scene: "gluttony",
  number: "04",
  title: "GLUTTONY",
  role: "Film production",
  format: "Film",
  logline: "Film production.",
  cover: { src: `${G}/cover.jpg`, alt: "A long candle-lit banquet table in a crimson room" },
  accent: "#e0574a",
  theme: "gluttony",
  status: "Production details for this film are being prepared for the portfolio.",
  facts: [{ label: "Role", value: "Film production" }],
  sections: [
    {
      kind: "production",
      title: "Production",
      kicker: "Film production",
      body: ["Film production.", "Production details for this film are being prepared for the portfolio."],
      facts: [{ label: "Role", value: "Film production" }],
      media: [{ src: `${G}/poster.jpg`, alt: "Banquet table in crimson light", label: "GLUTTONY" }],
    },
    {
      kind: "stills",
      title: "Stills",
      kicker: "Frames",
      media: [
        { src: `${G}/still-01.jpg`, alt: "Red and amber bokeh", label: "STILL 01" },
        { src: `${G}/still-02.jpg`, alt: "Figure in a crimson doorway", label: "STILL 02" },
        { src: `${G}/still-03.jpg`, alt: "Dining room in red light", label: "STILL 03" },
        { src: `${G}/still-04.jpg`, alt: "Crew on set", label: "STILL 04" },
      ],
    },
  ],
};
