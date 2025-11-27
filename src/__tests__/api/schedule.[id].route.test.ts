import * as ScheduleIdRoute from "@/app/api/schedule/[id]/route";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { prismaMock } from "../../../tests-setup/prisma.mock";
import * as DayStatus from "@/lib/day-status";

jest.mock("@/lib/day-status", () => ({
  updateDayStatusForDate: jest.fn().mockResolvedValue(undefined),
}));

type PatchHandler = typeof ScheduleIdRoute.PATCH;
type PatchRequest = Parameters<PatchHandler>[0];
type ParamsArg = Parameters<PatchHandler>[1];

type DeleteHandler = typeof ScheduleIdRoute.DELETE;
type DeleteRequest = Parameters<DeleteHandler>[0];

const params: ParamsArg = { params: Promise.resolve({ id: "se1" }) };

const makePatchRequest = (body: object): PatchRequest =>
  new Request("http://localhost/api/schedule/se1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as PatchRequest;

const makeDeleteRequest = (): DeleteRequest =>
  new Request("http://localhost/api/schedule/se1", {
    method: "DELETE",
  }) as unknown as DeleteRequest;

describe("PATCH /api/schedule/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no session cookie", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce(null);

    const res = await ScheduleIdRoute.PATCH(
      makePatchRequest({ status: "DONE" }),
      params,
    );
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Unauthorized" }),
    );
  });

  it("returns 401 when session is invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("invalid");
    jest.mocked(verifySession).mockResolvedValueOnce(null);

    const res = await ScheduleIdRoute.PATCH(
      makePatchRequest({ status: "DONE" }),
      params,
    );
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid session" }),
    );
  });

  it("returns 400 on invalid payload", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");

    const res = await ScheduleIdRoute.PATCH(
      makePatchRequest({ status: "SKIPPED" }),
      params,
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid input data" }),
    );
    expect(prismaMock.scheduleEntry.findFirst).not.toHaveBeenCalled();
  });

  it("returns 404 when schedule entry missing", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");

    prismaMock.scheduleEntry.findFirst.mockResolvedValueOnce(null);

    const res = await ScheduleIdRoute.PATCH(
      makePatchRequest({ status: "DONE" }),
      params,
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Not found" }),
    );
  });

  it("updates status when entry exists", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");

    const mockDateTime = new Date("2025-02-01T10:00:00.000Z");
    prismaMock.scheduleEntry.findFirst.mockResolvedValueOnce({
      id: "se1",
      userId: "u1",
      dateTime: mockDateTime,
    });
    prismaMock.scheduleEntry.update.mockResolvedValueOnce({
      id: "se1",
      status: "DONE",
      userId: "u1",
      dateTime: mockDateTime,
    });

    const res = await ScheduleIdRoute.PATCH(
      makePatchRequest({ status: "DONE" }),
      params,
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ id: "se1", status: "DONE" }),
    );
    expect(prismaMock.scheduleEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "se1" },
        data: { status: "DONE" },
      }),
    );
    expect(DayStatus.updateDayStatusForDate).toHaveBeenCalledWith(
      "u1",
      mockDateTime,
      "UTC",
    );
  });

  it("returns 500 when database update fails", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");

    const mockDateTime = new Date("2025-02-01T10:00:00.000Z");
    prismaMock.scheduleEntry.findFirst.mockResolvedValueOnce({
      id: "se1",
      userId: "u1",
      dateTime: mockDateTime,
    });
    prismaMock.scheduleEntry.update.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const res = await ScheduleIdRoute.PATCH(
      makePatchRequest({ status: "DONE" }),
      params,
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Internal server error" }),
    );
  });

  it("handles day status cache update error gracefully", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");

    const mockDateTime = new Date("2025-02-01T10:00:00.000Z");
    prismaMock.scheduleEntry.findFirst.mockResolvedValueOnce({
      id: "se1",
      userId: "u1",
      dateTime: mockDateTime,
    });
    prismaMock.scheduleEntry.update.mockResolvedValueOnce({
      id: "se1",
      status: "DONE",
      userId: "u1",
      dateTime: mockDateTime,
    });
    // Day status update fails, but should not affect the response
    jest
      .mocked(DayStatus.updateDayStatusForDate)
      .mockRejectedValueOnce(new Error("Cache update failed"));

    const res = await ScheduleIdRoute.PATCH(
      makePatchRequest({ status: "DONE" }),
      params,
    );
    // Response should still be successful
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ id: "se1", status: "DONE" }),
    );
    expect(DayStatus.updateDayStatusForDate).toHaveBeenCalled();
  });
});

describe("DELETE /api/schedule/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no session cookie", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce(null);

    const res = await ScheduleIdRoute.DELETE(makeDeleteRequest(), params);
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Unauthorized" }),
    );
  });

  it("returns 401 when session is invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("invalid-token");
    jest.mocked(verifySession).mockResolvedValueOnce(null);

    const res = await ScheduleIdRoute.DELETE(makeDeleteRequest(), params);
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid session" }),
    );
  });

  it("returns 404 when schedule entry not found", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");

    prismaMock.scheduleEntry.findFirst.mockResolvedValueOnce(null);

    const res = await ScheduleIdRoute.DELETE(makeDeleteRequest(), params);
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Not found" }),
    );
  });

  it("deletes schedule entry successfully", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");

    const mockDateTime = new Date("2025-02-01T10:00:00.000Z");
    prismaMock.scheduleEntry.findFirst.mockResolvedValueOnce({
      id: "se1",
      userId: "u1",
      dateTime: mockDateTime,
    });
    prismaMock.scheduleEntry.delete.mockResolvedValueOnce({
      id: "se1",
      userId: "u1",
      dateTime: mockDateTime,
      status: "PLANNED",
      scheduleId: "s1",
      medicationId: "m1",
    });

    const res = await ScheduleIdRoute.DELETE(makeDeleteRequest(), params);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ message: "Entry deleted successfully" }),
    );
    expect(prismaMock.scheduleEntry.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "se1" },
      }),
    );
    expect(DayStatus.updateDayStatusForDate).toHaveBeenCalledWith(
      "u1",
      mockDateTime,
      "UTC",
    );
  });

  it("returns 500 when database delete fails", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");

    const mockDateTime = new Date("2025-02-01T10:00:00.000Z");
    prismaMock.scheduleEntry.findFirst.mockResolvedValueOnce({
      id: "se1",
      userId: "u1",
      dateTime: mockDateTime,
    });
    prismaMock.scheduleEntry.delete.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const res = await ScheduleIdRoute.DELETE(makeDeleteRequest(), params);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Internal server error" }),
    );
  });

  it("handles day status cache update error gracefully on delete", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");

    const mockDateTime = new Date("2025-02-01T10:00:00.000Z");
    prismaMock.scheduleEntry.findFirst.mockResolvedValueOnce({
      id: "se1",
      userId: "u1",
      dateTime: mockDateTime,
    });
    prismaMock.scheduleEntry.delete.mockResolvedValueOnce({
      id: "se1",
      userId: "u1",
      dateTime: mockDateTime,
      status: "PLANNED",
      scheduleId: "s1",
      medicationId: "m1",
    });
    // Day status update fails, but should not affect the response
    jest
      .mocked(DayStatus.updateDayStatusForDate)
      .mockRejectedValueOnce(new Error("Cache update failed"));

    const res = await ScheduleIdRoute.DELETE(makeDeleteRequest(), params);
    // Response should still be successful
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ message: "Entry deleted successfully" }),
    );
    expect(DayStatus.updateDayStatusForDate).toHaveBeenCalled();
  });
});
