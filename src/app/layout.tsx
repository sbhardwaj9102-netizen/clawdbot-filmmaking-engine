import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/jetbrains-mono/index.css";
import "./globals.css";

import type { Metadata, Viewport } from "next";

import { profile } from "@/data/profile";

const description =
  "Satyam Bhardwaj — Producer · Strategist. A two-minute interactive film: a producer with hands-on film production and live event experience, now building the business and finance side, on the way to a production company of his own.";

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
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0c" },
    { media: "(prefers-color-scheme: light)", color: "#f3efe7" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Theme before first paint: a saved choice, else the system preference.
 * (An inline script in <head>, so the page never flashes the wrong theme.)
 */
const themeScript = `(function(){try{var t=localStorage.getItem("sb.theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
