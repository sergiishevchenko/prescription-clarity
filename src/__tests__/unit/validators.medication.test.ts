import {
  createMedicationSchema,
  updateMedicationSchema,
} from "@/lib/validators/medication";

describe("Medication validators", () => {
  it("accepts valid create payload", () => {
    expect(() =>
      createMedicationSchema.parse({
        name: "Ibuprofen",
        dose: 200,
        form: "tablets",
      }),
    ).not.toThrow();
  });

  it("rejects create payload with non-positive dose", () => {
    expect(() =>
      createMedicationSchema.parse({
        name: "Ibuprofen",
        dose: 0,
        form: "tablets",
      }),
    ).toThrow();
  });

  it("rejects create payload with negative dose", () => {
    expect(() =>
      createMedicationSchema.parse({
        name: "Ibuprofen",
        dose: -200,
        form: "tablets",
      }),
    ).toThrow();
  });

  it("accepts update payload with partial fields", () => {
    expect(() =>
      updateMedicationSchema.parse({
        name: "Updated",
      }),
    ).not.toThrow();
  });

  it("rejects update payload with negative dose", () => {
    expect(() =>
      updateMedicationSchema.parse({
        dose: -5,
      }),
    ).toThrow();
  });

  it("accepts create payload without form field", () => {
    const result = createMedicationSchema.parse({
      name: "Ibuprofen",
      dose: 200,
    });

    expect(result.name).toBe("Ibuprofen");
    expect(result.dose).toBe(200);
    expect(result.form).toBeUndefined();
  });

  it("rejects create payload with invalid form value", () => {
    expect(() =>
      createMedicationSchema.parse({
        name: "Ibuprofen",
        dose: 200,
        form: "invalid-form",
      }),
    ).toThrow();
  });

  it("accepts create payload with different valid form values", () => {
    const validFormTests = [
      "tablets",
      "capsules",
      "lozenges",
      "drops",
      "mg",
      "ml",
    ];

    validFormTests.forEach((form) => {
      expect(() =>
        createMedicationSchema.parse({
          name: "Medication",
          dose: 100,
          form: form,
        }),
      ).not.toThrow();
    });
  });

  it("accepts update payload with valid form", () => {
    expect(() =>
      updateMedicationSchema.parse({
        form: "capsules",
      }),
    ).not.toThrow();
  });

  it("rejects update payload with invalid form value", () => {
    expect(() =>
      updateMedicationSchema.parse({
        form: "invalid-form-type",
      }),
    ).toThrow();
  });

  it("accepts create payload with empty form string (treated as invalid and coerced by schema)", () => {
    expect(() =>
      createMedicationSchema.parse({
        name: "Ibuprofen",
        dose: 200,
        form: "",
      }),
    ).toThrow();
  });

  it("accepts dose as string and coerces to number", () => {
    const result = createMedicationSchema.parse({
      name: "Aspirin",
      dose: "100",
      form: "tablets",
    });

    expect(result.dose).toBe(100);
    expect(typeof result.dose).toBe("number");
  });

  it("rejects non-integer dose values", () => {
    expect(() =>
      createMedicationSchema.parse({
        name: "Aspirin",
        dose: 100.5,
        form: "tablets",
      }),
    ).toThrow();
  });

  it("rejects create payload with missing name", () => {
    expect(() =>
      createMedicationSchema.parse({
        dose: 100,
        form: "tablets",
      }),
    ).toThrow();
  });

  it("rejects create payload with empty name", () => {
    expect(() =>
      createMedicationSchema.parse({
        name: "",
        dose: 100,
        form: "tablets",
      }),
    ).toThrow();
  });

  it("accepts create payload without dose", () => {
    const result = createMedicationSchema.parse({
      name: "Aspirin",
      form: "tablets",
    });

    expect(result.name).toBe("Aspirin");
    expect(result.dose).toBeUndefined();
    expect(result.form).toBe("tablets");
  });
});
