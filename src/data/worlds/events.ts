import type { Media } from "../types";

const E = "/assets/events";

/** EVENTS — live event operations in the family business (from the CV). */
export const events = {
  org: "Jai Mata Di Caterers & Event Management",
  place: "Bhagalpur, India",
  role: "Event operations & coordination",
  note: "Family business — operational experience.",
  summary:
    "Planning and running luxury weddings and events in the family business — vendors, service teams, clients and on-ground staff moving to one timeline.",
  pillars: [
    {
      id: "vendors",
      title: "Vendors & Service Teams",
      body: "Coordinating vendors, service teams, clients and on-ground staff.",
      media: [
        { src: `${E}/vendors.jpg`, alt: "Crew building structures under work lights", label: "VENDORS" },
        { src: `${E}/clients.jpg`, alt: "Two people in conversation by a window", label: "CLIENTS" },
      ],
    },
    {
      id: "setup",
      title: "Setup, Catering & Logistics",
      body: "Setup, catering, logistics and service delivery brought together.",
      media: [{ src: `${E}/venue-setup.jpg`, alt: "The hall during setup", label: "SETUP" }],
    },
    {
      id: "deadlines",
      title: "Many Moving Parts",
      body: "Several activities and deadlines handled at the same time.",
      media: [{ src: `${E}/timelines.jpg`, alt: "Venue layout plan on a desk", label: "RUN OF SHOW" }],
    },
    {
      id: "manpower",
      title: "Manpower & Resources",
      body: "Putting people and resources where the event needs them.",
      media: [{ src: `${E}/logistics.jpg`, alt: "Vehicle light trails at night", label: "LOGISTICS" }],
    },
    {
      id: "live",
      title: "Live Delivery",
      body: "Resolving issues as they come up during live events, under time pressure.",
      media: [
        { src: `${E}/live.jpg`, alt: "Guests silhouetted against warm event lights", label: "LIVE" },
        { src: `${E}/venue-live.jpg`, alt: "The hall transformed for a live event", label: "LIVE" },
      ],
    },
  ],
  venue: [
    { src: `${E}/venue-empty.jpg`, alt: "An empty hall", label: "EMPTY VENUE" },
    { src: `${E}/venue-setup.jpg`, alt: "The hall during setup", label: "SETUP" },
    { src: `${E}/venue-live.jpg`, alt: "The hall transformed for a live event", label: "LIVE" },
  ] as Media[],
  gallery: [
    { src: `${E}/cover.jpg`, alt: "A reception under a canopy of lights", label: "EVENT" },
    { src: `${E}/gallery-01.jpg`, alt: "Warm string lights out of focus", label: "EVENT" },
    { src: `${E}/gallery-02.jpg`, alt: "Event detail", label: "EVENT" },
  ] as Media[],
};
