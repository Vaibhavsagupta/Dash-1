import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore
  allowedDevOrigins: ["*.lhr.life", "*.serveousercontent.com", "localhost"],
  // Disable bottom-left Next.js dev rendering toast
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    let backendDest = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:7000";
    backendDest = backendDest.trim();
    if (backendDest.endsWith('/')) {
      backendDest = backendDest.slice(0, -1);
    }
    if (!backendDest.startsWith('http://') && !backendDest.startsWith('https://')) {
      if (!backendDest.includes('.')) {
        backendDest = `http://${backendDest}:10000`;
      } else {
        backendDest = `https://${backendDest}`;
      }
    }

    return [
      {
        source: '/backend-api/:path*',
        destination: `${backendDest}/:path*`,
      },
    ];
  },
};

export default nextConfig;
