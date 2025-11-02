jest.mock("@/lib/auth/cookies", () => {
  const { mockCookiesAPI } = require("./next-headers.mock");
  const {
    getSessionCookieName,
    getSessionMaxAge,
  } = jest.requireActual("@/lib/auth/session");

  return {
    __esModule: true,
    getSessionCookie: jest.fn(async () => "mock-session-token"),

    setSessionCookie: jest.fn(async (token: string) => {
      const cookieName = getSessionCookieName();
      const maxAge = getSessionMaxAge();

      mockCookiesAPI.set(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge,
        path: "/",
      });
    }),
    clearSessionCookie: jest.fn(() => {
      const cookieName = getSessionCookieName();
      mockCookiesAPI.delete(cookieName);
    }),

    setAuthCookie: jest.fn(() => {}),
    deleteSessionCookie: jest.fn(() => {}),
    setCookieSafe: jest.fn(() => {}),
  };
});
