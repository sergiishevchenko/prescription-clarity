import * as ShareRevokeRoute from "@/app/api/share/revoke/route";
import { prismaMock } from "../../../tests-setup/prisma.mock";
import * as SessionModule from "@/lib/auth/session";

type PostHandler = typeof ShareRevokeRoute.POST;
type PostRequest = Parameters<PostHandler>[0];

const makePostReq = (body: object): PostRequest =>
  new Request("http://localhost/api/share/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as PostRequest;

const mockOwner = {
  id: "owner123",
  email: "owner@example.com",
  name: "Owner User",
};

const mockOtherUser = {
  id: "other456",
  email: "other@example.com",
  name: "Other User",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/share/revoke", () => {
  it("should return 401 if user is not authenticated", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(null);

    const res = await ShareRevokeRoute.POST(
      makePostReq({ token: "some-token" }),
    );
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should revoke share link by token", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockOwner);

    const mockShareLink = {
      id: "share1",
      ownerId: mockOwner.id,
      status: "active" as const,
    };

    prismaMock.shareLink.findFirst.mockResolvedValueOnce(mockShareLink);

    const updatedShareLink = {
      id: "share1",
      token: "revoked-token",
      status: "revoked" as const,
      updatedAt: new Date("2025-11-26T12:00:00Z"),
    };

    prismaMock.shareLink.update.mockResolvedValueOnce(updatedShareLink);

    const res = await ShareRevokeRoute.POST(
      makePostReq({ token: "revoked-token" }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.shareLink.status).toBe("revoked");
    expect(data.shareLink.revokedAt).toBe(
      updatedShareLink.updatedAt.toISOString(),
    );

    expect(prismaMock.shareLink.findFirst).toHaveBeenCalledWith({
      where: { token: "revoked-token" },
      select: {
        id: true,
        ownerId: true,
        viewerId: true,
        status: true,
      },
    });

    expect(prismaMock.shareLink.update).toHaveBeenCalledWith({
      where: { id: "share1" },
      data: { status: "revoked" },
      select: expect.any(Object),
    });
  });

  it("should revoke share link by shareId", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockOwner);

    const mockShareLink = {
      id: "share2",
      ownerId: mockOwner.id,
      status: "active" as const,
    };

    prismaMock.shareLink.findFirst.mockResolvedValueOnce(mockShareLink);

    const updatedShareLink = {
      id: "share2",
      token: "some-token",
      status: "revoked" as const,
      updatedAt: new Date(),
    };

    prismaMock.shareLink.update.mockResolvedValueOnce(updatedShareLink);

    const res = await ShareRevokeRoute.POST(makePostReq({ shareId: "share2" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    expect(prismaMock.shareLink.findFirst).toHaveBeenCalledWith({
      where: { id: "share2" },
      select: {
        id: true,
        ownerId: true,
        viewerId: true,
        status: true,
      },
    });
  });

  it("should return 404 if share link not found", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockOwner);

    prismaMock.shareLink.findFirst.mockResolvedValueOnce(null);

    const res = await ShareRevokeRoute.POST(
      makePostReq({ token: "non-existent-token" }),
    );
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Share link not found");
  });

  it("should return 403 if user is not the owner", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockOtherUser);

    const mockShareLink = {
      id: "share3",
      ownerId: mockOwner.id, // Different owner
      status: "active" as const,
    };

    prismaMock.shareLink.findFirst.mockResolvedValueOnce(mockShareLink);

    const res = await ShareRevokeRoute.POST(
      makePostReq({ token: "other-user-token" }),
    );
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Forbidden: You do not own this share link");
  });

  it("should return 403 if revoking by shareId that belongs to another user", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockOtherUser);

    const mockShareLink = {
      id: "shareX",
      ownerId: mockOwner.id,
      status: "active" as const,
    };

    prismaMock.shareLink.findFirst.mockResolvedValueOnce(mockShareLink);

    const res = await ShareRevokeRoute.POST(makePostReq({ shareId: "shareX" }));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Forbidden: You do not own this share link");
    expect(prismaMock.shareLink.update).not.toHaveBeenCalled();
  });

  it("should return 400 if neither token nor shareId provided", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockOwner);

    const res = await ShareRevokeRoute.POST(makePostReq({}));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid input data");
  });

  it("should return 500 on database error", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockOwner);

    prismaMock.shareLink.findFirst.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementationOnce(() => {});

    const res = await ShareRevokeRoute.POST(
      makePostReq({ token: "some-token" }),
    );
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
