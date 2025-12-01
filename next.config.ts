import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  allowedDevOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push("@sparticuz/chromium");
      } else if (typeof config.externals === "object") {
        config.externals["@sparticuz/chromium"] = "@sparticuz/chromium";
      } else {
        config.externals = [config.externals, "@sparticuz/chromium"];
      }
    }
    return config;
  },
  outputFileTracingIncludes: {
    "/**/*": [
      "./node_modules/.prisma/client/**",
      "./node_modules/@prisma/client/**",
      "./node_modules/@sparticuz/chromium/**",
      "./node_modules/puppeteer-core/**",
    ],
  },
};

export default nextConfig;
