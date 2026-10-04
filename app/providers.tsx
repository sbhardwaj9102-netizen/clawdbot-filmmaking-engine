"use client";

import { MotionConfig } from "framer-motion";

import { Cursor } from "@/components/layout/Cursor";
import { Nav } from "@/components/layout/Nav";
import { TransitionProvider } from "@/components/layout/TransitionProvider";
import { SmoothScroll } from "@/lib/smooth-scroll";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScroll>
        <TransitionProvider>
          <Nav />
          {children}
          <Cursor />
        </TransitionProvider>
      </SmoothScroll>
    </MotionConfig>
  );
}
