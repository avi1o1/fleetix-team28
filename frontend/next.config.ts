import type { NextConfig } from "next";
import { Mr_Bedfort } from "next/font/google";

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
