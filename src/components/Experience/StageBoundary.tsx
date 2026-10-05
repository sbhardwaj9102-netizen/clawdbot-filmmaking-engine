"use client";

import { Component, type ReactNode } from "react";

import { setExperience } from "@/systems/Experience/store";

/**
 * If the 3D stage throws (driver bug, lost context, out of memory), the
 * visitor is not left with a broken page: the stage is removed and the story
 * carries on over still images.
 */
export class StageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[stage] 3D unavailable; continuing over still images.", error);
    setExperience({ webgl: false });
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
