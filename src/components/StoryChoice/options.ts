"use client";

import { useMemo } from "react";

import { questions } from "@/data/story/questions";
import type { ChoiceOption } from "@/data/story/types";
import { primaryVisited } from "@/systems/SceneManager/director";
import { useStory } from "@/systems/StoryEngine/store";

/** A question's options for display, marking visited routes and adding the converging exit when earned. */
export function useOptions(questionId?: string) {
  const visited = useStory((s) => s.visitedScenes);
  return useMemo(() => {
    const q = questionId ? questions[questionId] : undefined;
    if (!q) return { q: undefined, options: [] as (ChoiceOption & { visited: boolean })[] };
    const list: (ChoiceOption & { visited: boolean })[] = q.options.map((o) => ({ ...o, visited: visited.includes(o.next) }));
    if (q.onward && primaryVisited() >= q.onward.minVisited) {
      list.push({ id: "onward", label: q.onward.label, hint: q.onward.hint, next: q.onward.next, visited: visited.includes(q.onward.next) });
    }
    return { q, options: list };
  }, [questionId, visited]);
}

