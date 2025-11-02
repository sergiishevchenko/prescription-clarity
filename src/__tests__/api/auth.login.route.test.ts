import * as bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import * as LoginRoute from "@/app/api/auth/login/route";
import { getSessionCookieName } from "@/lib/auth/session";
import {
  cookieStore,
  mockCookiesAPI,
} from "../../../tests-setup/next-headers.mock";

beforeAll(() => {
  (console.error as any).mockRestore?.(); // відновлює консоль, якщо глобально заглушена в jest.setup.api.ts
});
afterAll(() => {
  // після дебагу можна прибрати цей блок або знову заглушити, якщо треба
});

beforeEach(() => {
  jest.clearAllMocks();
  cookieStore.clear();
});

const makeReq = (body: any) =>
  new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/auth/login", () => {
  it("200 + Set-Cookie on valid credentials", async () => {
    (prisma as any).user.findUnique.mockResolvedValueOnce({
      id: "u1",
      email: "a@b.com",
      passwordHash: "mocked-hash",
    });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

    // @ts-ignore
    const res = await LoginRoute.POST(await makeReq({ email: "a@b.com", password: "Secret123" }));
    if (res.status === 500) {
    // допоміжний лог для локальної діагностики
    console.log("500 body:", await res.text());
    }
    expect(res.status).toBe(200);

    const cookieName = getSessionCookieName();
    expect(mockCookiesAPI.set).toHaveBeenCalled();
    expect(cookieStore.get(cookieName)).toBeTruthy();
  });

  it("400 on invalid payload (fails validation)", async () => {
    // @ts-ignore
    const res = await LoginRoute.POST(await makeReq({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid input data/i);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("401 when email not found", async () => {
    (prisma as any).user.findUnique.mockResolvedValueOnce(null);

    // @ts-ignore
    const res = await LoginRoute.POST(await makeReq({ email: "missing@user.com", password: "Secret123" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/invalid email or password/i);
  });

  it("401 on wrong password", async () => {
    (prisma as any).user.findUnique.mockResolvedValueOnce({
      id: "u1",
      email: "a@b.com",
      passwordHash: "mocked-hash",
    });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

    // @ts-ignore
    const res = await LoginRoute.POST(await makeReq({ email: "a@b.com", password: "bad" }));
    expect(res.status).toBe(401);
  });
});
