/**
 * PROFILE
 * ------------------------------------------------------------------
 * Single source of truth for who Satyam is. Every fact here comes from the
 * CV content already in this repository — nothing is invented. When something
 * is unknown it is left empty and the UI hides it (e.g. `linkedin`).
 */

export const profile = {
  name: "Satyam Bhardwaj",
  first: "SATYAM",
  last: "BHARDWAJ",
  title: "Producer · Strategist",
  disciplines: ["Film", "Production", "Business", "Finance"],
  base: "India / Singapore",

  contact: {
    email: "mrbhardwaj2207@gmail.com",
    phone: "+91 9102458875",
    phoneHref: "tel:+919102458875",
    /**
     * WhatsApp — opens a chat directly (wa.me). Uses the phone number from the CV;
     * change `number` (country code + number, digits only) if WhatsApp is on another number.
     */
    whatsapp: {
      number: "919102458875",
      display: "+91 9102458875",
      message: "Hi Satyam, I came across your portfolio and would like to talk.",
    },
    /**
     * Not present in the repository yet. Paste the full profile URL here
     * (e.g. "https://www.linkedin.com/in/…") and LINKEDIN appears everywhere.
     */
    linkedin: "" as string,
  },

  /**
   * Every image and the reel in /public/assets are generated placeholders. Set to
   * false once they are replaced with real stills, and the notice disappears.
   */
  assetsArePlaceholders: true as boolean,

  /** Generated from /resume by `npm run resume:pdf`. Replace with your own PDF if you prefer. */
  resumePdf: "/resume/Satyam-Bhardwaj-Resume.pdf",

  /** Reel slot. The file in the repo is a generated placeholder — replace it with the real reel. */
  reel: {
    src: "/assets/site/hero.jpg",
    video: "/assets/site/hero.mp4",
    alt: "Reel — placeholder footage of a crew on a hazy set",
    label: "REEL",
  },

  portrait: { src: "/assets/site/portrait.jpg", alt: "Placeholder portrait — a figure on a lit set" },

  /** One paragraph, specific, built only from the facts below. */
  summary:
    "Producer trained at Whistling Woods International (MA Filmmaking — Producing), now studying global finance at SP Jain School of Global Management. Produced the short film ASTER — seven locations in four shoot days — and coordinated production on DEATH AT THE HOUSE OF PURPLE, across four constructed sets and a controlled hut-fire sequence. Plans and runs weddings and live events in the family business. Works on both sides of a production: the schedule, the crew and the set, and the budget, the market and the analysis behind them.",

  short:
    "Film producer with a background in filmmaking, production coordination and live event operations — now studying global finance.",

  education: [
    {
      school: "SP Jain School of Global Management",
      degree: "Master of Global Business — Global Finance",
      when: "Current",
      note: "International academic exposure",
    },
    {
      school: "Whistling Woods International",
      degree: "MA Filmmaking — Producing",
      when: "",
      note: "CGPA 8.5",
    },
    {
      school: "Amity University Kolkata",
      degree: "BA Journalism & Mass Communication",
      when: "2018–2021",
      note: "",
    },
  ],

  experience: [
    {
      org: "ASTER",
      role: "Producer",
      context: "Short film",
      points: [
        "Production coordination across a compressed four-day shoot spanning seven locations.",
        "Kept cast and crew moving as one unit across the four-day, seven-location schedule — creative and operational needs aligned.",
      ],
    },
    {
      org: "DEATH AT THE HOUSE OF PURPLE",
      role: "Production",
      context: "Film",
      points: [
        "Coordinated production-design and logistics needs across four constructed sets.",
        "Safety and on-set execution for a controlled hut-fire sequence.",
      ],
    },
    {
      org: "RANA · GLUTTONY",
      role: "Film production",
      context: "Films",
      points: ["Film production."],
    },
    {
      org: "Jai Mata Di Caterers & Event Management",
      role: "Event operations & coordination",
      context: "Family business · Bhagalpur, India",
      points: [
        "Planning and running luxury weddings and events.",
        "Coordinating vendors, service teams, clients and on-ground staff; setup, catering, logistics and service delivery.",
        "Handling several activities and deadlines at the same time; allocating manpower and resources.",
        "Resolving issues as they come up during live events, under time pressure.",
      ],
    },
  ],

  academicProjects: [
    {
      title: "Industry Integration Project — Arihant Plus, UAE",
      context: "SP Jain School of Global Management · academic project",
      points: [
        "UAE market analysis and competitor analysis.",
        "Customer segmentation and digital marketing strategy.",
        "Customer acquisition framework and strategic recommendations.",
      ],
    },
    {
      title: "Industry Business Research (IBR)",
      context: "SP Jain School of Global Management · academic project",
      points: [
        "Industry research, financial and business analysis.",
        "Data interpretation, strategic analysis, implications and recommendations.",
      ],
    },
  ],

  skills: [
    "Team coordination",
    "Production coordination",
    "Vendor coordination",
    "Scheduling",
    "Stakeholder communication",
    "Event operations",
    "Budgeting",
    "Financial analysis",
    "Market research",
    "Excel & PowerPoint",
  ],

  capabilities: [
    {
      group: "Production",
      items: ["Production coordination", "Scheduling", "Location logistics", "Cast & crew coordination", "On-set safety & execution"],
    },
    {
      group: "Business & Finance",
      items: ["Budgeting", "Financial analysis", "Market research", "Competitor analysis", "Strategic recommendations"],
    },
    {
      group: "Operations",
      items: ["Event operations", "Vendor coordination", "Stakeholder communication", "Manpower & resource allocation", "Live problem-solving"],
    },
  ],

  tools: [
    { name: "Movie Magic Scheduling", note: "Breakdowns and stripboards" },
    { name: "Movie Magic Budgeting", note: "Production budgets" },
    { name: "Excel", note: "Trackers, analysis and reporting" },
    { name: "PowerPoint", note: "Decks for stakeholders" },
  ],
} as const;

export type Profile = typeof profile;
