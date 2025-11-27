import * as ScheduleRoute from "@/app/api/schedule/route";
import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import { prismaMock } from "../../../tests-setup/prisma.mock";
import * as GenerateRoute from "@/app/api/schedule/generate/route";
import * as ApiHelpers from "@/lib/middleware/apiHelpers";

// Mock the generateScheduleEntries function
jest.mock("@/app/api/schedule/generate/route", () => ({
  generateScheduleEntries: jest.fn().mockResolvedValue(5),
}));

// Mock the apiHelpers module
jest.mock("@/lib/middleware/apiHelpers");

// Clean up mock after all tests to prevent pollution
afterAll(() => {
  jest.unmock("@/lib/middleware/apiHelpers");
});

type GetHandler = typeof ScheduleRoute.GET;
type GetRequest = Parameters<GetHandler>[0];

const defaultFrom = "2025-02-01T00:00:00.000Z";
const defaultTo = "2025-02-02T00:00:00.000Z";

const makeGetRequest = (
  params?: Partial<{ from: string; to: string; tz: string; userId: string }>,
): GetRequest => {
  const url = new URL("http://localhost/api/schedule");
  url.searchParams.set("from", params?.from ?? defaultFrom);
  url.searchParams.set("to", params?.to ?? defaultTo);
  if (params?.tz) {
    url.searchParams.set("tz", params.tz);
  }
  if (params?.userId) {
    url.searchParams.set("userId", params.userId);
  }
  return new Request(url.toString()) as unknown as GetRequest;
};

const mockUser = { id: "u1", email: "user@example.com", name: "User" };

