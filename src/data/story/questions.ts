import type { Question } from "./types";

/**
 * QUESTIONS — the choices the visitor makes. Each option routes to a scene.
 * `onward` is the converging exit toward the career path; it appears once the
 * visitor has seen enough of the worlds to understand the person.
 */
const onward = {
  label: "Who is behind this?",
  hint: "The path — career, about, contact",
  next: "career" as const,
  minVisited: 2,
};

export const questions: Record<string, Question> = {
  "after-story": {
    id: "after-story",
    prompt: "But what happens after the story?",
    options: [
      { id: "make", label: "Make it", hint: "Film · Production · Creative execution", next: "film" },
      { id: "finance", label: "Finance it", hint: "Business · Strategy · Production economics", next: "finance" },
      { id: "build", label: "Build it", hint: "Entrepreneurship · Systems · Future", next: "business" },
    ],
  },
  "film-interest": {
    id: "film-interest",
    prompt: "What interests you more?",
    options: [
      { id: "story", label: "Story", hint: "Enter the world of ASTER", next: "aster" },
      { id: "made", label: "How it was made", hint: "The production office", next: "production" },
    ],
    onward,
  },
  "after-project": {
    id: "after-project",
    options: [
      { id: "set", label: "Back to the set", hint: "The other films", next: "film" },
      { id: "made", label: "How it was made", hint: "The production office", next: "production" },
    ],
    onward,
  },
  "project-works": {
    id: "project-works",
    prompt: "What makes a project work?",
    options: [
      { id: "creativity", label: "Creativity", hint: "The films", next: "film" },
      { id: "execution", label: "Execution", hint: "Live events", next: "events" },
      { id: "economics", label: "Economics", hint: "Production finance", next: "finance" },
    ],
    onward,
  },
  "after-events": {
    id: "after-events",
    prompt: "Every event runs on a budget.",
    options: [
      { id: "money", label: "Follow the money", hint: "Finance", next: "finance" },
      { id: "plan", label: "Back to the plan", hint: "Production", next: "production" },
    ],
    onward,
  },
  "after-finance": {
    id: "after-finance",
    prompt: "Where would you put it to work?",
    options: [
      { id: "make", label: "Make it", hint: "The films", next: "film" },
      { id: "build", label: "Build it", hint: "The long-term direction", next: "business" },
    ],
    onward,
  },
  "after-business": {
    id: "after-business",
    prompt: "An ambition is only as good as the work under it.",
    options: [
      { id: "work", label: "See the work", hint: "The films", next: "film" },
      { id: "numbers", label: "See the numbers", hint: "Finance", next: "finance" },
    ],
    onward,
  },
  next: {
    id: "next",
    prompt: "Where would you take it next?",
    options: [
      { id: "make", label: "Make it", hint: "The next film", next: "final" },
      { id: "scale", label: "Scale it", hint: "The next slate", next: "final" },
      { id: "build", label: "Build it", hint: "The next company", next: "final" },
    ],
  },
};

/** The last answer changes the light outside the final door, and the last line. */
export const finale = {
  questionId: "next",
  variants: {
    make: { line: "The next film starts with a conversation.", sky: "#ffb36b" },
    scale: { line: "From one production to many.", sky: "#9cc3ff" },
    build: { line: "From working inside the system to building one.", sky: "#ffe0a3" },
  } as Record<string, { line: string; sky: string }>,
  fallback: { line: "The next one starts with a conversation.", sky: "#ffd7a1" },
};
