import type { Project } from "./types";

const A = "/assets/aster";

/**
 * ASTER — facts from the CV: Producer · short film · 7 locations · 4 shoot days.
 * All images in /assets/aster are placeholders; replace them file-for-file.
 */
export const aster: Project = {
  slug: "aster",
  scene: "aster",
  number: "01",
  title: "ASTER",
  role: "Producer",
  format: "Short film",
  scale: "7 locations · 4 shoot days",
  logline: "Production coordination across a compressed four-day shoot spanning seven locations.",
  cover: { src: `${A}/cover.jpg`, alt: "ASTER — a road through layered hills at dawn" },
  accent: "#d9a066",
  theme: "aster",
  facts: [
    { label: "Role", value: "Producer" },
    { label: "Format", value: "Short film" },
    { label: "Locations", value: "07" },
    { label: "Shoot days", value: "04" },
  ],
  sections: [
    {
      kind: "production",
      title: "Production",
      kicker: "Producer",
      body: ["Production coordination across a compressed four-day shoot spanning seven locations."],
      facts: [
        { label: "Role", value: "Producer" },
        { label: "Format", value: "Short film" },
        { label: "Scope", value: "Production coordination" },
      ],
      media: [
        { src: `${A}/production.jpg`, alt: "Night exterior with camera and crew", label: "PRODUCTION" },
        { src: `${A}/execution.jpg`, alt: "Field monitor on set", label: "ON SET" },
      ],
    },
    {
      kind: "locations",
      title: "Locations",
      kicker: "07 locations",
      body: ["Seven locations inside a four-day shoot."],
      facts: [{ label: "Locations", value: "07" }],
      media: [
        { src: `${A}/location-01.jpg`, alt: "Ridgelines at blue hour", label: "LOCATION" },
        { src: `${A}/location-02.jpg`, alt: "Hills at dusk", label: "LOCATION" },
        { src: `${A}/location-03.jpg`, alt: "Open landscape", label: "LOCATION" },
        { src: `${A}/location-04.jpg`, alt: "Interior with window light", label: "LOCATION" },
      ],
    },
    {
      kind: "schedule",
      title: "Schedule",
      kicker: "04 shoot days",
      body: ["Four shoot days across seven locations — a compressed schedule."],
      facts: [{ label: "Shoot days", value: "04" }],
      media: [{ src: `${A}/scheduling.jpg`, alt: "A production stripboard", label: "STRIPBOARD" }],
    },
    {
      kind: "crew",
      title: "Cast & Crew",
      kicker: "Coordination",
      body: [
        "Keeping cast and crew moving as one unit across a four-day, seven-location schedule — creative and operational needs aligned.",
      ],
      media: [
        { src: `${A}/crew.jpg`, alt: "Crew silhouettes on location", label: "CREW" },
        { src: `${A}/bts-03.jpg`, alt: "Crew under a cold backlight", label: "UNIT" },
      ],
    },
    {
      kind: "bts",
      title: "Behind the Scenes",
      kicker: "BTS",
      media: [
        { src: `${A}/bts-01.jpg`, alt: "Camera operator at the lens", label: "BTS 01" },
        { src: `${A}/bts-02.jpg`, alt: "Light stand and crew member", label: "BTS 02" },
        { src: `${A}/bts-04.jpg`, alt: "Monitor during a take", label: "BTS 03" },
        { src: `${A}/bts-05.jpg`, alt: "Crew moving the camera", label: "BTS 04" },
        { src: `${A}/bts-06.jpg`, alt: "Operator and crew on set", label: "BTS 05" },
        { src: `${A}/execution.jpg`, alt: "Field monitor at video village", label: "BTS 06" },
      ],
    },
    {
      kind: "stills",
      title: "Stills",
      kicker: "Frames",
      media: [
        { src: `${A}/frame-01.jpg`, alt: "Road into the hills at dawn", label: "FRAME 01" },
        { src: `${A}/frame-02.jpg`, alt: "Figure against misty ridges", label: "FRAME 02" },
        { src: `${A}/frame-03.jpg`, alt: "Figure in warm window light", label: "FRAME 03" },
        { src: `${A}/frame-04.jpg`, alt: "Silhouette among city lights", label: "FRAME 04" },
        { src: `${A}/frame-05.jpg`, alt: "Figure walking at dusk", label: "FRAME 05" },
        { src: `${A}/frame-06.jpg`, alt: "Doorway at the end of a room", label: "FRAME 06" },
        { src: `${A}/frame-07.jpg`, alt: "Sun over the valley mist", label: "FRAME 07" },
        { src: `${A}/frame-08.jpg`, alt: "Light trails at night", label: "FRAME 08" },
      ],
    },
  ],
};
