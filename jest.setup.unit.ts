import { TextEncoder, TextDecoder } from "util";
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder as any;
(global as any).crypto = (global as any).crypto || require("crypto").webcrypto;

import "./tests-setup/prisma.mock";
