import type { Metadata } from "next";

import { QuickView } from "@/components/QuickView/QuickView";

export const metadata: Metadata = {
  title: "Quick view",
  description: "Satyam Bhardwaj — about, selected work, resume, skills, education and contact on one page.",
};

/** Quick view as a plain, fast, static page — no WebGL, nothing to wait for. */
export default function QuickPage() {
  return (
    <main>
      <QuickView />
    </main>
  );
}
