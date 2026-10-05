/** Small line icons, drawn in currentColor. Decorative: buttons carry their own labels. */
const base = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const SoundOn = () => (
  <svg {...base} aria-hidden>
    <path d="M4 10v4h4l5 4V6L8 10H4z" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 6a8.5 8.5 0 0 1 0 12" />
  </svg>
);

export const SoundOff = () => (
  <svg {...base} aria-hidden>
    <path d="M4 10v4h4l5 4V6L8 10H4z" />
    <path d="M17 9.5l4.5 5M21.5 9.5l-4.5 5" />
  </svg>
);

export const Sun = () => (
  <svg {...base} aria-hidden>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
  </svg>
);

export const Moon = () => (
  <svg {...base} aria-hidden>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </svg>
);

export const Play = () => (
  <svg {...base} aria-hidden>
    <path d="M7 5l12 7-12 7V5z" />
  </svg>
);

export const Pause = () => (
  <svg {...base} aria-hidden>
    <path d="M8 5v14M16 5v14" />
  </svg>
);

export const Next = () => (
  <svg {...base} aria-hidden>
    <path d="M6 5l9 7-9 7V5zM18 5v14" />
  </svg>
);

export const Prev = () => (
  <svg {...base} aria-hidden>
    <path d="M18 5l-9 7 9 7V5zM6 5v14" />
  </svg>
);

export const Close = () => (
  <svg {...base} aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const Arrow = () => (
  <svg {...base} aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const Download = () => (
  <svg {...base} aria-hidden>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </svg>
);
