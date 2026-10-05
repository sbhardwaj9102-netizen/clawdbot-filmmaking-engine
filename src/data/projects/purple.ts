import type { Project } from "./types";

const P = "/assets/purple";

/**
 * DEATH AT THE HOUSE OF PURPLE — facts from the CV: Production · four constructed
 * sets · a controlled hut-fire sequence (production design, logistics, safety, on-set execution).
 */
export const purple: Project = {
  slug: "death-at-the-house-of-purple",
  scene: "purple",
  number: "02",
  title: "DEATH AT THE HOUSE OF PURPLE",
  titleLines: ["DEATH AT THE", "HOUSE OF PURPLE"],
  role: "Production",
  format: "Film",
  scale: "4 constructed sets · controlled fire sequence",
  logline: "Four constructed sets and a controlled hut-fire sequence.",
  cover: { src: `${P}/cover.jpg`, alt: "A violet room with a lit doorway and a figure" },
  accent: "#a68cff",
  theme: "purple",
  facts: [
    { label: "Role", value: "Production" },
    { label: "Sets", value: "04 constructed" },
    { label: "Sequence", value: "Controlled hut-fire" },
  ],
  sections: [
    {
      kind: "production",
      title: "Production",
      kicker: "Production design · logistics · safety",
      body: [
        "Coordinating production-design and logistics needs across four constructed sets, plus safety and on-set execution for a controlled hut-fire sequence.",
      ],
      facts: [
        { label: "Role", value: "Production" },
        { label: "Constructed sets", value: "04" },
        { label: "Sequence", value: "Controlled hut-fire" },
      ],
      media: [{ src: `${P}/planning.jpg`, alt: "Floor plan with the effects zone marked", label: "PLANNING" }],
    },
    {
      kind: "sets",
      title: "Four Constructed Sets",
      kicker: "Production design & logistics",
      body: ["Design and logistical requirements coordinated across departments for four constructed sets."],
      facts: [{ label: "Sets", value: "04" }],
      media: [
        { src: `${P}/set-01.jpg`, alt: "Long violet corridor set", label: "SET 01" },
        { src: `${P}/set-02.jpg`, alt: "Bedroom set with window light", label: "SET 02" },
        { src: `${P}/set-03.jpg`, alt: "Study set lit by a single lamp", label: "SET 03" },
        { src: `${P}/set-04.jpg`, alt: "Dining room set", label: "SET 04" },
        { src: `${P}/construction.jpg`, alt: "Set flats under construction", label: "BUILD" },
      ],
    },
    {
      kind: "fire",
      title: "Controlled Fire Sequence",
      kicker: "Safety & on-set execution",
      body: ["Safety, production requirements and on-set execution brought together for a controlled hut-fire sequence."],
      media: [
        { src: `${P}/fire-01.jpg`, alt: "Supervised fire effect on set", label: "FIRE" },
        { src: `${P}/safety.jpg`, alt: "Extinguishers on standby behind a marked line", label: "SAFETY" },
        { src: `${P}/execution.jpg`, alt: "Controlled flame on set, supervised by crew", label: "EXECUTION" },
      ],
    },
    {
      kind: "bts",
      title: "Behind the Scenes",
      kicker: "BTS",
      media: [
        { src: `${P}/bts-01.jpg`, alt: "Crew on the violet set", label: "BTS 01" },
        { src: `${P}/bts-02.jpg`, alt: "Light stand and crew", label: "BTS 02" },
        { src: `${P}/bts-03.jpg`, alt: "Team briefing on set", label: "BTS 03" },
      ],
    },
  ],
};
