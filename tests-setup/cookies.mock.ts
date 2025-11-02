jest.mock("@/lib/auth/cookies", () => {
  const { mockCookiesAPI } = jest.requireActual<
    typeof import("./next-headers.mock")
  >("./next-headers.mock");
  const { getSessionCookieName, getSessionMaxAge } =
    jest.requireActual<typeof import("@/lib/auth/session")>(
      "@/lib/auth/session",
    );

  return {
    __esModule: true,
    getSessionCookie: jest.fn(async () => "mock-session-token"),

    setSessionCookie: jest.fn(async (token: string) => {
      const cookieName = getSessionCookieName();
      getSessionMaxAge();
      mockCookiesAPI.set(cookieName, token);
    }),
    clearSessionCookie: jest.fn(() => {
      const cookieName = getSessionCookieName();
      mockCookiesAPI.delete(cookieName);
    }),

    setAuthCookie: jest.fn(),
    deleteSessionCookie: jest.fn(),
    setCookieSafe: jest.fn(),
  };
});
