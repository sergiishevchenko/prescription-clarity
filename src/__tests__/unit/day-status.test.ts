import {
  calculateDayStatus,
  updateDayStatusForDate,
  getDayStatus,
  getDayStatusesForRange,
  updateDayStatusesForDates,
  invalidateDayStatus,
} from "@/lib/day-status";
import { prismaMock } from "../../../tests-setup/prisma.mock";

describe("day-status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("calculateDayStatus", () => {
    const userId = "u1";
    const timezone = "UTC";

    it("returns NONE when no entries exist", async () => {
      jest.setSystemTime(new Date("2025-02-15T12:00:00.000Z"));
      prismaMock.scheduleEntry.findMany.mockResolvedValueOnce([]);

      const result = await calculateDayStatus(
        userId,
        new Date("2025-02-15T12:00:00.000Z"),
        timezone,
      );

      expect(result).toBe("NONE");
    });

    it("returns ALL_TAKEN when all entries are DONE", async () => {
      jest.setSystemTime(new Date("2025-02-15T12:00:00.000Z"));
      prismaMock.scheduleEntry.findMany.mockResolvedValueOnce([
        { status: "DONE" },
        { status: "DONE" },
        { status: "DONE" },
      ]);

      const result = await calculateDayStatus(
        userId,
        new Date("2025-02-15T12:00:00.000Z"),
        timezone,
      );

      expect(result).toBe("ALL_TAKEN");
    });

    it("returns MISSED when all entries are PLANNED and date is in the past", async () => {
      jest.setSystemTime(new Date("2025-02-20T12:00:00.000Z"));
      prismaMock.scheduleEntry.findMany.mockResolvedValueOnce([
        { status: "PLANNED" },
        { status: "PLANNED" },
      ]);

      const result = await calculateDayStatus(
        userId,
        new Date("2025-02-15T12:00:00.000Z"), // 5 days ago
        timezone,
      );

      expect(result).toBe("MISSED");
    });

    it("returns SCHEDULED when all entries are PLANNED and date is today or future", async () => {
      jest.setSystemTime(new Date("2025-02-15T12:00:00.000Z"));
      prismaMock.scheduleEntry.findMany.mockResolvedValueOnce([
        { status: "PLANNED" },
        { status: "PLANNED" },
      ]);

      const result = await calculateDayStatus(
        userId,
        new Date("2025-02-15T12:00:00.000Z"), // Today
        timezone,
      );

      expect(result).toBe("SCHEDULED");
    });

    it("returns SCHEDULED when all entries are PLANNED and date is in the future", async () => {
      jest.setSystemTime(new Date("2025-02-15T12:00:00.000Z"));
      prismaMock.scheduleEntry.findMany.mockResolvedValueOnce([
        { status: "PLANNED" },
        { status: "PLANNED" },
      ]);

      const result = await calculateDayStatus(
        userId,
        new Date("2025-02-20T12:00:00.000Z"), // Future date
        timezone,
      );

      expect(result).toBe("SCHEDULED");
    });

    it("returns PARTIAL when some entries are DONE and some are PLANNED", async () => {
      jest.setSystemTime(new Date("2025-02-15T12:00:00.000Z"));
      prismaMock.scheduleEntry.findMany.mockResolvedValueOnce([
        { status: "DONE" },
        { status: "PLANNED" },
        { status: "PLANNED" },
      ]);

      const result = await calculateDayStatus(
        userId,
        new Date("2025-02-15T12:00:00.000Z"),
        timezone,
      );

      expect(result).toBe("PARTIAL");
    });
  });

  describe("updateDayStatusForDate", () => {
    const userId = "u1";
    const date = new Date("2025-02-15T12:00:00.000Z");
    const timezone = "UTC";

    beforeEach(() => {
      jest.setSystemTime(new Date("2025-02-15T12:00:00.000Z"));
    });

    it("creates new day status when it doesn't exist", async () => {
      // Mock calculateDayStatus behavior - two calls: one for status, one for counts
      prismaMock.scheduleEntry.findMany
        .mockResolvedValueOnce([{ status: "PLANNED" }]) // For calculateDayStatus
        .mockResolvedValueOnce([{ status: "PLANNED" }]); // For counts in updateDayStatusForDate

      prismaMock.dayStatus.upsert.mockResolvedValueOnce({
        id: "ds1",
        userId,
        date: new Date("2025-02-15T00:00:00.000Z"),
        status: "SCHEDULED",
        totalCount: 1,
        plannedCount: 1,
        takenCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await updateDayStatusForDate(userId, date, timezone);

      expect(prismaMock.dayStatus.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_date: {
              userId,
              date: expect.any(Date),
            },
          },
          create: expect.objectContaining({
            userId,
            status: "SCHEDULED",
            totalCount: 1,
            plannedCount: 1,
            takenCount: 0,
          }),
        }),
      );
    });

    it("updates existing day status", async () => {
      // Mock calculateDayStatus behavior - two calls: one for status, one for counts
      prismaMock.scheduleEntry.findMany
        .mockResolvedValueOnce([{ status: "DONE" }]) // For calculateDayStatus
        .mockResolvedValueOnce([{ status: "DONE" }]); // For counts in updateDayStatusForDate

      prismaMock.dayStatus.upsert.mockResolvedValueOnce({
        id: "ds1",
        userId,
        date: new Date("2025-02-15T00:00:00.000Z"),
        status: "ALL_TAKEN",
        totalCount: 1,
        plannedCount: 0,
        takenCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await updateDayStatusForDate(userId, date, timezone);

      expect(prismaMock.dayStatus.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_date: {
              userId,
              date: expect.any(Date),
            },
          },
          update: expect.objectContaining({
            status: "ALL_TAKEN",
            totalCount: 1,
            plannedCount: 0,
            takenCount: 1,
          }),
        }),
      );
    });
  });

  describe("getDayStatus", () => {
    const userId = "u1";
    const date = new Date("2025-02-15T12:00:00.000Z");
    const timezone = "UTC";

    it("returns cached status when available", async () => {
      const cachedStatus = {
        id: "ds1",
        userId,
        date: new Date("2025-02-15T00:00:00.000Z"),
        status: "ALL_TAKEN" as const,
        totalCount: 2,
        plannedCount: 0,
        takenCount: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.dayStatus.findUnique.mockResolvedValueOnce(cachedStatus);

      const result = await getDayStatus(userId, date, timezone);

      expect(result).toBe("ALL_TAKEN");
      expect(prismaMock.scheduleEntry.findMany).not.toHaveBeenCalled();
    });

    it("calculates and caches status when not cached", async () => {
      jest.setSystemTime(new Date("2025-02-15T12:00:00.000Z"));

      prismaMock.dayStatus.findUnique.mockResolvedValueOnce(null);

      // Mock for calculateDayStatus (called via updateDayStatusForDate)
      prismaMock.scheduleEntry.findMany
        .mockResolvedValueOnce([{ status: "PLANNED" }]) // For calculateDayStatus
        .mockResolvedValueOnce([{ status: "PLANNED" }]); // For counts in updateDayStatusForDate

      const upsertedStatus = {
        id: "ds1",
        userId,
        date: new Date("2025-02-15T00:00:00.000Z"),
        status: "SCHEDULED" as const,
        totalCount: 1,
        plannedCount: 1,
        takenCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.dayStatus.upsert.mockResolvedValueOnce(upsertedStatus);
      prismaMock.dayStatus.findUnique.mockResolvedValueOnce(upsertedStatus);

      const result = await getDayStatus(userId, date, timezone);

      expect(result).toBe("SCHEDULED");
      expect(prismaMock.dayStatus.upsert).toHaveBeenCalled();
    });
  });

  describe("getDayStatusesForRange", () => {
    const userId = "u1";
    const timezone = "UTC";

    it("returns cached statuses for date range", async () => {
      jest.setSystemTime(new Date("2025-02-05T12:00:00.000Z"));
      const startDate = new Date("2025-02-01T00:00:00.000Z");
      const endDate = new Date("2025-02-07T00:00:00.000Z");

      const cachedStatuses = [
        {
          date: new Date("2025-02-01T00:00:00.000Z"),
          status: "ALL_TAKEN" as const,
        },
        {
          date: new Date("2025-02-02T00:00:00.000Z"),
          status: "PARTIAL" as const,
        },
        {
          date: new Date("2025-02-03T00:00:00.000Z"),
          status: "SCHEDULED" as const,
        },
        {
          date: new Date("2025-02-04T00:00:00.000Z"),
          status: "NONE" as const,
        },
        {
          date: new Date("2025-02-05T00:00:00.000Z"),
          status: "MISSED" as const,
        },
        {
          date: new Date("2025-02-06T00:00:00.000Z"),
          status: "SCHEDULED" as const,
        },
        {
          date: new Date("2025-02-07T00:00:00.000Z"),
          status: "PARTIAL" as const,
        },
      ];

      // All dates are cached, so no need to calculate missing ones
      prismaMock.dayStatus.findMany.mockResolvedValueOnce(cachedStatuses);

      const result = await getDayStatusesForRange(
        userId,
        startDate,
        endDate,
        timezone,
      );

      expect(result["2025-02-01"]).toBe("ALL_TAKEN");
      expect(result["2025-02-02"]).toBe("PARTIAL");
      expect(result["2025-02-03"]).toBe("SCHEDULED");
      expect(result["2025-02-04"]).toBe("NONE");
      expect(result["2025-02-05"]).toBe("MISSED");
      expect(result["2025-02-06"]).toBe("SCHEDULED");
      expect(result["2025-02-07"]).toBe("PARTIAL");

      // Should not call calculateDayStatus since all dates are cached
      expect(prismaMock.scheduleEntry.findMany).not.toHaveBeenCalled();
    });

    it("calculates missing statuses in range", async () => {
      jest.setSystemTime(new Date("2025-02-05T12:00:00.000Z"));
      const startDate = new Date("2025-02-01T00:00:00.000Z");
      const endDate = new Date("2025-02-03T00:00:00.000Z");

      // First call returns cached for 2025-02-01
      prismaMock.dayStatus.findMany.mockResolvedValueOnce([
        {
          date: new Date("2025-02-01T00:00:00.000Z"),
          status: "ALL_TAKEN" as const,
        },
      ]);

      // For missing dates (2025-02-02 and 2025-02-03), calculate and cache
      // Each date needs 2 findMany calls (one for status, one for counts)
      const scheduledEntry = { status: "PLANNED" as const };
      prismaMock.scheduleEntry.findMany
        .mockResolvedValueOnce([scheduledEntry]) // 2025-02-02: calculateDayStatus
        .mockResolvedValueOnce([scheduledEntry]) // 2025-02-02: counts
        .mockResolvedValueOnce([scheduledEntry]) // 2025-02-03: calculateDayStatus
        .mockResolvedValueOnce([scheduledEntry]); // 2025-02-03: counts

      const scheduledStatus = {
        id: "ds1",
        userId,
        date: new Date(),
        status: "SCHEDULED" as const,
        totalCount: 1,
        plannedCount: 1,
        takenCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.dayStatus.upsert
        .mockResolvedValueOnce({
          ...scheduledStatus,
          date: new Date("2025-02-02T00:00:00.000Z"),
          id: "ds2",
        })
        .mockResolvedValueOnce({
          ...scheduledStatus,
          date: new Date("2025-02-03T00:00:00.000Z"),
          id: "ds3",
        });

      prismaMock.dayStatus.findUnique
        .mockResolvedValueOnce({
          ...scheduledStatus,
          date: new Date("2025-02-02T00:00:00.000Z"),
          id: "ds2",
        })
        .mockResolvedValueOnce({
          ...scheduledStatus,
          date: new Date("2025-02-03T00:00:00.000Z"),
          id: "ds3",
        });

      const result = await getDayStatusesForRange(
        userId,
        startDate,
        endDate,
        timezone,
      );

      expect(result["2025-02-01"]).toBe("ALL_TAKEN");
      expect(result["2025-02-02"]).toBe("SCHEDULED");
      expect(result["2025-02-03"]).toBe("SCHEDULED");
    });
  });

  describe("updateDayStatusesForDates", () => {
    const userId = "u1";
    const dates = [
      new Date("2025-02-01T12:00:00.000Z"),
      new Date("2025-02-02T12:00:00.000Z"),
    ];
    const timezone = "UTC";

    beforeEach(() => {
      jest.setSystemTime(new Date("2025-02-05T12:00:00.000Z"));
      prismaMock.scheduleEntry.findMany
        .mockResolvedValueOnce([{ status: "PLANNED" }])
        .mockResolvedValueOnce([{ status: "PLANNED" }])
        .mockResolvedValueOnce([{ status: "PLANNED" }])
        .mockResolvedValueOnce([{ status: "PLANNED" }]);
    });

    it("updates statuses for multiple dates", async () => {
      prismaMock.dayStatus.upsert.mockResolvedValue({
        id: "ds1",
        userId,
        date: new Date(),
        status: "SCHEDULED",
        totalCount: 1,
        plannedCount: 1,
        takenCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await updateDayStatusesForDates(userId, dates, timezone);

      expect(prismaMock.dayStatus.upsert).toHaveBeenCalledTimes(2);
    });
  });

  describe("invalidateDayStatus", () => {
    const userId = "u1";
    const date = new Date("2025-02-15T12:00:00.000Z");
    const timezone = "UTC";

    it("deletes day status cache for date", async () => {
      prismaMock.dayStatus.deleteMany.mockResolvedValueOnce({ count: 1 });

      await invalidateDayStatus(userId, date, timezone);

      expect(prismaMock.dayStatus.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          date: expect.any(Date),
        },
      });
    });
  });
});
