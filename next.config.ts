import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    // Ignore ESLint during builds to prevent warnings from failing deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow build to continue even with TypeScript errors in production
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  }
};

export default nextConfig;
