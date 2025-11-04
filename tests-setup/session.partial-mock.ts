jest.mock("@/lib/auth/session", () => {
  const actual = jest.requireActual("@/lib/auth/session");
  return {
    __esModule: true,
    ...actual,
    verifySession: jest.fn(async (token: string) => {
      if (!token || token === "invalid") return null;
      return { id: "u1", email: "a@b.com", name: "User" };
    }),
  };
});
