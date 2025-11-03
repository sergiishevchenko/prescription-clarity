import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is default in Next.js 16; use empty config to silence warnings
  turbopack: {},
  experimental: {
    // Ensure Prisma engines are included in serverless functions on Vercel
    outputFileTracingIncludes: {
      "/**/*": [
        "./node_modules/.prisma/client/**",
        "./node_modules/@prisma/client/**"
      ],
    },
  },
};

export default nextConfig;
