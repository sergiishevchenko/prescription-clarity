import { TextEncoder, TextDecoder } from "util";
import { webcrypto, type Crypto } from "crypto";

const globalForSetup = globalThis as typeof globalThis & {
  TextEncoder: typeof TextEncoder;
  TextDecoder: typeof TextDecoder;
  crypto: Crypto;
};

globalForSetup.TextEncoder = TextEncoder;
globalForSetup.TextDecoder = TextDecoder;
if (!globalForSetup.crypto) {
  globalForSetup.crypto = webcrypto as Crypto;
}

import "./tests-setup/prisma.mock";
import "./tests-setup/cookies.mock";
import "./tests-setup/session.partial-mock";
import "./tests-setup/bcrypt.mock";


let errorSpy: jest.SpyInstance<void, Parameters<typeof console.error>>;
beforeAll(() => {
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  errorSpy?.mockRestore();
});

import "./tests-setup/next-headers.mock";
