import { updateProfileSchema } from "@/lib/validators/profile";

describe("Profile validators (Zod)", () => {
  it("valid name update", () => {
    expect(() => updateProfileSchema.parse({ name: "New Name" })).not.toThrow();
  });

  it("rejects empty/too short name", () => {
    expect(() => updateProfileSchema.parse({ name: "" })).toThrow();
  });
});
