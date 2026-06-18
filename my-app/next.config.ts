import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@supabase/ssr"],
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
