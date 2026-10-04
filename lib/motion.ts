/** One motion language for the whole site: slow, weighted, no bounce. */
export const EASE = [0.76, 0, 0.24, 1] as const; // in-out, for transitions
export const EASE_OUT = [0.16, 1, 0.3, 1] as const; // expo-out, for reveals
export const EASE_SOFT = [0.33, 1, 0.68, 1] as const;

export const DUR = {
  reveal: 1.25,
  slow: 1.6,
  page: 1.05,
  hover: 0.9,
};
