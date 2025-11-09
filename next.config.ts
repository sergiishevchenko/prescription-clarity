import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is default in Next.js 16; use empty config to silence warnings
  turbopack: {},
  // Allow dev requests from both localhost and 127.0.0.1 to avoid
  // cross-origin warnings when the page and assets differ by host.
  allowedDevOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
  // Ensure Prisma engines are included in serverless functions on Vercel
  outputFileTracingIncludes: {
    "/**/*": [
      "./node_modules/.prisma/client/**",
      "./node_modules/@prisma/client/**",
    ],
  },
};

export default nextConfig;
