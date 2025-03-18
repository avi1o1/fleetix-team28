import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable eslint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript type checking during builds
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
