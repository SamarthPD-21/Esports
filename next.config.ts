import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  cacheLife: {
    // Registrations and results sheets: organisers' edits show up within
    // about a minute.
    tournament: {
      stale: 60,
      revalidate: 60,
      expire: 60 * 60 * 24,
    },
  },
  // The site used to be CODM only; keep old links working.
  async redirects() {
    return [
      { source: "/groups", destination: "/codm/standings", permanent: true },
      { source: "/bracket", destination: "/codm/standings", permanent: true },
      { source: "/schedule", destination: "/codm/schedule", permanent: true },
      { source: "/rules", destination: "/codm/rules", permanent: true },
      { source: "/teams", destination: "/codm/teams", permanent: true },
      { source: "/teams/:id", destination: "/codm/teams/:id", permanent: true },
    ];
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
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
