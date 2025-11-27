import * as TemplatesRoute from "@/app/api/schedule/templates/route";
import * as TemplateDetailRoute from "@/app/api/schedule/templates/[id]/route";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { prismaMock } from "../../../tests-setup/prisma.mock";
import { generateScheduleEntries } from "@/app/api/schedule/generate/route";
import * as DayStatus from "@/lib/day-status";

jest.mock("@/app/api/schedule/generate/route", () => ({
  generateScheduleEntries: jest.fn().mockResolvedValue(5),
}));

jest.mock("@/lib/day-status", () => ({
  updateDayStatusesForDates: jest.fn().mockResolvedValue(undefined),
}));

const mockUser = { id: "user1", email: "test@example.com", name: "Test" };

const makePatchRequest = (body: object) =>
  new Request("http://localhost/api/schedule/templates/s1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof TemplateDetailRoute.PATCH>[0];

type PatchParams = Parameters<typeof TemplateDetailRoute.PATCH>[1];
const makePatchParams = (): PatchParams => ({
  params: Promise.resolve({ id: "s1" }),
});

describe("GET /api/schedule/templates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no session cookie", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce(null);

    const res = await TemplatesRoute.GET();
    expect(res.status).toBe(401);
  });

  it("returns 401 when session invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(null);

    const res = await TemplatesRoute.GET();
    expect(res.status).toBe(401);
  });

  it("returns schedule templates when authenticated", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    prismaMock.schedule.findMany.mockResolvedValueOnce([
      {
        id: "s1",
        medicationId: "m1",
        userId: mockUser.id,
        quantity: 1,
        units: "pill",
        frequencyDays: [1, 2],
        durationDays: 14,
        dateStart: new Date("2025-02-01T00:00:00.000Z"),
        dateEnd: new Date("2025-02-15T00:00:00.000Z"),
        timeOfDay: ["08:00"],
        mealTiming: "before",
        createdAt: new Date(),
        updatedAt: new Date(),
        medication: { id: "m1", name: "Aspirin", dose: 100 },
      },
    ]);

    const res = await TemplatesRoute.GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toHaveLength(1);
    expect(json.items[0]).toEqual(
      expect.objectContaining({
        id: "s1",
        medicationId: "m1",
        frequencyDays: [1, 2],
        timeOfDay: ["08:00"],
      }),
    );
  });

  it("returns 500 when database query fails", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);
    prismaMock.schedule.findMany.mockRejectedValueOnce(new Error("boom"));

    const res = await TemplatesRoute.GET();
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/schedule/templates/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no session cookie", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce(null);

    const res = await TemplateDetailRoute.PATCH(
      makePatchRequest({ quantity: 2 }),
      makePatchParams(),
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 when session invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(null);

    const res = await TemplateDetailRoute.PATCH(
      makePatchRequest({ quantity: 2 }),
      makePatchParams(),
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when schedule missing", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);
    prismaMock.schedule.findFirst.mockResolvedValueOnce(null);

    const res = await TemplateDetailRoute.PATCH(
      makePatchRequest({ quantity: 2 }),
      makePatchParams(),
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 when payload invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);
    prismaMock.schedule.findFirst.mockResolvedValueOnce({
      id: "s1",
      medicationId: "m1",
      userId: mockUser.id,
      quantity: 1,
      units: "pill",
      frequencyDays: [1],
      durationDays: 7,
      dateStart: new Date("2025-02-01T00:00:00.000Z"),
      dateEnd: new Date("2025-02-08T00:00:00.000Z"),
      timeOfDay: ["08:00"],
      mealTiming: "before",
      createdAt: new Date(),
      updatedAt: new Date(),
      medication: { id: "m1", name: "Aspirin", dose: 100 },
    });

    const res = await TemplateDetailRoute.PATCH(
      makePatchRequest({}),
      makePatchParams(),
    );
    expect(res.status).toBe(400);
  });

  it("updates schedule and regenerates entries", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);
    const existingSchedule = {
      id: "s1",
      medicationId: "m1",
      userId: mockUser.id,
      quantity: 1,
      units: "pill",
      frequencyDays: [1],
      durationDays: 7,
      dateStart: new Date("2025-02-01T00:00:00.000Z"),
      dateEnd: new Date("2025-02-08T00:00:00.000Z"),
      timeOfDay: ["08:00"],
      mealTiming: "before",
      createdAt: new Date(),
      updatedAt: new Date(),
      medication: { id: "m1", name: "Aspirin", dose: 100 },
    };
    prismaMock.schedule.findFirst.mockResolvedValueOnce(existingSchedule);
    prismaMock.schedule.update.mockResolvedValueOnce({
      ...existingSchedule,
      quantity: 2,
      frequencyDays: [1, 3, 5],
      timeOfDay: ["08:00", "20:00"],
      updatedAt: new Date(),
    });
    prismaMock.scheduleEntry.deleteMany.mockResolvedValueOnce({ count: 3 });

    const res = await TemplateDetailRoute.PATCH(
      makePatchRequest({
        quantity: 2,
        frequencyDays: [1, 3, 5],
        timeOfDay: ["08:00", "20:00"],
      }),
      makePatchParams(),
    );

    expect(res.status).toBe(200);
    expect(prismaMock.schedule.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "s1" },
        data: expect.objectContaining({
          quantity: 2,
          frequencyDays: [1, 3, 5],
          timeOfDay: ["08:00", "20:00"],
        }),
      }),
    );
    expect(prismaMock.scheduleEntry.deleteMany).toHaveBeenCalled();
    expect(generateScheduleEntries).toHaveBeenCalledWith("s1", mockUser.id);
  });

  it("returns 500 when database update fails", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);
    const existingSchedule = {
      id: "s1",
      medicationId: "m1",
      userId: mockUser.id,
      quantity: 1,
      units: "pill",
      frequencyDays: [1],
      durationDays: 7,
      dateStart: new Date("2025-02-01T00:00:00.000Z"),
      dateEnd: new Date("2025-02-08T00:00:00.000Z"),
      timeOfDay: ["08:00"],
      mealTiming: "before",
      createdAt: new Date(),
      updatedAt: new Date(),
      medication: { id: "m1", name: "Aspirin", dose: 100 },
    };
    prismaMock.schedule.findFirst.mockResolvedValueOnce(existingSchedule);
    prismaMock.schedule.update.mockRejectedValueOnce(new Error("DB error"));

    const res = await TemplateDetailRoute.PATCH(
      makePatchRequest({ quantity: 2 }),
      makePatchParams(),
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Internal server error" }),
    );
  });
});

