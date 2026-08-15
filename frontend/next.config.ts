import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore
  allowedDevOrigins: ["*.lhr.life", "*.serveousercontent.com", "localhost"],
  // Disable bottom-left Next.js dev rendering toast
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
