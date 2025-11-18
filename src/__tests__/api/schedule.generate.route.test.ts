import * as GenerateRoute from "@/app/api/schedule/generate/route";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";

type PostHandler = typeof GenerateRoute.POST;
type PostRequest = Parameters<PostHandler>[0];

const makePostRequest = (body: object): PostRequest =>
  new Request("http://localhost/api/schedule/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as PostRequest;

const mockUser = { id: "u1", email: "user@example.com", name: "User" };

describe("POST /api/schedule/generate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no session cookie", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce(null);

    const res = await GenerateRoute.POST(
      makePostRequest({ medicationId: "m1" }),
    );
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Unauthorized" }),
    );
  });

  it("returns 401 when session is invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("invalid");
    jest.mocked(verifySession).mockResolvedValueOnce(null);

    const res = await GenerateRoute.POST(
      makePostRequest({ medicationId: "m1" }),
    );
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid session" }),
    );
  });

  it("returns 400 when payload is invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    const res = await GenerateRoute.POST(makePostRequest({}));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid input data" }),
    );
  });

  it("returns 400 for medication-based generation (deprecated)", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    const res = await GenerateRoute.POST(
      makePostRequest({ medicationId: "m1" }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({
        error:
          "Medication-based schedule generation is no longer supported. Please use Schedule model instead.",
      }),
    );
  });
});
