import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kgndqzrluavpnsomckzy.supabase.co',
      },
    ],
  },
};

export default nextConfig;
