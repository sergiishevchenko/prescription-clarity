jest.mock("@/lib/auth/session", () => {
  const actual = jest.requireActual("@/lib/auth/session");
  const mockUser = { id: "u1", email: "a@b.com", name: "User" };

  const verifySessionMock = jest.fn(async (token: string) => {
    if (!token || token === "invalid") return null;
    return mockUser;
  });

  const getSessionUserFromRequestMock = jest.fn(async () => {
    return verifySessionMock("");
  });

  return {
    __esModule: true,
    ...actual,
    verifySession: verifySessionMock,
    getSessionUserFromRequest: getSessionUserFromRequestMock,
  };
});
