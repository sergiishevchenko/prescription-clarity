import * as ShareStatusRoute from "@/app/api/share/status/route";
import { prismaMock } from "../../../tests-setup/prisma.mock";
import * as SessionModule from "@/lib/auth/session";

type GetHandler = typeof ShareStatusRoute.GET;
type GetRequest = Parameters<GetHandler>[0];

const makeGetReq = (queryParams = ""): GetRequest =>
  new Request(
    `http://localhost/api/share/status${queryParams}`,
  ) as unknown as GetRequest;

const mockUser = {
  id: "user123",
  email: "owner@example.com",
  name: "Owner User",
};

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date("2025-11-26T12:00:00Z"));
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("GET /api/share/status", () => {
  it("should return 401 if user is not authenticated", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(null);

    const res = await ShareStatusRoute.GET(makeGetReq());
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return active share links by default", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const mockShareLinks = [
      {
        id: "share1",
        token: "token1",
        viewerId: null,
        expiresAt: new Date("2025-11-28T12:00:00Z"),
        status: "active" as const,
        createdAt: new Date("2025-11-26T10:00:00Z"),
        updatedAt: new Date("2025-11-26T10:00:00Z"),
        viewer: null,
      },
      {
        id: "share2",
        token: "token2",
        viewerId: "viewer456",
        expiresAt: new Date("2025-11-29T12:00:00Z"),
        status: "active" as const,
        createdAt: new Date("2025-11-26T11:00:00Z"),
        updatedAt: new Date("2025-11-26T11:00:00Z"),
        viewer: {
          id: "viewer456",
          email: "viewer@example.com",
          name: "Viewer User",
        },
      },
    ];

    prismaMock.shareLink.findMany.mockResolvedValueOnce(mockShareLinks);

    const res = await ShareStatusRoute.GET(makeGetReq());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.shareLinks).toHaveLength(2);
    expect(data.shareLinks[0].status).toBe("active");
    expect(data.shareLinks[1].viewer).toEqual({
      id: "viewer456",
      email: "viewer@example.com",
      name: "Viewer User",
    });

    expect(prismaMock.shareLink.findMany).toHaveBeenCalledWith({
      where: {
        ownerId: mockUser.id,
      },
      select: expect.any(Object),
      orderBy: {
        createdAt: "desc",
      },
    });
  });

  it("should filter by status=revoked", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const mockRevokedLinks = [
      {
        id: "share3",
        token: "token3",
        viewerId: null,
        expiresAt: new Date(),
        status: "revoked" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        viewer: null,
      },
    ];

    prismaMock.shareLink.findMany.mockResolvedValueOnce(mockRevokedLinks);

    const res = await ShareStatusRoute.GET(makeGetReq("?status=revoked"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.shareLinks).toHaveLength(1);
    expect(data.shareLinks[0].status).toBe("revoked");

    expect(prismaMock.shareLink.findMany).toHaveBeenCalledWith({
      where: {
        ownerId: mockUser.id,
      },
      select: expect.any(Object),
      orderBy: {
        createdAt: "desc",
      },
    });
  });

  it("should filter by status=expired", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const mockExpiredLinks = [
      {
        id: "share4",
        token: "token4",
        viewerId: null,
        expiresAt: new Date("2025-11-20T12:00:00Z"),
        status: "expired" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        viewer: null,
      },
    ];

    prismaMock.shareLink.findMany.mockResolvedValueOnce(mockExpiredLinks);

    const res = await ShareStatusRoute.GET(makeGetReq("?status=expired"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.shareLinks).toHaveLength(1);
    expect(data.shareLinks[0].status).toBe("expired");
  });

  it("should return all share links when status=all", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const mockAllLinks = [
      {
        id: "share5",
        token: "token5",
        viewerId: null,
        expiresAt: new Date(),
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        viewer: null,
      },
      {
        id: "share6",
        token: "token6",
        viewerId: null,
        expiresAt: new Date(),
        status: "revoked" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        viewer: null,
      },
    ];

    prismaMock.shareLink.findMany.mockResolvedValueOnce(mockAllLinks);

    const res = await ShareStatusRoute.GET(makeGetReq("?status=all"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.shareLinks).toHaveLength(2);

    expect(prismaMock.shareLink.findMany).toHaveBeenCalledWith({
      where: {
        ownerId: mockUser.id,
      },
      select: expect.any(Object),
      orderBy: {
        createdAt: "desc",
      },
    });
  });

  it("should only return user's own share links", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.shareLink.findMany.mockResolvedValueOnce([]);

    await ShareStatusRoute.GET(makeGetReq());

    expect(prismaMock.shareLink.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownerId: mockUser.id,
        }),
      }),
    );
  });

  it("should return empty array if no share links exist", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.shareLink.findMany.mockResolvedValueOnce([]);

    const res = await ShareStatusRoute.GET(makeGetReq());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.shareLinks).toEqual([]);
  });

  it("should return 400 on invalid status parameter", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const res = await ShareStatusRoute.GET(makeGetReq("?status=invalid"));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid query parameters");
  });

  it("should return 500 on database error", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.shareLink.findMany.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementationOnce(() => {});

    const res = await ShareStatusRoute.GET(makeGetReq());
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
