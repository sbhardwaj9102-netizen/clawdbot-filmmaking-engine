/**
 * SITE CONTENT
 * ------------------------------------------------------------------
 * Everything on the home page that isn't a project lives here.
 * Images are referenced from /public/assets/** — overwrite a file with
 * a real still of the same name, or change the path below.
 */

const E = "/assets/events";

export const site = {
  name: { first: "SATYAM", last: "BHARDWAJ" },
  roles: ["Film Producer", "Entertainment Operations"],
  tagline: "Stories are built long before the camera rolls.",
  description:
    "Satyam Bhardwaj — film producer and entertainment-operations professional. Production, scheduling, location logistics and live event execution.",

  hero: {
    // Swap these for a real showreel loop + poster frame.
    video: "/assets/site/hero.mp4",
    poster: "/assets/site/hero.jpg",
    alt: "A film crew silhouetted against a hazy backlight on set",
  },

  /** The proof strip at the bottom of the opening screen. */
  proof: [
    { value: "07", label: "Locations", project: "Aster" },
    { value: "04", label: "Shoot days", project: "Aster" },
    { value: "04", label: "Constructed sets", project: "House of Purple" },
    { value: "01", label: "Controlled fire sequence", project: "House of Purple" },
  ],

  nav: [
    { label: "Work", href: "/#work" },
    { label: "About", href: "/#about" },
    { label: "Contact", href: "/#contact" },
  ],

  contact: {
    phone: "+91 9102458875",
    phoneHref: "tel:+919102458875",
    email: "mrbhardwaj2207@gmail.com",
    locations: "India / Singapore",
  },

  work: {
    intro: "Independent films produced and coordinated from development to delivery.",
  },

  process: {
    heading: ["FROM", "SCRIPT", "TO SCREEN"],
    intro: "A producer's job is to turn intent into a plan, and a plan into a finished film.",
    steps: [
      { title: "Develop", body: "Script, scope and intent — breaking the story down into what it will really take to make." },
      { title: "Plan", body: "Budgets, locations, departments and risk, shaped into a plan every team can work from." },
      { title: "Schedule", body: "Stripboards, day-out-of-days and call sheets that respect daylight, travel and people." },
      { title: "Coordinate", body: "Cast, crew, vendors and permissions moving as a single unit." },
      { title: "Execute", body: "On the ground, solving in real time without losing the day." },
      { title: "Deliver", body: "Picture lock, deliverables and a film ready for its audience." },
    ],
    capabilities: [
      "Film Production",
      "Production Coordination",
      "Location Logistics",
      "Scheduling",
      "Vendor Coordination",
      "Event Operations",
      "Stakeholder Management",
      "On-Ground Execution",
    ],
  },

  events: {
    heading: ["LIVE", "EXECUTION"],
    intro:
      "Weddings and live events, run from first brief to final guest — coordinating clients, vendors and crews while the plan changes in real time.",
    pillars: [
      { title: "Clients", body: "Turning a client's vision into a run-of-show, and keeping them informed when it changes.", image: { src: `${E}/clients.jpg`, alt: "Two people in conversation by a window", caption: "CLIENT WALKTHROUGH" } },
      { title: "Vendors", body: "Décor, AV, catering and fabrication teams briefed, scheduled and held to the plan.", image: { src: `${E}/vendors.jpg`, alt: "Crew building structures under work lights", caption: "VENDOR LOAD-IN" } },
      { title: "Timelines", body: "Load-in to load-out, built backwards from the moment that matters.", image: { src: `${E}/timelines.jpg`, alt: "Venue layout plan on a desk", caption: "RUN-OF-SHOW — V7" } },
      { title: "Logistics", body: "Transport, power, access and contingencies resolved before guests arrive.", image: { src: `${E}/logistics.jpg`, alt: "Vehicle light trails at night", caption: "TRANSPORT — 02:40" } },
      { title: "Live Delivery", body: "Running the floor in real time — cues, people and problems, handled quietly.", image: { src: `${E}/live.jpg`, alt: "Guests silhouetted against warm event lights", caption: "SHOWTIME" } },
    ],
    transformation: [
      { label: "Empty Venue", time: "T – 48:00", image: { src: `${E}/venue-empty.jpg`, alt: "An empty hall in daylight" } },
      { label: "Setup", time: "T – 12:00", image: { src: `${E}/venue-setup.jpg`, alt: "The hall during setup with truss and crew" } },
      { label: "Live Event", time: "T 00:00", image: { src: `${E}/venue-live.jpg`, alt: "The hall transformed for a live event" } },
    ],
    closing: "Comfortable in the room when the plan changes — people, vendors and logistics moving in real time.",
    gallery: [
      { src: `${E}/cover.jpg`, alt: "A wedding reception under a canopy of lights" },
      { src: `${E}/gallery-01.jpg`, alt: "Warm string lights out of focus" },
    ],
  },

  about: {
    bio: "Film producer with a background in filmmaking, production coordination and live event operations, currently pursuing global finance studies with international academic exposure.",
    portrait: { src: "/assets/site/portrait.jpg", alt: "Placeholder portrait — a producer overlooking a lit set" },
    education: [
      { school: "SP Jain School of Global Management", degree: "Master of Global Business — Global Finance", note: "Current" },
      { school: "Whistling Woods International", degree: "MA Filmmaking — Producing", note: "CGPA 8.5" },
      { school: "Amity University Kolkata", degree: "BA Journalism & Mass Communication", note: "" },
    ],
  },

  toolkit: [
    { name: "Movie Magic", note: "Scheduling & budgeting software" },
    { name: "Scheduling", note: "Stripboards · DOOD · call sheets" },
    { name: "Budgeting", note: "Top sheets · cost reports" },
    { name: "Excel", note: "Trackers · models · reporting" },
    { name: "Production", note: "Development to delivery" },
    { name: "Event Operations", note: "Weddings · live events" },
    { name: "Project Management", note: "Stakeholders · timelines · risk" },
  ],

  closing: ["LET'S", "MAKE", "SOMETHING", "WORTH", "WATCHING."],
};
