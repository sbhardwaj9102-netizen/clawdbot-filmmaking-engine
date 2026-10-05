/**
 * CAREER — the walk through the chapters. Each chapter is a room in the
 * career corridor; its `mood` picks the room's set dressing and light.
 * Facts only from the CV.
 */
export type CareerMood = "journalism" | "film" | "production" | "global" | "finance" | "now";

export type CareerChapter = {
  id: string;
  index: string;
  title: string;
  mood: CareerMood;
  place: string;
  detail: string;
  when?: string;
  points: string[];
};

export const career: CareerChapter[] = [
  {
    id: "journalism",
    index: "01",
    title: "Journalism",
    mood: "journalism",
    place: "Amity University Kolkata",
    detail: "BA Journalism & Mass Communication",
    when: "2018–2021",
    points: ["The first discipline: media, and how a story reaches an audience."],
  },
  {
    id: "filmmaking",
    index: "02",
    title: "Filmmaking",
    mood: "film",
    place: "Whistling Woods International",
    detail: "MA Filmmaking — Producing",
    when: "CGPA 8.5",
    points: ["A filmmaking degree with a specialisation in producing."],
  },
  {
    id: "production",
    index: "03",
    title: "Production",
    mood: "production",
    place: "On set · On the ground",
    detail: "ASTER · DEATH AT THE HOUSE OF PURPLE · RANA · GLUTTONY",
    points: [
      "Producer on ASTER — seven locations, four shoot days.",
      "Production on DEATH AT THE HOUSE OF PURPLE — four constructed sets, a controlled hut-fire sequence.",
      "Weddings and live events in the family business, Jai Mata Di Caterers & Event Management.",
    ],
  },
  {
    id: "global",
    index: "04",
    title: "Global Management",
    mood: "global",
    place: "SP Jain School of Global Management",
    detail: "Master of Global Business",
    when: "Current",
    points: [
      "International academic exposure — India / Singapore.",
      "Industry Integration Project — Arihant Plus, UAE (academic).",
    ],
  },
  {
    id: "finance",
    index: "05",
    title: "Finance",
    mood: "finance",
    place: "Global Finance",
    detail: "Major — Master of Global Business",
    points: ["Financial and business analysis, budgeting, market research.", "Industry Business Research (IBR) — academic."],
  },
  {
    id: "now",
    index: "06",
    title: "Producer / Strategist",
    mood: "now",
    place: "Now",
    detail: "Film · Production · Business · Finance",
    points: ["One practice: the creative work and the economics behind it."],
  },
];
