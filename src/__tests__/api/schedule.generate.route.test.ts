import * as GenerateRoute from "@/app/api/schedule/generate/route";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { prismaMock } from "../../../tests-setup/prisma.mock";
import * as DayStatus from "@/lib/day-status";

jest.mock("@/lib/day-status", () => ({
  updateDayStatusesForDates: jest.fn().mockResolvedValue(undefined),
}));

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

    const res = await GenerateRoute.POST(
      makePostRequest({ medicationId: "m1" }),
    );
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Unauthorized" }),
    );
  });

  it("returns 401 when session is invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("invalid");
    jest.mocked(verifySession).mockResolvedValueOnce(null);

    const res = await GenerateRoute.POST(
      makePostRequest({ medicationId: "m1" }),
    );
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
  });

  it("returns 400 for medication-based generation (deprecated)", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    const res = await GenerateRoute.POST(
      makePostRequest({ medicationId: "m1" }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({
        error:
          "Medication-based schedule generation is no longer supported. Please use Schedule model instead.",
      }),
    );
  });

  it("returns 400 when both scheduleId and medicationId are missing", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    const res = await GenerateRoute.POST(makePostRequest({}));
    expect(res.status).toBe(400);
    // Zod validation catches this first
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid input data" }),
    );
  });

  it("returns 404 when schedule is not found", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    prismaMock.schedule.findFirst.mockResolvedValueOnce(null);

    const res = await GenerateRoute.POST(
      makePostRequest({ scheduleId: "nonexistent" }),
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Schedule not found" }),
    );
  });

  it("generates schedule entries and updates day status cache", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    const mockSchedule = {
      id: "s1",
      medicationId: "m1",
      userId: mockUser.id,
      quantity: 1,
      units: "pill",
      frequencyDays: [1, 3, 5] as number[], // Monday, Wednesday, Friday
      durationDays: 7,
      dateStart: new Date("2025-02-03T00:00:00.000Z"), // Monday
      dateEnd: new Date("2025-02-09T23:59:59.999Z"), // Sunday
      timeOfDay: ["09:00", "21:00"] as string[],
      mealTiming: "before",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.schedule.findFirst.mockResolvedValueOnce(mockSchedule);
    prismaMock.scheduleEntry.createMany.mockResolvedValueOnce({
      count: 6, // 3 days * 2 times per day
    });

    const res = await GenerateRoute.POST(makePostRequest({ scheduleId: "s1" }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.created).toBe(6);

    expect(prismaMock.schedule.findFirst).toHaveBeenCalledWith({
      where: { id: "s1", userId: mockUser.id },
    });
    expect(prismaMock.scheduleEntry.createMany).toHaveBeenCalled();
    expect(DayStatus.updateDayStatusesForDates).toHaveBeenCalled();
  });

  it("returns 500 when generation fails", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    prismaMock.schedule.findFirst.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const res = await GenerateRoute.POST(makePostRequest({ scheduleId: "s1" }));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Internal server error" }),
    );
  });
});
