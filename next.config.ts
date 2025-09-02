import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript path mapping  
  typedRoutes: true,
  turbopack: {
    resolveAlias: {
      "@": "./src",
      "@/*": "./src/*",
      "@/lib": "./src/lib",
      "@/lib/*": "./src/lib/*",
    },
  },
};

export default nextConfig;
