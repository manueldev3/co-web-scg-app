import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.uexcorp.space",
      },
    ],
  },
};

export default nextConfig;
