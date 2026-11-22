import type { NextConfig } from "next";

// showcase branch: a static export, built once and served as plain files
// (GitHub Pages). PAGES_BASE_PATH is the repo path on Pages, e.g. /Esports;
// left empty for local dev and for a site on its own domain.
const basePath = process.env.PAGES_BASE_PATH?.replace(/\/$/, "") ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // /codm/schedule/index.html, so any static host serves it without rewrites.
  trailingSlash: true,
  // Cache Components need a server (partial prerendering can't be exported);
  // every page here is plain HTML built from data read once at build time.
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
