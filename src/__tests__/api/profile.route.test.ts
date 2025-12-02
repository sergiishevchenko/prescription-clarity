import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import * as ProfileRoute from "@/app/api/profile/route";
import { prismaMock } from "../../../tests-setup/prisma.mock";

type PatchHandler = typeof ProfileRoute.PATCH;
type PatchRequest = Parameters<PatchHandler>[0];
type PatchPayload = Partial<{
  name: string | null;
  email: string | null;
}>;

const makePatchRequest = (body: PatchPayload): PatchRequest =>
  new Request("http://localhost/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as PatchRequest;

describe("/api/profile route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET → 401 when no session cookie", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce(null);

    const res = await ProfileRoute.GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/Unauthorized/i);
  });

  it("GET → 401 when invalid session", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("invalid");
    jest.mocked(verifySession).mockResolvedValueOnce(null);

    const res = await ProfileRoute.GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid session/i);
  });

  it("GET → 200 returns { user }", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest
      .mocked(verifySession)
      .mockResolvedValueOnce({ id: "u1", email: "a@b.com", name: "User" });

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      email: "a@b.com",
      name: "User",
      dateOfBirth: null,
    });

    const res = await ProfileRoute.GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.email).toBe("a@b.com");
  });

  it("PATCH → 401 when no session cookie", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce(null);

    const res = await ProfileRoute.PATCH(makePatchRequest({ name: "New" }));
    expect(res.status).toBe(401);
  });

  it("PATCH → 401 when invalid session", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("invalid");
    jest.mocked(verifySession).mockResolvedValueOnce(null);

    const res = await ProfileRoute.PATCH(makePatchRequest({ name: "New" }));
    expect(res.status).toBe(401);
  });

  it("PATCH → 400 when email already in use", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest
      .mocked(verifySession)
      .mockResolvedValueOnce({ id: "u1", email: "a@b.com", name: "User" });

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "u2",
      email: "busy@b.com",
    });

    const res = await ProfileRoute.PATCH(
      makePatchRequest({ email: "busy@b.com" }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Email already in use/i);
  });

  it("PATCH → 200 updates name", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest
      .mocked(verifySession)
      .mockResolvedValueOnce({ id: "u1", email: "a@b.com", name: "User" });

    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.update.mockResolvedValueOnce({
      id: "u1",
      email: "a@b.com",
      name: "New Name",
    });

    const res = await ProfileRoute.PATCH(
      makePatchRequest({ name: "New Name" }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.name).toBe("New Name");
  });

  it("PATCH → 400 when email format invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest
      .mocked(verifySession)
      .mockResolvedValueOnce({ id: "u1", email: "a@b.com", name: "User" });

    const res = await ProfileRoute.PATCH(
      makePatchRequest({ email: "not-an-email" }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid input data/i);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("PATCH → 200 when payload has no changes", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest
      .mocked(verifySession)
      .mockResolvedValueOnce({ id: "u1", email: "a@b.com", name: "User" });

    prismaMock.user.update.mockResolvedValueOnce({
      id: "u1",
      email: "a@b.com",
      name: "User",
    });

    const res = await ProfileRoute.PATCH(makePatchRequest({}));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.email).toBe("a@b.com");
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: {},
      }),
    );
  });
});
