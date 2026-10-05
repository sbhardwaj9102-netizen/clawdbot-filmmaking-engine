import type { Metadata } from "next";

import { QuickMode } from "@/components/QuickMode/QuickMode";

export const metadata: Metadata = {
  title: "Quick Mode",
  description: "Satyam Bhardwaj — work, experience, capabilities, about, resume and contact on one page.",
};

/** Quick Mode as a plain, fast, static page — no WebGL, nothing to wait for. */
export default function QuickPage() {
  return (
    <main>
      <QuickMode />
    </main>
  );
}
