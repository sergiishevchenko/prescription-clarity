import nextJest from "next/jest.js";
const createJestConfig = nextJest({ dir: "./" });

const createConfig = async () => {
  const base = {
    testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
    moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  };

  const api = await createJestConfig({
    ...base,
    displayName: "api",
    testEnvironment: "node",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.api.ts"],
    testMatch: ["<rootDir>/src/__tests__/api/**/*.test.ts?(x)"],
    collectCoverageFrom: [
      "src/app/api/**/*.{ts,tsx}",
      "src/lib/auth/**/*.{ts,tsx}",
      "!src/lib/auth/cookies.ts",
    ],
  })();

  const unit = await createJestConfig({
    ...base,
    displayName: "unit",
    testEnvironment: "node",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.unit.ts"],
    testMatch: ["<rootDir>/src/__tests__/unit/**/*.test.ts?(x)"],
    collectCoverageFrom: ["src/lib/**/*.{ts,tsx}", "!src/lib/auth/cookies.ts"],
  })();

  return {
    projects: [api, unit],
    coverageThreshold: {
      global: { branches: 70, functions: 70, lines: 70, statements: 70 },
    },
  };
};

export default createConfig;
