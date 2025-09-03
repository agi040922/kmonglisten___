import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript path mapping  
  typedRoutes: true,
  // ESLint 빌드 시 비활성화
  eslint: {
    ignoreDuringBuilds: true,
  },
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
