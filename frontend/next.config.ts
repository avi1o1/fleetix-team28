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
  },
  publicRuntimeConfig: {
    backendUrl: process.env.BACKEND_URL || "http://localhost:3001",
  },
};

export default nextConfig;
