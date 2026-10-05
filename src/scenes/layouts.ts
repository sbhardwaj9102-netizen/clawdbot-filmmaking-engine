import { getProject } from "@/data/projects";
import type { StoryScene, WorldId } from "@/data/story/types";

import { aboutLayout } from "./About/layout";
import { studioLayout } from "./Arrival/layout";
import { businessLayout } from "./Business/layout";
import { careerLayout } from "./Career/layout";
import { eventsLayout } from "./Events/layout";
import { filmLayout } from "./Film/layout";
import { finalLayout } from "./Final/layout";
import { financeLayout } from "./Finance/layout";
import { productionLayout } from "./Production/layout";
import { projectLayout } from "./Project/layout";
import type { WorldLayout } from "./types";

/**
 * Layout registry (no React here — the director imports it).
 * A new kind of place = a new folder in /src/scenes with a layout and a
 * component, registered here and in ./registry.tsx.
 */
const fixed: Partial<Record<WorldId, WorldLayout>> = {
  studio: studioLayout,
  filmset: filmLayout,
  production: productionLayout,
  events: eventsLayout,
  finance: financeLayout,
  business: businessLayout,
  career: careerLayout,
  about: aboutLayout,
  final: finalLayout,
};

const cache = new Map<string, WorldLayout>();

export function getLayout(scene: StoryScene): WorldLayout {
  if (scene.world !== "project") return fixed[scene.world]!;
  let l = cache.get(scene.id);
  if (!l) {
    l = projectLayout(getProject(scene.project ?? scene.id)!);
    cache.set(scene.id, l);
  }
  return l;
}
