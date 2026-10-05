import type { NextConfig } from "next";

// Static export: `npm run build` writes a fully static site to ./out that can be
// hosted anywhere (Vercel, Netlify, Cloudflare Pages, S3, GitHub Pages…).
//
// To host under a sub-path (e.g. GitHub Pages project sites), build with
//   NEXT_PUBLIC_BASE_PATH=/repo-name npm run build
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
