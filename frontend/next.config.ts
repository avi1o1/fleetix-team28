import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Skip ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip TypeScript type checking during builds
    ignoreBuildErrors: true,
  },
  publicRuntimeConfig: {
    backendUrl: process.env.BACKEND_URL || "http://localhost:3001",
  },
};

export default nextConfig;
