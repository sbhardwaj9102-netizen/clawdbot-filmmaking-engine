import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/jetbrains-mono/index.css";
import "./globals.css";

import type { Metadata, Viewport } from "next";

import { profile } from "@/data/profile";

const description =
  "Satyam Bhardwaj — Producer · Strategist. Film, production, business and finance. An interactive film you walk through: the studio, the films, the production office, live events, the economics, and the ambition.";

export const metadata: Metadata = {
  // Set NEXT_PUBLIC_SITE_URL to the deployed domain so social previews resolve.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${profile.name} — ${profile.title}`,
    template: `%s — ${profile.name}`,
  },
  description,
  openGraph: {
    title: `${profile.name} — ${profile.title}`,
    description,
    images: ["/assets/site/hero.jpg"],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050506",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
