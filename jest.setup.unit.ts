import { TextEncoder, TextDecoder } from "util";
import { webcrypto } from "crypto";

const globalForSetup = globalThis as typeof globalThis & {
  TextEncoder?: typeof globalThis.TextEncoder;
  TextDecoder?: typeof globalThis.TextDecoder;
  crypto?: typeof globalThis.crypto;
};

globalForSetup.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
globalForSetup.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
if (!globalForSetup.crypto) {
  globalForSetup.crypto = webcrypto as typeof globalThis.crypto;
}

import "./tests-setup/prisma.mock";
import "./tests-setup/next-headers.mock";
