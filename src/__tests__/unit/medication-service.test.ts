import {
  createMedicationVersion,
  deleteFutureScheduleEntries,
  deleteMedicationWithCleanup,
  softDeleteMedication,
  softDeleteRelatedSchedules,
} from "@/lib/medication-service";
import { prismaMock } from "../../../tests-setup/prisma.mock";
import { updateDayStatusesForDates } from "@/lib/day-status";

jest.mock("@/lib/day-status", () => ({
  updateDayStatusesForDates: jest.fn(),
}));

const fixedNow = new Date("2025-01-10T10:00:00Z");

describe("medication-service", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    jest.setSystemTime(fixedNow);
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe("softDeleteMedication", () => {
    it("returns null when medication is not found for user", async () => {
      prismaMock.medication.findFirst.mockResolvedValueOnce(null);

      const result = await softDeleteMedication("missing-med", "user-1");

      expect(result).toBeNull();
      expect(prismaMock.medication.update).not.toHaveBeenCalled();
    });

    it("soft deletes medication when present", async () => {
      const medication = {
        id: "med-1",
        userId: "user-1",
        name: "Ibuprofen",
        deletedAt: null,
      };
      prismaMock.medication.findFirst.mockResolvedValueOnce(medication);
      prismaMock.medication.update.mockResolvedValueOnce({
        ...medication,
        deletedAt: fixedNow,
      });

      const result = await softDeleteMedication("med-1", "user-1");

      expect(prismaMock.medication.update).toHaveBeenCalledWith({
        where: { id: "med-1" },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result?.deletedAt).toEqual(fixedNow);
    });
  });

  describe("softDeleteRelatedSchedules", () => {
    it("soft deletes active schedules linked to medication", async () => {
      prismaMock.schedule.updateMany.mockResolvedValueOnce({ count: 2 });

      const deletedCount = await softDeleteRelatedSchedules("med-1", "user-1");

      expect(deletedCount).toBe(2);
      expect(prismaMock.schedule.updateMany).toHaveBeenCalledWith({
        where: { medicationId: "med-1", userId: "user-1", deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe("deleteFutureScheduleEntries", () => {
    it("removes only future planned entries and returns affected dates", async () => {
      prismaMock.scheduleEntry.findMany.mockResolvedValueOnce([
        { id: "e1", dateTime: new Date("2025-01-11T08:00:00Z") },
        { id: "e2", dateTime: new Date("2025-01-12T20:00:00Z") },
      ]);
      prismaMock.scheduleEntry.deleteMany.mockResolvedValueOnce({ count: 2 });

      const result = await deleteFutureScheduleEntries("med-1", "user-1");

      expect(prismaMock.scheduleEntry.findMany).toHaveBeenCalledWith({
        where: {
          medicationId: "med-1",
          userId: "user-1",
          dateTime: { gte: fixedNow },
          status: "PLANNED",
        },
        select: { id: true, dateTime: true },
      });
      expect(prismaMock.scheduleEntry.deleteMany).toHaveBeenCalledWith({
        where: {
          medicationId: "med-1",
          userId: "user-1",
          dateTime: { gte: fixedNow },
          status: "PLANNED",
        },
      });
      expect(result.count).toBe(2);
      const expectedDates = [
        "2025-01-11T08:00:00Z",
        "2025-01-12T20:00:00Z",
      ].map((iso) => {
        const d = new Date(iso);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
      });
      const affectedIso = result.affectedDates.map((d) => d.toISOString());
      expect(affectedIso).toEqual(expect.arrayContaining(expectedDates));
    });

    it("returns zero count and empty dates when nothing to delete", async () => {
      prismaMock.scheduleEntry.findMany.mockResolvedValueOnce([]);
      prismaMock.scheduleEntry.deleteMany.mockResolvedValueOnce({ count: 0 });

      const result = await deleteFutureScheduleEntries("med-1", "user-1");

      expect(result).toEqual({ count: 0, affectedDates: [] });
    });
  });

  describe("createMedicationVersion", () => {
    it("soft deletes previous version, cleans future entries, and creates new schedule", async () => {
      const previousMedication = {
        id: "med-1",
        userId: "user-1",
        name: "Old Name",
        dose: 100,
        form: "tablet",
        deletedAt: null,
        schedules: [
          {
            id: "sched-1",
            medicationId: "med-1",
            userId: "user-1",
            quantity: 1,
            units: "pill",
            frequencyDays: [1, 2, 3, 4, 5, 6, 7],
            durationDays: 5,
            dateStart: new Date("2025-01-01T00:00:00Z"),
            dateEnd: null,
            timeOfDay: ["09:00", "21:00"],
            mealTiming: "anytime",
            deletedAt: null,
            createdAt: new Date("2025-01-01T00:00:00Z"),
            updatedAt: new Date("2025-01-01T00:00:00Z"),
          },
        ],
      };

      prismaMock.medication.findFirst.mockResolvedValueOnce(previousMedication);
      prismaMock.scheduleEntry.findMany
        .mockResolvedValueOnce([
          { id: "old-e1", dateTime: new Date("2025-01-11T08:00:00Z") },
        ])
        .mockResolvedValueOnce([
          { dateTime: new Date("2025-01-10T21:00:00Z") },
          { dateTime: new Date("2025-01-11T09:00:00Z") },
        ]);
      prismaMock.scheduleEntry.deleteMany.mockResolvedValue({ count: 1 });
      prismaMock.schedule.updateMany.mockResolvedValueOnce({ count: 1 });
      prismaMock.medication.update.mockResolvedValueOnce({
        ...previousMedication,
        deletedAt: fixedNow,
      });

      const newMedication = {
        id: "med-2",
        userId: "user-1",
        name: "New Name",
        dose: 150,
        form: "capsule",
        previousMedicationId: "med-1",
        deletedAt: null,
        createdAt: fixedNow,
        updatedAt: fixedNow,
      };
      prismaMock.medication.create.mockResolvedValueOnce(newMedication);

      const newSchedule = {
        id: "sched-2",
        medicationId: "med-2",
        userId: "user-1",
        quantity: 1,
        units: "pill",
        frequencyDays: [1, 2, 3, 4, 5, 6, 7],
        durationDays: 5,
        dateStart: (() => {
          const start = new Date(fixedNow);
          start.setHours(0, 0, 0, 0);
          return start;
        })(),
        dateEnd: null,
        timeOfDay: ["09:00", "21:00"],
        mealTiming: "anytime",
        deletedAt: null,
        createdAt: fixedNow,
        updatedAt: fixedNow,
      };
      prismaMock.schedule.create.mockResolvedValueOnce(newSchedule);
      prismaMock.scheduleEntry.createMany.mockResolvedValueOnce({ count: 3 });

      const result = await createMedicationVersion(
        "med-1",
        { name: "New Name", dose: 150, form: "capsule" },
        "user-1",
      );

      expect(prismaMock.scheduleEntry.deleteMany).toHaveBeenCalledWith({
        where: {
          medicationId: "med-1",
          userId: "user-1",
          dateTime: { gte: new Date() },
          status: "PLANNED",
        },
      });
      expect(prismaMock.medication.update).toHaveBeenCalledWith({
        where: { id: "med-1" },
        data: { deletedAt: expect.any(Date) },
      });
      expect(prismaMock.schedule.updateMany).toHaveBeenCalledWith({
        where: { medicationId: "med-1", userId: "user-1", deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      });
      expect(prismaMock.medication.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          name: "New Name",
          dose: 150,
          form: "capsule",
          previousMedicationId: "med-1",
        },
      });
      expect(prismaMock.scheduleEntry.createMany).toHaveBeenCalled();
      expect(result.newMedication.id).toBe("med-2");
      expect(result.previousMedication.id).toBe("med-1");
      expect(result.deletedEntriesCount).toBeGreaterThanOrEqual(0);
      expect(result.generatedEntriesCount).toBe(3);
      const expectedDates = [
        "2025-01-11T08:00:00Z",
        "2025-01-10T21:00:00Z",
        "2025-01-11T09:00:00Z",
      ].map((iso) => {
        const d = new Date(iso);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
      });
      const affectedIso = result.affectedDates.map((d) => d.toISOString());
      expect(affectedIso).toEqual(expect.arrayContaining(expectedDates));
    });
  });

  describe("deleteMedicationWithCleanup", () => {
    it("returns failure when medication is missing", async () => {
      prismaMock.medication.findFirst.mockResolvedValueOnce(null);

      const result = await deleteMedicationWithCleanup(
        "missing-med",
        "user-1",
        "UTC",
      );

      expect(result).toEqual({
        success: false,
        deletedEntriesCount: 0,
        deletedSchedulesCount: 0,
      });
      expect(prismaMock.medication.update).not.toHaveBeenCalled();
    });

    it("soft deletes medication, schedules, and future entries then updates day status cache", async () => {
      prismaMock.medication.findFirst.mockResolvedValueOnce({
        id: "med-1",
        userId: "user-1",
        deletedAt: null,
      });
      prismaMock.scheduleEntry.findMany.mockResolvedValueOnce([
        { dateTime: new Date("2025-01-11T08:00:00Z") },
        { dateTime: new Date("2025-01-12T20:00:00Z") },
      ]);
      prismaMock.scheduleEntry.deleteMany.mockResolvedValue({ count: 2 });
      prismaMock.schedule.updateMany.mockResolvedValueOnce({ count: 1 });
      prismaMock.medication.update.mockResolvedValueOnce({
        id: "med-1",
        deletedAt: fixedNow,
      });
      (updateDayStatusesForDates as jest.Mock).mockResolvedValueOnce(null);

      const result = await deleteMedicationWithCleanup(
        "med-1",
        "user-1",
        "UTC",
      );

      expect(result).toEqual({
        success: true,
        deletedEntriesCount: 2,
        deletedSchedulesCount: 1,
      });
      expect(prismaMock.scheduleEntry.deleteMany).toHaveBeenCalledWith({
        where: {
          medicationId: "med-1",
          userId: "user-1",
          dateTime: { gte: new Date() },
          status: "PLANNED",
        },
      });
      expect(prismaMock.schedule.updateMany).toHaveBeenCalledWith({
        where: { medicationId: "med-1", userId: "user-1", deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      });
      const expectedDates = [
        "2025-01-11T08:00:00Z",
        "2025-01-12T20:00:00Z",
      ].map((iso) => {
        const d = new Date(iso);
        d.setHours(0, 0, 0, 0);
        return d;
      });
      expect(updateDayStatusesForDates).toHaveBeenCalledWith(
        "user-1",
        expectedDates,
        "UTC",
      );
    });
  });
});
