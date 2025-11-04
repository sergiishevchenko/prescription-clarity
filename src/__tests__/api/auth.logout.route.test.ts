import { getSessionCookie, clearSessionCookie } from "@/lib/auth/cookies";
import * as Session from "@/lib/auth/session";
import * as LogoutRoute from "@/app/api/auth/logout/route";

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("200 and clears cookie when session exists", async () => {
    (getSessionCookie as jest.Mock).mockResolvedValueOnce("token-123");
    const destroySessionSpy = jest
      .spyOn(Session, "destroySession")
      .mockResolvedValueOnce(undefined);

    const res = await LogoutRoute.POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(destroySessionSpy).toHaveBeenCalledWith("token-123");
    expect(clearSessionCookie).toHaveBeenCalled();
    destroySessionSpy.mockRestore();
  });

  it("200 even when no session cookie", async () => {
    (getSessionCookie as jest.Mock).mockResolvedValueOnce(null);
    const destroySessionSpy = jest.spyOn(Session, "destroySession");

    const res = await LogoutRoute.POST();
    expect(res.status).toBe(200);
    expect(destroySessionSpy).not.toHaveBeenCalled();
    expect(clearSessionCookie).toHaveBeenCalled();
    destroySessionSpy.mockRestore();
  });
});
