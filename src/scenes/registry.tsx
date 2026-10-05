"use client";

import type { ComponentType } from "react";

import type { WorldId } from "@/data/story/types";

import { AboutWorld } from "./About/AboutWorld";
import { StudioWorld } from "./Arrival/StudioWorld";
import { BusinessWorld } from "./Business/BusinessWorld";
import { CareerWorld } from "./Career/CareerWorld";
import { EventsWorld } from "./Events/EventsWorld";
import { FilmSetWorld } from "./Film/FilmSetWorld";
import { FinalWorld } from "./Final/FinalWorld";
import { FinanceWorld } from "./Finance/FinanceWorld";
import { ProductionWorld } from "./Production/ProductionWorld";
import { ProjectWorld } from "./Project/ProjectWorld";

/** World id → the component that builds it. */
export const WORLDS: Record<WorldId, ComponentType> = {
  studio: StudioWorld,
  filmset: FilmSetWorld,
  project: ProjectWorld,
  production: ProductionWorld,
  events: EventsWorld,
  finance: FinanceWorld,
  business: BusinessWorld,
  career: CareerWorld,
  about: AboutWorld,
  final: FinalWorld,
};
