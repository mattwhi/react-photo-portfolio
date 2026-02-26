import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-8eb941856d0643be8e755b034125eff5.r2.dev",
        pathname: "/**",
      },
    ],
  },

  // Fix the dev warning when loading the site via LAN IP (e.g. 192.168.0.156)
  allowedDevOrigins: ["http://localhost:3000", "http://192.168.0.156:3000"],
};

export default nextConfig;
