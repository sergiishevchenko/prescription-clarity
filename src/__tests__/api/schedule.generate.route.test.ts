import * as GenerateRoute from "@/app/api/schedule/generate/route";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { prismaMock } from "../../../tests-setup/prisma.mock";

type PostHandler = typeof GenerateRoute.POST;
type PostRequest = Parameters<PostHandler>[0];

const makePostRequest = (body: object): PostRequest =>
  new Request("http://localhost/api/schedule/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as PostRequest;

const mockUser = { id: "u1", email: "user@example.com", name: "User" };

describe("POST /api/schedule/generate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no session cookie", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce(null);

    const res = await GenerateRoute.POST(makePostRequest({ medicationId: "m1" }));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Unauthorized" }),
    );
  });

  it("returns 401 when session is invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("invalid");
    jest.mocked(verifySession).mockResolvedValueOnce(null);

    const res = await GenerateRoute.POST(makePostRequest({ medicationId: "m1" }));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid session" }),
    );
  });

  it("returns 400 when payload is invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    const res = await GenerateRoute.POST(makePostRequest({}));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid input data" }),
    );
    expect(prismaMock.medication.findFirst).not.toHaveBeenCalled();
  });

  it("returns 404 when medication does not exist", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(null);

    const res = await GenerateRoute.POST(makePostRequest({ medicationId: "m1" }));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Medication not found" }),
    );
  });

  it("returns 400 when medication frequency is not positive", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce({
      id: "m1",
      userId: mockUser.id,
      frequency: 0,
      startDate: new Date("2025-02-01T00:00:00.000Z"),
      endDate: new Date("2025-02-02T00:00:00.000Z"),
    });

    const res = await GenerateRoute.POST(makePostRequest({ medicationId: "m1" }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({
        error: "Medication frequency must be positive hours",
      }),
    );
    expect(prismaMock.scheduleEntry.createMany).not.toHaveBeenCalled();
  });

  it("creates schedule entries for valid medication", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce({
      id: "m1",
      userId: mockUser.id,
      frequency: 3,
      startDate: new Date("2025-02-01T00:00:00.000Z"),
      endDate: new Date("2025-02-01T06:00:00.000Z"),
    });

    prismaMock.scheduleEntry.createMany.mockResolvedValueOnce({ count: 3 });

    const res = await GenerateRoute.POST(makePostRequest({ medicationId: "m1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.created).toBe(3);
    expect(prismaMock.scheduleEntry.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            medicationId: "m1",
            userId: mockUser.id,
          }),
        ]),
        skipDuplicates: true,
      }),
    );
  });

  it("returns zero created when range produces no entries", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce({
      id: "m1",
      userId: mockUser.id,
      frequency: 6,
      startDate: new Date("2025-02-02T00:00:00.000Z"),
      endDate: new Date("2025-02-01T00:00:00.000Z"),
    });

    const res = await GenerateRoute.POST(makePostRequest({ medicationId: "m1" }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ created: 0, skipped: 0 });
    expect(prismaMock.scheduleEntry.createMany).not.toHaveBeenCalled();
  });
});
