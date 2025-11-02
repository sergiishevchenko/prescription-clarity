import { TextEncoder, TextDecoder } from "util";
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder as any;

(global as any).crypto = (global as any).crypto || require("crypto").webcrypto;

import "./tests-setup/prisma.mock";
import "./tests-setup/cookies.mock";
import "./tests-setup/session.partial-mock";
import "./tests-setup/bcrypt.mock";


let errorSpy: jest.SpyInstance;
beforeAll(() => {
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  errorSpy?.mockRestore();
});

import "./tests-setup/next-headers.mock";
