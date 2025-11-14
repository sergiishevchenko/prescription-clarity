import {
  createMedicationSchema,
  updateMedicationSchema,
} from "@/lib/validators/medication";

describe("Medication validators", () => {
  it("accepts valid create payload", () => {
    expect(() =>
      createMedicationSchema.parse({
        name: "Ibuprofen",
        dose: "200mg",
        units: "tablets",
        frequency: 8,
        startDate: "2025-02-01T00:00:00.000Z",
        endDate: "2025-02-10T00:00:00.000Z",
      }),
    ).not.toThrow();
  });

  it("rejects create payload with non-positive frequency", () => {
    expect(() =>
      createMedicationSchema.parse({
        name: "Ibuprofen",
        dose: "200mg",
        units: "tablets",
        frequency: 0,
        startDate: "2025-02-01T00:00:00.000Z",
        endDate: "2025-02-10T00:00:00.000Z",
      }),
    ).toThrow();
  });

  it("accepts update payload with partial fields", () => {
    expect(() =>
      updateMedicationSchema.parse({
        name: "Updated",
        frequency: 12,
      }),
    ).not.toThrow();
  });

  it("rejects update payload with invalid date format", () => {
    expect(() =>
      updateMedicationSchema.parse({
        startDate: "tomorrow" as string,
      }),
    ).toThrow();
  });

  it("rejects update payload with negative frequency", () => {
    expect(() =>
      updateMedicationSchema.parse({
        frequency: -5,
      }),
    ).toThrow();
  });

  it("rejects create payload with missing units field", () => {
    expect(() =>
      createMedicationSchema.parse({
        name: "Ibuprofen",
        dose: "200mg",
        frequency: 8,
        startDate: "2025-02-01T00:00:00.000Z",
        endDate: "2025-02-10T00:00:00.000Z",
      }),
    ).toThrow();
  });

  it("rejects create payload with invalid units value", () => {
    expect(() =>
      createMedicationSchema.parse({
        name: "Ibuprofen",
        dose: "200mg",
        units: "invalid-unit",
        frequency: 8,
        startDate: "2025-02-01T00:00:00.000Z",
        endDate: "2025-02-10T00:00:00.000Z",
      }),
    ).toThrow();
  });

  it("accepts create payload with different valid units", () => {
    const validUnitTests = [
      "tablets",
      "capsules",
      "lozenges",
      "drops",
      "mg",
      "ml",
    ];

    validUnitTests.forEach((unit) => {
      expect(() =>
        createMedicationSchema.parse({
          name: "Medication",
          dose: "100",
          units: unit,
          frequency: 12,
          startDate: "2025-02-01T00:00:00.000Z",
          endDate: "2025-02-10T00:00:00.000Z",
        }),
      ).not.toThrow();
    });
  });

  it("accepts update payload with valid units", () => {
    expect(() =>
      updateMedicationSchema.parse({
        units: "capsules",
      }),
    ).not.toThrow();
  });

  it("rejects update payload with invalid units value", () => {
    expect(() =>
      updateMedicationSchema.parse({
        units: "invalid-unit-type",
      }),
    ).toThrow();
  });

  it("rejects create payload with empty units string", () => {
    expect(() =>
      createMedicationSchema.parse({
        name: "Ibuprofen",
        dose: "200mg",
        units: "",
        frequency: 8,
        startDate: "2025-02-01T00:00:00.000Z",
        endDate: "2025-02-10T00:00:00.000Z",
      }),
    ).toThrow();
  });
});
