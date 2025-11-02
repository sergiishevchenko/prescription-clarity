import * as bcrypt from "bcryptjs";
import * as LoginRoute from "@/app/api/auth/login/route";
import { getSessionCookieName } from "@/lib/auth/session";
import { prismaMock } from "../../../tests-setup/prisma.mock";
import {
  cookieStore,
  mockCookiesAPI,
} from "../../../tests-setup/next-headers.mock";
import type { MockedFunction } from "jest-mock";

type LoginHandler = typeof LoginRoute.POST;
type LoginRequest = Parameters<LoginHandler>[0];
type LoginPayload = Partial<{
  email: string;
  password: string;
}>;

const makeReq = (body: LoginPayload): LoginRequest =>
  new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as LoginRequest;

const restoreConsoleErrorIfMocked = () => {
  if (jest.isMockFunction(console.error)) {
    (console.error as jest.MockedFunction<typeof console.error>).mockRestore();
  }
};

beforeAll(restoreConsoleErrorIfMocked);
afterAll(restoreConsoleErrorIfMocked);

beforeEach(() => {
  jest.clearAllMocks();
  cookieStore.clear();
});

describe("POST /api/auth/login", () => {
  const compareMock = bcrypt.compare as MockedFunction<typeof bcrypt.compare>;

  it("200 + Set-Cookie on valid credentials", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      email: "a@b.com",
      passwordHash: "mocked-hash",
    });
    compareMock.mockImplementationOnce(async () => true);

    const res = await LoginRoute.POST(
      makeReq({ email: "a@b.com", password: "Secret123" }),
    );
    if (res.status === 500) {
      console.log("500 body:", await res.text());
    }
    expect(res.status).toBe(200);

    const cookieName = getSessionCookieName();
    expect(mockCookiesAPI.set).toHaveBeenCalled();
    expect(cookieStore.get(cookieName)).toBeTruthy();
  });

  it("400 on invalid payload (fails validation)", async () => {
    const res = await LoginRoute.POST(makeReq({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid input data/i);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("401 when email not found", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const res = await LoginRoute.POST(
      makeReq({ email: "missing@user.com", password: "Secret123" }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/invalid email or password/i);
  });

  it("401 on wrong password", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      email: "a@b.com",
      passwordHash: "mocked-hash",
    });
    compareMock.mockImplementationOnce(async () => false);

    const res = await LoginRoute.POST(
      makeReq({ email: "a@b.com", password: "bad" }),
    );
    expect(res.status).toBe(401);
  });
});