describe("GET /api/schedule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no session user", async () => {
    jest.mocked(getSessionUserFromRequest).mockResolvedValueOnce(null);

    const res = await ScheduleRoute.GET(makeGetRequest());
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Unauthorized" }),
    );
  });

  it("returns 401 when session is invalid", async () => {
    jest.mocked(getSessionUserFromRequest).mockResolvedValueOnce(null);

    const res = await ScheduleRoute.GET(makeGetRequest());
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Unauthorized" }),
    );
  });

  it("returns 400 when query params are invalid", async () => {
    jest.mocked(getSessionUserFromRequest).mockResolvedValueOnce(mockUser);

    const req = new Request(
      `http://localhost/api/schedule?to=${defaultTo}`,
    ) as unknown as GetRequest;

    const res = await ScheduleRoute.GET(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid input data" }),
    );
    expect(prismaMock.scheduleEntry.findMany).not.toHaveBeenCalled();
  });

  it("returns schedule items when request is valid", async () => {
    jest.mocked(getSessionUserFromRequest).mockResolvedValueOnce(mockUser);

    const scheduleEntries = [
      {
        id: "se1",
        medicationId: "med1",
        userId: mockUser.id,
        dateTime: new Date("2025-02-01T03:00:00.000Z"),
        status: "PLANNED",
        medication: { id: "med1", name: "Ibuprofen", dose: 200 },
        schedule: {
          medicationId: "med1",
          quantity: 1,
          units: "pill",
          mealTiming: "before",
        },
      },
    ];

    prismaMock.scheduleEntry.findMany.mockResolvedValueOnce(scheduleEntries);

    const res = await ScheduleRoute.GET(
      makeGetRequest({ tz: "UTC", from: defaultFrom, to: defaultTo }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toHaveLength(1);
    expect(json.items[0]).toEqual(
      expect.objectContaining({
        id: "se1",
        medicationId: "med1",
        userId: mockUser.id,
        utcDateTime: "2025-02-01T03:00:00.000Z",
        localDateTime: expect.stringContaining("2025-02-01T03:00:00"),
        quantity: 1,
        units: "pill",
        mealTiming: "before",
        medication: scheduleEntries[0].medication,
      }),
    );
    expect(prismaMock.scheduleEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockUser.id,
          dateTime: {
            gte: new Date(defaultFrom),
            lte: new Date(defaultTo),
          },
        }),
      }),
    );
  });

  it("returns another user's schedule when userId param is provided and user has access", async () => {
    const targetUserId = "u2";

    jest.mocked(getSessionUserFromRequest).mockResolvedValueOnce(mockUser);

    // Mock checkApiAccess to grant viewer access
    jest.mocked(ApiHelpers.checkApiAccess).mockResolvedValueOnce({
      authorized: true,
      context: {
        userId: mockUser.id,
        ownerId: targetUserId,
        role: "viewer",
      },
    });

    const scheduleEntries = [
      {
        id: "se2",
        medicationId: "med2",
        userId: targetUserId,
        dateTime: new Date("2025-02-01T10:00:00.000Z"),
        status: "PLANNED",
        medication: { id: "med2", name: "Aspirin", dose: 100 },
        schedule: {
          medicationId: "med2",
          quantity: 2,
          units: "tablet",
          mealTiming: "after",
        },
      },
    ];

    prismaMock.scheduleEntry.findMany.mockResolvedValueOnce(scheduleEntries);

    const res = await ScheduleRoute.GET(
      makeGetRequest({ userId: targetUserId }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toHaveLength(1);
    expect(json.items[0]).toEqual(
      expect.objectContaining({
        id: "se2",
        userId: targetUserId,
        medicationId: "med2",
      }),
    );

    // Verify checkApiAccess was called with correct params
    expect(ApiHelpers.checkApiAccess).toHaveBeenCalledWith(
      expect.anything(),
      targetUserId,
      "viewer",
    );

    // Verify we fetched the target user's schedule, not our own
    expect(prismaMock.scheduleEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: targetUserId,
        }),
      }),
    );
  });

  it("returns 403 when trying to access another user's schedule without permission", async () => {
    const targetUserId = "u3";

    jest.mocked(getSessionUserFromRequest).mockResolvedValueOnce(mockUser);

    // Mock checkApiAccess to deny access
    jest.mocked(ApiHelpers.checkApiAccess).mockResolvedValueOnce({
      authorized: false,
      response: new Response(
        JSON.stringify({
          error: "Forbidden: You do not have access to this resource",
          required: "viewer",
          actual: "anonymous",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      ) as unknown as NextResponse,
    });

    const res = await ScheduleRoute.GET(
      makeGetRequest({ userId: targetUserId }),
    );

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("Forbidden");

    // Verify checkApiAccess was called
    expect(ApiHelpers.checkApiAccess).toHaveBeenCalledWith(
      expect.anything(),
      targetUserId,
      "viewer",
    );

    // Verify we did not query the database
    expect(prismaMock.scheduleEntry.findMany).not.toHaveBeenCalled();
  });

  it("does not call checkApiAccess when userId param equals current user", async () => {
    jest.mocked(getSessionUserFromRequest).mockResolvedValueOnce(mockUser);

    const scheduleEntries = [
      {
        id: "se1",
        medicationId: "med1",
        userId: mockUser.id,
        dateTime: new Date("2025-02-01T03:00:00.000Z"),
        status: "PLANNED",
        medication: { id: "med1", name: "Ibuprofen", dose: 200 },
        schedule: {
          medicationId: "med1",
          quantity: 1,
          units: "pill",
          mealTiming: "before",
        },
      },
    ];

    prismaMock.scheduleEntry.findMany.mockResolvedValueOnce(scheduleEntries);

    const res = await ScheduleRoute.GET(
      makeGetRequest({ userId: mockUser.id }), // Same as current user
    );

    expect(res.status).toBe(200);

    // checkApiAccess should NOT be called when userId equals current user
    expect(ApiHelpers.checkApiAccess).not.toHaveBeenCalled();

    // Should fetch user's own schedule
    expect(prismaMock.scheduleEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockUser.id,
        }),
      }),
    );
  });

  it("does not call checkApiAccess when no userId param is provided", async () => {
    jest.mocked(getSessionUserFromRequest).mockResolvedValueOnce(mockUser);

    prismaMock.scheduleEntry.findMany.mockResolvedValueOnce([]);

    const res = await ScheduleRoute.GET(makeGetRequest()); // No userId param

    expect(res.status).toBe(200);

    // checkApiAccess should NOT be called
    expect(ApiHelpers.checkApiAccess).not.toHaveBeenCalled();

    // Should fetch user's own schedule
    expect(prismaMock.scheduleEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockUser.id,
        }),
      }),
    );
  });

  it("returns 500 when database query fails", async () => {
    jest.mocked(getSessionUserFromRequest).mockResolvedValueOnce(mockUser);
    prismaMock.scheduleEntry.findMany.mockRejectedValueOnce(new Error("fail"));

    const res = await ScheduleRoute.GET(makeGetRequest());
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Internal server error" }),
    );
  });
});

