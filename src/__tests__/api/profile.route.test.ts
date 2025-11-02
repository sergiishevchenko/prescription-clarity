import { prisma } from "@/lib/db";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import * as ProfileRoute from "@/app/api/profile/route";

// Хелпер для Request
const makeReq = (method: "GET" | "PATCH", body?: any) =>
  new Request("http://localhost/api/profile", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

describe("/api/profile route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET → 401 when no session cookie", async () => {
    (getSessionCookie as jest.Mock).mockResolvedValueOnce(null);

    // @ts-ignore Next route function signature
    const res = await ProfileRoute.GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/Unauthorized/i);
  });

  it("GET → 401 when invalid session", async () => {
    (getSessionCookie as jest.Mock).mockResolvedValueOnce("invalid");
    (verifySession as jest.Mock).mockResolvedValueOnce(null);

    // @ts-ignore
    const res = await ProfileRoute.GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid session/i);
  });

  it("GET → 200 returns { user }", async () => {
    (getSessionCookie as jest.Mock).mockResolvedValueOnce("token");
    (verifySession as jest.Mock).mockResolvedValueOnce({ id: "u1", email: "a@b.com", name: "User" });

    // route.ts повертає { user } без додаткового звернення до БД
    // @ts-ignore
    const res = await ProfileRoute.GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.email).toBe("a@b.com");
  });

  it("PATCH → 401 when no session cookie", async () => {
    (getSessionCookie as jest.Mock).mockResolvedValueOnce(null);

    // @ts-ignore
    const res = await ProfileRoute.PATCH(await makeReq("PATCH", { name: "New" }));
    expect(res.status).toBe(401);
  });

  it("PATCH → 401 when invalid session", async () => {
    (getSessionCookie as jest.Mock).mockResolvedValueOnce("invalid");
    (verifySession as jest.Mock).mockResolvedValueOnce(null);

    // @ts-ignore
    const res = await ProfileRoute.PATCH(await makeReq("PATCH", { name: "New" }));
    expect(res.status).toBe(401);
  });

  it("PATCH → 400 when email already in use", async () => {
    (getSessionCookie as jest.Mock).mockResolvedValueOnce("token");
    (verifySession as jest.Mock).mockResolvedValueOnce({ id: "u1", email: "a@b.com", name: "User" });

    (prisma as any).user.findUnique.mockResolvedValueOnce({ id: "u2", email: "busy@b.com" });

    // @ts-ignore
    const res = await ProfileRoute.PATCH(await makeReq("PATCH", { email: "busy@b.com" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Email already in use/i);
  });

  it("PATCH → 200 updates name", async () => {
    (getSessionCookie as jest.Mock).mockResolvedValueOnce("token");
    (verifySession as jest.Mock).mockResolvedValueOnce({ id: "u1", email: "a@b.com", name: "User" });

    (prisma as any).user.findUnique.mockResolvedValueOnce(null); // email не міняємо
    (prisma as any).user.update.mockResolvedValueOnce({ id: "u1", email: "a@b.com", name: "New Name" });

    // @ts-ignore
    const res = await ProfileRoute.PATCH(await makeReq("PATCH", { name: "New Name" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.name).toBe("New Name");
  });

  it("PATCH → 400 when email format invalid", async () => {
    (getSessionCookie as jest.Mock).mockResolvedValueOnce("token");
    (verifySession as jest.Mock).mockResolvedValueOnce({ id: "u1", email: "a@b.com", name: "User" });

    // Наприклад, передамо завідомо невалідний тип, щоб Zod упав
    // @ts-ignore
    const res = await ProfileRoute.PATCH(await makeReq("PATCH", { email: "not-an-email" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid input data/i);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("PATCH → 200 when payload has no changes", async () => {
    (getSessionCookie as jest.Mock).mockResolvedValueOnce("token");
    (verifySession as jest.Mock).mockResolvedValueOnce({ id: "u1", email: "a@b.com", name: "User" });

    (prisma as any).user.update.mockResolvedValueOnce({
      id: "u1",
      email: "a@b.com",
      name: "User",
    });

    // @ts-ignore
    const res = await ProfileRoute.PATCH(await makeReq("PATCH", {}));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.email).toBe("a@b.com");
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: {},
      }),
    );
  });
});
