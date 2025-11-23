import {
  generateScheduleSchema,
  scheduleQuerySchema,
  updateScheduleStatusSchema,
  createScheduleSchema,
} from "@/lib/validators/schedule";

describe("Schedule validators", () => {
  it("accepts valid generate payload when scheduleId provided", () => {
    expect(() =>
      generateScheduleSchema.parse({ scheduleId: "sched123" }),
    ).not.toThrow();
  });

  it("accepts valid generate payload when medicationId provided", () => {
    expect(() =>
      generateScheduleSchema.parse({ medicationId: "med123" }),
    ).not.toThrow();
  });

  it("rejects payload without medicationId and scheduleId", () => {
    expect(() => generateScheduleSchema.parse({})).toThrow();
  });

  it("accepts valid schedule query with timezone", () => {
    expect(() =>
      scheduleQuerySchema.parse({
        from: "2025-02-01T00:00:00.000Z",
        to: "2025-02-02T00:00:00.000Z",
        tz: "Europe/Kyiv",
      }),
    ).not.toThrow();
  });

  it("rejects invalid ISO dates in query", () => {
    expect(() =>
      scheduleQuerySchema.parse({
        from: "yesterday",
        to: "tomorrow",
      }),
    ).toThrow();
  });

  it("allows DONE status updates only from enum", () => {
    expect(() =>
      updateScheduleStatusSchema.parse({ status: "DONE" }),
    ).not.toThrow();
    expect(() =>
      updateScheduleStatusSchema.parse({ status: "SKIPPED" as never }),
    ).toThrow();
  });

  it("accepts valid create payload", () => {
    expect(() =>
      createScheduleSchema.parse({
        medicationId: "m1",
        quantity: 2,
        units: "tablets",
        frequencyDays: [1, 3, 5],
        durationDays: 10,
        dateStart: "2025-03-01",
        timeOfDay: ["08:00", "20:00"],
        mealTiming: "before",
      }),
    ).not.toThrow();
  });

  it("rejects create payload with empty frequencyDays", () => {
    expect(() =>
      createScheduleSchema.parse({
        medicationId: "m1",
        quantity: 1,
        units: "pill",
        frequencyDays: [],
        durationDays: 5,
        dateStart: "2025-03-01",
        timeOfDay: ["08:00"],
        mealTiming: "with",
      }),
    ).toThrow();
  });

  it("rejects create payload with invalid time format", () => {
    expect(() =>
      createScheduleSchema.parse({
        medicationId: "m1",
        quantity: 1,
        units: "pill",
        frequencyDays: [1],
        durationDays: 5,
        dateStart: "2025-03-01",
        timeOfDay: ["8am"],
        mealTiming: "with",
      }),
    ).toThrow();
  });

  it("rejects create payload with invalid mealTiming", () => {
    expect(() =>
      createScheduleSchema.parse({
        medicationId: "m1",
        quantity: 1,
        units: "pill",
        frequencyDays: [1],
        durationDays: 5,
        dateStart: "2025-03-01",
        timeOfDay: ["08:00"],
        mealTiming: "invalid" as never,
      }),
    ).toThrow();
  });
});