type DeleteHandler = typeof TemplateDetailRoute.DELETE;
type DeleteRequest = Parameters<DeleteHandler>[0];
type DeleteParams = Parameters<DeleteHandler>[1];

const makeDeleteRequest = (tz?: string): DeleteRequest => {
  const url = tz
    ? `http://localhost/api/schedule/templates/s1?tz=${tz}`
    : "http://localhost/api/schedule/templates/s1";
  return new Request(url, {
    method: "DELETE",
  }) as unknown as DeleteRequest;
};

const makeDeleteParams = (): DeleteParams => ({
  params: Promise.resolve({ id: "s1" }),
});

describe("DELETE /api/schedule/templates/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no session cookie", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce(null);

    const res = await TemplateDetailRoute.DELETE(
      makeDeleteRequest(),
      makeDeleteParams(),
    );
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Unauthorized" }),
    );
  });

  it("returns 401 when session is invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("invalid-token");
    jest.mocked(verifySession).mockResolvedValueOnce(null);

    const res = await TemplateDetailRoute.DELETE(
      makeDeleteRequest(),
      makeDeleteParams(),
    );
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid session" }),
    );
  });

  it("returns 404 when schedule not found", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);
    prismaMock.schedule.findFirst.mockResolvedValueOnce(null);

    const res = await TemplateDetailRoute.DELETE(
      makeDeleteRequest(),
      makeDeleteParams(),
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Not found" }),
    );
  });

  it("soft deletes schedule and removes future PLANNED entries", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    const existingSchedule = {
      id: "s1",
      medicationId: "m1",
      userId: mockUser.id,
      quantity: 1,
      units: "pill",
      frequencyDays: [1],
      durationDays: 7,
      dateStart: new Date("2025-02-01T00:00:00.000Z"),
      dateEnd: new Date("2025-02-08T00:00:00.000Z"),
      timeOfDay: ["08:00"],
      mealTiming: "before",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    prismaMock.schedule.findFirst.mockResolvedValueOnce(existingSchedule);

    // Future entries to delete
    const futureDate1 = new Date("2025-02-03T08:00:00.000Z");
    const futureDate2 = new Date("2025-02-04T08:00:00.000Z");
    prismaMock.scheduleEntry.findMany.mockResolvedValueOnce([
      { dateTime: futureDate1 },
      { dateTime: futureDate2 },
    ]);

    prismaMock.scheduleEntry.deleteMany.mockResolvedValueOnce({ count: 2 });
    prismaMock.schedule.update.mockResolvedValueOnce({
      ...existingSchedule,
      deletedAt: new Date(),
    });

    const res = await TemplateDetailRoute.DELETE(
      makeDeleteRequest(),
      makeDeleteParams(),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(
      expect.objectContaining({
        message: "Schedule deleted successfully",
        deletedEntries: 2,
      }),
    );

    // Verify schedule was soft deleted
    expect(prismaMock.schedule.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "s1" },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      }),
    );

    // Verify only future PLANNED entries were deleted
    expect(prismaMock.scheduleEntry.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          scheduleId: "s1",
          userId: mockUser.id,
          status: "PLANNED",
        }),
      }),
    );

    // Verify day status cache was updated
    expect(DayStatus.updateDayStatusesForDates).toHaveBeenCalled();
  });

  it("handles delete with no future entries", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    const existingSchedule = {
      id: "s1",
      medicationId: "m1",
      userId: mockUser.id,
      quantity: 1,
      units: "pill",
      frequencyDays: [1],
      durationDays: 7,
      dateStart: new Date("2025-01-01T00:00:00.000Z"),
      dateEnd: new Date("2025-01-08T00:00:00.000Z"),
      timeOfDay: ["08:00"],
      mealTiming: "before",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    prismaMock.schedule.findFirst.mockResolvedValueOnce(existingSchedule);
    prismaMock.scheduleEntry.findMany.mockResolvedValueOnce([]);
    prismaMock.scheduleEntry.deleteMany.mockResolvedValueOnce({ count: 0 });
    prismaMock.schedule.update.mockResolvedValueOnce({
      ...existingSchedule,
      deletedAt: new Date(),
    });

    const res = await TemplateDetailRoute.DELETE(
      makeDeleteRequest(),
      makeDeleteParams(),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deletedEntries).toBe(0);

    // Day status cache should not be updated when no dates affected
    expect(DayStatus.updateDayStatusesForDates).not.toHaveBeenCalled();
  });

  it("uses timezone from query parameter", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    const existingSchedule = {
      id: "s1",
      medicationId: "m1",
      userId: mockUser.id,
      quantity: 1,
      units: "pill",
      frequencyDays: [1],
      durationDays: 7,
      dateStart: new Date("2025-02-01T00:00:00.000Z"),
      dateEnd: new Date("2025-02-08T00:00:00.000Z"),
      timeOfDay: ["08:00"],
      mealTiming: "before",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    prismaMock.schedule.findFirst.mockResolvedValueOnce(existingSchedule);
    const futureDate = new Date("2025-02-03T08:00:00.000Z");
    prismaMock.scheduleEntry.findMany.mockResolvedValueOnce([
      { dateTime: futureDate },
    ]);
    prismaMock.scheduleEntry.deleteMany.mockResolvedValueOnce({ count: 1 });
    prismaMock.schedule.update.mockResolvedValueOnce({
      ...existingSchedule,
      deletedAt: new Date(),
    });

    const res = await TemplateDetailRoute.DELETE(
      makeDeleteRequest("Europe/Kyiv"),
      makeDeleteParams(),
    );

    expect(res.status).toBe(200);
    expect(DayStatus.updateDayStatusesForDates).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(Array),
      "Europe/Kyiv",
    );
  });

  it("returns 500 when database operation fails", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    const existingSchedule = {
      id: "s1",
      medicationId: "m1",
      userId: mockUser.id,
      quantity: 1,
      units: "pill",
      frequencyDays: [1],
      durationDays: 7,
      dateStart: new Date("2025-02-01T00:00:00.000Z"),
      dateEnd: new Date("2025-02-08T00:00:00.000Z"),
      timeOfDay: ["08:00"],
      mealTiming: "before",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    prismaMock.schedule.findFirst.mockResolvedValueOnce(existingSchedule);
    prismaMock.scheduleEntry.findMany.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const res = await TemplateDetailRoute.DELETE(
      makeDeleteRequest(),
      makeDeleteParams(),
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Internal server error" }),
    );
  });

  it("handles day status cache update error gracefully", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    const existingSchedule = {
      id: "s1",
      medicationId: "m1",
      userId: mockUser.id,
      quantity: 1,
      units: "pill",
      frequencyDays: [1],
      durationDays: 7,
      dateStart: new Date("2025-02-01T00:00:00.000Z"),
      dateEnd: new Date("2025-02-08T00:00:00.000Z"),
      timeOfDay: ["08:00"],
      mealTiming: "before",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    prismaMock.schedule.findFirst.mockResolvedValueOnce(existingSchedule);
    const futureDate = new Date("2025-02-03T08:00:00.000Z");
    prismaMock.scheduleEntry.findMany.mockResolvedValueOnce([
      { dateTime: futureDate },
    ]);
    prismaMock.scheduleEntry.deleteMany.mockResolvedValueOnce({ count: 1 });
    prismaMock.schedule.update.mockResolvedValueOnce({
      ...existingSchedule,
      deletedAt: new Date(),
    });

    // Day status update fails, but should not affect the response
    jest
      .mocked(DayStatus.updateDayStatusesForDates)
      .mockRejectedValueOnce(new Error("Cache update failed"));

    const res = await TemplateDetailRoute.DELETE(
      makeDeleteRequest(),
      makeDeleteParams(),
    );

    // Response should still be successful
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ message: "Schedule deleted successfully" }),
    );
  });
});
