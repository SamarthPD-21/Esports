import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  cacheLife: {
    // Public tournament data. Staff writes call updateTag() so results show
    // immediately; this lifetime is just a safety net.
    tournament: {
      stale: 60,
      revalidate: 60,
      expire: 60 * 60 * 24,
    },
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
