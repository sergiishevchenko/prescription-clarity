import { loginSchema, registerSchema } from "@/lib/validators/auth";

describe("Auth validators (Zod)", () => {
  it("login: valid payload", () => {
    expect(() =>
      loginSchema.parse({ email: "a@b.com", password: "Secret123" }),
    ).not.toThrow();
  });

  it("login: invalid email", () => {
    expect(() =>
      loginSchema.parse({ email: "bad", password: "Secret123" }),
    ).toThrow();
  });

  it("register: requires proper email & password", () => {
    expect(() =>
      registerSchema.parse({
        email: "user@test.com",
        password: "Secret123",
        name: "U",
      }),
    ).not.toThrow();
    expect(() =>
      registerSchema.parse({
        email: "user@test.com",
        password: "123",
        name: "U",
      }),
    ).toThrow();
  });
});
