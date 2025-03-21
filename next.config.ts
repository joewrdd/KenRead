import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["uploads.mangadex.org", "cmdxd98sb0x3yprd.mangadex.network"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.mangadex.network",
        pathname: "/data/**",
      },
    ],
  },
  devIndicators: false,
};

export default nextConfig;