describe("POST /api/schedule", () => {
  type PostHandler = typeof ScheduleRoute.POST;
  type PostRequest = Parameters<PostHandler>[0];

  const makePostRequest = (body: object): PostRequest =>
    new Request("http://localhost/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }) as unknown as PostRequest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no session user", async () => {
    jest.mocked(getSessionUserFromRequest).mockResolvedValueOnce(null);

    const res = await ScheduleRoute.POST(
      makePostRequest({
        medicationId: "m1",
        frequencyDays: [1],
        durationDays: 7,
        dateStart: "2025-02-20",
        timeOfDay: ["09:00"],
      }),
    );
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Unauthorized" }),
    );
  });

  it("returns 400 when payload is invalid", async () => {
    jest.mocked(getSessionUserFromRequest).mockResolvedValueOnce(mockUser);

    const res = await ScheduleRoute.POST(makePostRequest({}));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid input data" }),
    );
  });

  it("allows dateStart in the past for historical records", async () => {
    jest.mocked(getSessionUserFromRequest).mockResolvedValueOnce(mockUser);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const dateStr = lastWeek.toISOString().split("T")[0];

    const mockSchedule = {
      id: "s1",
      medicationId: "m1",
      userId: mockUser.id,
      quantity: 1,
      units: "pill",
      frequencyDays: [1],
      durationDays: 7,
      dateStart: lastWeek,
      dateEnd: new Date(),
      timeOfDay: ["09:00"],
      mealTiming: "anytime",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.schedule.create.mockResolvedValueOnce(mockSchedule);
    prismaMock.schedule.findFirst.mockResolvedValueOnce(mockSchedule);
    prismaMock.scheduleEntry.createMany.mockResolvedValueOnce({ count: 1 });

    const res = await ScheduleRoute.POST(
      makePostRequest({
        medicationId: "m1",
        frequencyDays: [1],
        durationDays: 7,
        dateStart: dateStr,
        timeOfDay: ["09:00"],
      }),
    );

    // Past dates are now allowed for recording historical medication intake
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.schedule.id).toBe("s1");
  });

  it("creates schedule and generates entries", async () => {
    jest.mocked(getSessionUserFromRequest).mockResolvedValueOnce(mockUser);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split("T")[0];

    const mockSchedule = {
      id: "s1",
      medicationId: "m1",
      userId: mockUser.id,
      quantity: 1,
      units: "pill",
      frequencyDays: [1, 3, 5],
      durationDays: 7,
      dateStart: new Date(dateStr + "T00:00:00.000Z"),
      dateEnd: null,
      timeOfDay: ["09:00", "21:00"],
      mealTiming: "before",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.schedule.create.mockResolvedValueOnce(mockSchedule);

    const res = await ScheduleRoute.POST(
      makePostRequest({
        medicationId: "m1",
        frequencyDays: [1, 3, 5],
        durationDays: 7,
        dateStart: dateStr,
        timeOfDay: ["09:00", "21:00"],
        mealTiming: "before",
      }),
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.schedule).toEqual(
      expect.objectContaining({
        id: "s1",
        medicationId: "m1",
        frequencyDays: [1, 3, 5],
      }),
    );
    expect(prismaMock.schedule.create).toHaveBeenCalled();
    expect(GenerateRoute.generateScheduleEntries).toHaveBeenCalledWith(
      "s1",
      mockUser.id,
    );
  });

  it("handles entry generation errors gracefully", async () => {
    jest.mocked(getSessionUserFromRequest).mockResolvedValueOnce(mockUser);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split("T")[0];

    const mockSchedule = {
      id: "s1",
      medicationId: "m1",
      userId: mockUser.id,
      quantity: 1,
      units: "pill",
      frequencyDays: [1],
      durationDays: 7,
      dateStart: new Date(dateStr + "T00:00:00.000Z"),
      dateEnd: null,
      timeOfDay: ["09:00"],
      mealTiming: "before",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.schedule.create.mockResolvedValueOnce(mockSchedule);
    jest
      .mocked(GenerateRoute.generateScheduleEntries)
      .mockRejectedValueOnce(new Error("Generation failed"));

    const res = await ScheduleRoute.POST(
      makePostRequest({
        medicationId: "m1",
        frequencyDays: [1],
        durationDays: 7,
        dateStart: dateStr,
        timeOfDay: ["09:00"],
      }),
    );

    // Should still return 201 even if generation fails
    expect(res.status).toBe(201);
    expect(GenerateRoute.generateScheduleEntries).toHaveBeenCalled();
  });

  it("calculates dateEnd correctly when durationDays > 0", async () => {
    jest.mocked(getSessionUserFromRequest).mockResolvedValueOnce(mockUser);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split("T")[0];

    const mockSchedule = {
      id: "s1",
      medicationId: "m1",
      userId: mockUser.id,
      quantity: 1,
      units: "pill",
      frequencyDays: [1],
      durationDays: 14,
      dateStart: new Date(dateStr + "T00:00:00.000Z"),
      dateEnd: new Date(dateStr + "T00:00:00.000Z"),
      timeOfDay: ["09:00"],
      mealTiming: "before",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Calculate expected end date
    const expectedEndDate = new Date(futureDate);
    expectedEndDate.setDate(expectedEndDate.getDate() + 14);

    prismaMock.schedule.create.mockResolvedValueOnce(mockSchedule);

    await ScheduleRoute.POST(
      makePostRequest({
        medicationId: "m1",
        frequencyDays: [1],
        durationDays: 14,
        dateStart: dateStr,
        timeOfDay: ["09:00"],
      }),
    );

    expect(prismaMock.schedule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          durationDays: 14,
          dateEnd: expect.any(Date),
        }),
      }),
    );
  });

  it("sets dateEnd to null when durationDays is 0", async () => {
    jest.mocked(getSessionUserFromRequest).mockResolvedValueOnce(mockUser);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split("T")[0];

    const mockSchedule = {
      id: "s1",
      medicationId: "m1",
      userId: mockUser.id,
      quantity: 1,
      units: "pill",
      frequencyDays: [1],
      durationDays: 0,
      dateStart: new Date(dateStr + "T00:00:00.000Z"),
      dateEnd: null,
      timeOfDay: ["09:00"],
      mealTiming: "before",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.schedule.create.mockResolvedValueOnce(mockSchedule);

    await ScheduleRoute.POST(
      makePostRequest({
        medicationId: "m1",
        frequencyDays: [1],
        durationDays: 0,
        dateStart: dateStr,
        timeOfDay: ["09:00"],
      }),
    );

    expect(prismaMock.schedule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          durationDays: 0,
          dateEnd: null,
        }),
      }),
    );
  });

  it("returns 500 when database create fails", async () => {
    jest.mocked(getSessionUserFromRequest).mockResolvedValueOnce(mockUser);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split("T")[0];

    prismaMock.schedule.create.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const res = await ScheduleRoute.POST(
      makePostRequest({
        medicationId: "m1",
        frequencyDays: [1],
        durationDays: 7,
        dateStart: dateStr,
        timeOfDay: ["09:00"],
      }),
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Internal server error" }),
    );
  });
});
