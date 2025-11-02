import "@testing-library/jest-dom";
import "@/__tests__/setup/prisma.mock";
import "@/__tests__/setup/bcrypt.mock";
import "@/__tests__/setup/cookies.mock";
import "@/__tests__/setup/session.mock";

// Polyfill for TextEncoder/TextDecoder in Jest environment
import { TextEncoder, TextDecoder } from "util";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill for crypto.subtle in Jest environment
import { webcrypto } from "crypto";
global.crypto = {
  ...webcrypto,
  subtle: webcrypto.subtle,
};

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  usePathname() {
    return "/";
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock Next.js cookies
jest.mock("next/headers", () => ({
  cookies() {
    return {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };
  },
}));

// Prisma mocking is done in individual test files
