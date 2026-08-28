import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@jisane/shared", "@jisane/ui"],
  images: {
    // Supabase Storage public 객체(지식서비스 배너 등)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
