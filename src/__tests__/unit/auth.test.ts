import { prisma } from "@/lib/db";
import {
  createSession,
  verifySession,
  destroySession,
  getSessionCookieName,
} from "@/lib/auth/session";

// Хелпери
const future = (ms = 24 * 60 * 60 * 1000) => new Date(Date.now() + ms);

describe("Session Management", () => {
  describe("createSession", () => {
    it("creates a session and returns a token", async () => {
      // мок створення сесії в БД
      (prisma as any).session.create.mockResolvedValueOnce({
        id: "s1",
        userId: "user-123",
        tokenHash: "hash",
        expiresAt: future(),
      });

      const token = await createSession("user-123");

      expect(typeof token).toBe("string");
      expect(token).toHaveLength(64); // 32 байти у hex
      expect((prisma as any).session.create).toHaveBeenCalledWith({
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
      (prisma as any).session.findUnique.mockResolvedValueOnce(null);
      const result = await verifySession("invalid-token");
      expect(result).toBeNull();
    });

    it("returns user data for valid session", async () => {
      (prisma as any).session.findUnique.mockResolvedValueOnce({
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
      (prisma as any).session.findUnique.mockResolvedValueOnce({
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
      (prisma as any).session.deleteMany.mockResolvedValueOnce({ count: 1 });
      await destroySession("valid-token");
      expect((prisma as any).session.deleteMany).toHaveBeenCalledWith({
        where: { tokenHash: expect.any(String) },
      });
    });
  });

  it("getSessionCookieName returns default/ENV name", () => {
    const name = getSessionCookieName();
    expect(typeof name).toBe("string");
    expect(name.length).toBeGreaterThan(0);
  });
});
