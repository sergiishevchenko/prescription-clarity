import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  allowedDevOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
  serverExternalPackages: ["puppeteer-core"],
  outputFileTracingIncludes: {
    "/**/*": [
      "./node_modules/.prisma/client/**",
      "./node_modules/@prisma/client/**",
      "./node_modules/@sparticuz/chromium/**",
      "./node_modules/puppeteer-core/**",
      "./node_modules/follow-redirects/**",
    ],
  },
};

export default nextConfig;
