import * as ShareAcceptRoute from "@/app/api/share/accept/route";
import { prismaMock } from "../../../tests-setup/prisma.mock";
import * as SessionModule from "@/lib/auth/session";

type PostHandler = typeof ShareAcceptRoute.POST;
type PostRequest = Parameters<PostHandler>[0];

const makePostReq = (body: object): PostRequest =>
  new Request("http://localhost/api/share/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as PostRequest;

const mockOwner = {
  id: "owner123",
  email: "owner@example.com",
  name: "Owner User",
};

const mockViewer = {
  id: "viewer456",
  email: "viewer@example.com",
  name: "Viewer User",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/share/accept", () => {
  it("should return 401 if user is not authenticated", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(null);

    const res = await ShareAcceptRoute.POST(
      makePostReq({ token: "some-token" }),
    );
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 404 if token not found", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockViewer);

    prismaMock.shareLink.findUnique.mockResolvedValueOnce(null);

    const res = await ShareAcceptRoute.POST(
      makePostReq({ token: "non-existent" }),
    );
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Share link not found");
  });

  it("should return 403 if token is revoked", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockViewer);

    // Use a date far in the future (expiration doesn't matter for revoked status, but for consistency)
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const mockShareLink = {
      id: "share1",
      ownerId: mockOwner.id,
      viewerId: null,
      expiresAt: futureDate,
      status: "revoked" as const,
    };

    prismaMock.shareLink.findUnique.mockResolvedValueOnce(mockShareLink);

    const res = await ShareAcceptRoute.POST(
      makePostReq({ token: "revoked-token" }),
    );
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Share link has been revoked");
  });

  it("should return 403 if token is expired", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockViewer);

    const mockShareLink = {
      id: "share2",
      ownerId: mockOwner.id,
      viewerId: null,
      expiresAt: new Date("2025-11-20T12:00:00Z"), // Past date
      status: "active" as const,
    };

    prismaMock.shareLink.findUnique.mockResolvedValueOnce(mockShareLink);

    const res = await ShareAcceptRoute.POST(
      makePostReq({ token: "expired-token" }),
    );
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Share link has expired");
  });

  it("should return 400 if owner tries to accept their own link", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockOwner);

    // Use a date far in the future to ensure it's not expired
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const mockShareLink = {
      id: "share3",
      ownerId: mockOwner.id,
      viewerId: null,
      expiresAt: futureDate,
      status: "active" as const,
    };

    prismaMock.shareLink.findUnique.mockResolvedValueOnce(mockShareLink);

    const res = await ShareAcceptRoute.POST(
      makePostReq({ token: "own-token" }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Cannot accept your own share link");
  });

  it("should accept share link and create CareAccess", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockViewer);

    // Use a date far in the future to ensure it's not expired
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const mockShareLink = {
      id: "share4",
      ownerId: mockOwner.id,
      viewerId: null,
      expiresAt: futureDate,
      status: "active" as const,
    };

    prismaMock.shareLink.findUnique.mockResolvedValueOnce(mockShareLink);
    prismaMock.careAccess.findUnique.mockResolvedValueOnce(null);

    const updatedShareLink = {
      id: "share4",
      token: "valid-token",
      ownerId: mockOwner.id,
      viewerId: mockViewer.id,
    };

    const createdCareAccess = {
      id: "care1",
      ownerId: mockOwner.id,
      viewerId: mockViewer.id,
      createdAt: new Date("2025-11-26T12:00:00Z"),
      owner: mockOwner,
    };

    prismaMock.$transaction.mockImplementationOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (callback: any) => {
        return await callback({
          shareLink: {
            update: jest.fn().mockResolvedValue(updatedShareLink),
          },
          careAccess: {
            create: jest.fn().mockResolvedValue(createdCareAccess),
          },
        });
      },
    );

    const res = await ShareAcceptRoute.POST(
      makePostReq({ token: "valid-token" }),
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Share link accepted successfully");
    expect(data.careAccess).toMatchObject({
      id: "care1",
      ownerId: mockOwner.id,
      viewerId: mockViewer.id,
      owner: mockOwner,
    });
    expect(data.shareLink.id).toBe("share4");
  });

  it("should return 200 if access already exists", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockViewer);

    // Use a date far in the future to ensure it's not expired
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const mockShareLink = {
      id: "share5",
      ownerId: mockOwner.id,
      viewerId: mockViewer.id,
      expiresAt: futureDate,
      status: "active" as const,
    };

    prismaMock.shareLink.findUnique.mockResolvedValueOnce(mockShareLink);

    const existingCareAccess = {
      id: "care2",
      ownerId: mockOwner.id,
      viewerId: mockViewer.id,
      createdAt: new Date("2025-11-25T12:00:00Z"),
      updatedAt: new Date("2025-11-25T12:00:00Z"),
    };

    prismaMock.careAccess.findUnique.mockResolvedValueOnce(existingCareAccess);

    const res = await ShareAcceptRoute.POST(
      makePostReq({ token: "duplicate-token" }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Access already granted");
    expect(data.alreadyExists).toBe(true);
    expect(data.careAccess.id).toBe("care2");

    // Should not create new CareAccess
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("should update viewerId if not already set", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockViewer);

    // Use a date far in the future to ensure it's not expired
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const mockShareLink = {
      id: "share6",
      ownerId: mockOwner.id,
      viewerId: null,
      expiresAt: futureDate,
      status: "active" as const,
    };

    prismaMock.shareLink.findUnique.mockResolvedValueOnce(mockShareLink);
    prismaMock.careAccess.findUnique.mockResolvedValueOnce(null);

    const mockUpdateFn = jest.fn().mockResolvedValue({
      id: "share6",
      token: "token",
      ownerId: mockOwner.id,
      viewerId: mockViewer.id,
    });

    const mockCreateFn = jest.fn().mockResolvedValue({
      id: "care3",
      ownerId: mockOwner.id,
      viewerId: mockViewer.id,
      createdAt: new Date(),
      owner: mockOwner,
    });

    prismaMock.$transaction.mockImplementationOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (callback: any) => {
        return await callback({
          shareLink: { update: mockUpdateFn },
          careAccess: { create: mockCreateFn },
        });
      },
    );

    await ShareAcceptRoute.POST(makePostReq({ token: "new-viewer-token" }));

    expect(mockUpdateFn).toHaveBeenCalledWith({
      where: { id: "share6" },
      data: { viewerId: mockViewer.id },
      select: expect.any(Object),
    });
  });

  it("should not change viewerId if already set", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockViewer);

    // Use a date far in the future to ensure it's not expired
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const existingViewerId = "existing-viewer";
    const mockShareLink = {
      id: "share7",
      ownerId: mockOwner.id,
      viewerId: existingViewerId,
      expiresAt: futureDate,
      status: "active" as const,
    };

    prismaMock.shareLink.findUnique.mockResolvedValueOnce(mockShareLink);
    prismaMock.careAccess.findUnique.mockResolvedValueOnce(null);

    const mockUpdateFn = jest.fn().mockResolvedValue({
      id: "share7",
      token: "token",
      ownerId: mockOwner.id,
      viewerId: existingViewerId,
    });

    const mockCreateFn = jest.fn().mockResolvedValue({
      id: "care4",
      ownerId: mockOwner.id,
      viewerId: mockViewer.id,
      createdAt: new Date(),
      owner: mockOwner,
    });

    prismaMock.$transaction.mockImplementationOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (callback: any) => {
        return await callback({
          shareLink: { update: mockUpdateFn },
          careAccess: { create: mockCreateFn },
        });
      },
    );

    await ShareAcceptRoute.POST(
      makePostReq({ token: "existing-viewer-token" }),
    );

    expect(mockUpdateFn).toHaveBeenCalledWith({
      where: { id: "share7" },
      data: { viewerId: existingViewerId },
      select: expect.any(Object),
    });
  });

  it("should return 400 on invalid input data", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockViewer);

    const res = await ShareAcceptRoute.POST(makePostReq({}));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid input data");
  });

  it("should return 500 on database error", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockViewer);

    prismaMock.shareLink.findUnique.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementationOnce(() => {});

    const res = await ShareAcceptRoute.POST(
      makePostReq({ token: "error-token" }),
    );
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
