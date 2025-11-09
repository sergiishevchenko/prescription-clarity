import {
  generateScheduleSchema,
  scheduleQuerySchema,
  updateScheduleStatusSchema,
} from "@/lib/validators/schedule";

describe("Schedule validators", () => {
  it("accepts valid generate payload", () => {
    expect(() =>
      generateScheduleSchema.parse({ medicationId: "med123" }),
    ).not.toThrow();
  });

  it("rejects missing medicationId", () => {
    expect(() => generateScheduleSchema.parse({ medicationId: "" })).toThrow();
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
});
