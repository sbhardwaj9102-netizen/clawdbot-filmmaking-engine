"use client";

import { Component, type ReactNode } from "react";

import { useStory } from "@/systems/StoryEngine/store";

/**
 * If the 3D stage throws (driver bug, lost context, out of memory), the
 * visitor is not left with a broken page: the stage is removed and Quick Mode
 * opens with everything in it.
 */
export class StageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[stage] 3D experience unavailable, switching to Quick Mode.", error);
    useStory.setState({ webgl: false, overlay: "quick" });
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
