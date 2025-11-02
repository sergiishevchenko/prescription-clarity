import {
  createSession,
  verifySession,
  destroySession,
  getSessionCookieName,
  extractTokenFromRequest,
  getSessionUserFromCookies,
  getSessionUserFromRequest,
} from "@/lib/auth/session";
import { prismaMock } from "../../../tests-setup/prisma.mock";
import { cookieStore } from "../../../tests-setup/next-headers.mock";

const future = (ms = 24 * 60 * 60 * 1000) => new Date(Date.now() + ms);
const hashToken = async (token: string) => {
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

describe("Session Management", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cookieStore.clear();
  });

  describe("createSession", () => {
    it("creates a session and returns a token", async () => {
      prismaMock.session.create.mockResolvedValueOnce({
        id: "s1",
        userId: "user-123",
        tokenHash: "hash",
        expiresAt: future(),
      });

      const token = await createSession("user-123");

      expect(typeof token).toBe("string");
      expect(token).toHaveLength(64);
      expect(prismaMock.session.create).toHaveBeenCalledWith({
        data: {
          userId: "user-123",
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        },
      });
    });
  });

  describe("verifySession", () => {
    it("returns null for invalid token (not found)", async () => {
      prismaMock.session.findUnique.mockResolvedValueOnce(null);

      const result = await verifySession("invalid-token");
      expect(result).toBeNull();
    });

    it("returns user data for valid session", async () => {
      prismaMock.session.findUnique.mockResolvedValueOnce({
        tokenHash: "hash",
        expiresAt: future(),
        user: { id: "user-123", email: "test@example.com", name: "Test User" },
      });

      const result = await verifySession("valid-token");
      expect(result).toEqual({
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
      });
    });

    it("returns null if session expired", async () => {
      prismaMock.session.findUnique.mockResolvedValueOnce({
        tokenHash: "hash",
        expiresAt: new Date(Date.now() - 1000),
        user: { id: "user-123", email: "t@example.com", name: "T" },
      });

      const result = await verifySession("expired-token");
      expect(result).toBeNull();
    });
  });

  describe("destroySession", () => {
    it("deletes by token hash", async () => {
      prismaMock.session.deleteMany.mockResolvedValueOnce({ count: 1 });

      await destroySession("valid-token");

      expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
        where: { tokenHash: expect.any(String) },
      });
    });
  });

  it("getSessionCookieName returns default/ENV name", () => {
    const name = getSessionCookieName();
    expect(typeof name).toBe("string");
    expect(name.length).toBeGreaterThan(0);
  });

  describe("Session helpers", () => {
    it("extractTokenFromRequest pulls token from header", () => {
      const cookieName = getSessionCookieName();
      const reqWithCookie = new Request("http://localhost", {
        headers: { cookie: `${cookieName}=token123; other=value` },
      });
      const reqWithoutCookie = new Request("http://localhost", {
        headers: { cookie: "other=value" },
      });

      expect(extractTokenFromRequest(reqWithCookie)).toBe("token123");
      expect(extractTokenFromRequest(reqWithoutCookie)).toBeNull();
    });

    it("getSessionUserFromCookies returns user when cookie exists", async () => {
      const cookieName = getSessionCookieName();
      const token = "token-123";
      cookieStore.set(cookieName, token);
      prismaMock.session.findUnique.mockResolvedValueOnce({
        tokenHash: await hashToken(token),
        expiresAt: future(),
        user: { id: "u1", email: "a@b.com", name: "User" },
      });

      const user = await getSessionUserFromCookies();

      expect(user).toEqual({ id: "u1", email: "a@b.com", name: "User" });
    });

    it("getSessionUserFromCookies returns null when cookie missing", async () => {
      const user = await getSessionUserFromCookies();
      expect(user).toBeNull();
    });

    it("getSessionUserFromRequest extracts token", async () => {
      const cookieName = getSessionCookieName();
      const token = "req-token";
      prismaMock.session.findUnique.mockResolvedValueOnce({
        tokenHash: await hashToken(token),
        expiresAt: future(),
        user: { id: "u2", email: "user@example.com", name: "User" },
      });
      const req = new Request("http://localhost", {
        headers: { cookie: `${cookieName}=${token}` },
      });

      const user = await getSessionUserFromRequest(req);

      expect(user).toEqual({
        id: "u2",
        email: "user@example.com",
        name: "User",
      });
    });

    it("getSessionUserFromRequest returns null when token missing", async () => {
      const req = new Request("http://localhost", { headers: {} });

      const user = await getSessionUserFromRequest(req);
      expect(user).toBeNull();
    });
  });
});
