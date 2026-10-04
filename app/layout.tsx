import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/jetbrains-mono/index.css";
import "./globals.css";

import type { Metadata, Viewport } from "next";

import { FilmGrain } from "@/components/layout/FilmGrain";
import { site } from "@/data/site";
import { Providers } from "./providers";

export const metadata: Metadata = {
  // Set NEXT_PUBLIC_SITE_URL to the deployed domain so social previews resolve.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Satyam Bhardwaj — Film Producer & Entertainment Operations",
    template: "%s — Satyam Bhardwaj",
  },
  description: site.description,
  openGraph: {
    title: "Satyam Bhardwaj — Film Producer",
    description: site.description,
    images: ["/assets/site/hero.jpg"],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip">
          Skip to content
        </a>
        <Providers>{children}</Providers>
        <FilmGrain />
      </body>
    </html>
  );
}
