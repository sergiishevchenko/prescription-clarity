import * as ShareRoute from "@/app/api/share/route";
import { prismaMock } from "../../../tests-setup/prisma.mock";
import * as SessionModule from "@/lib/auth/session";

jest.mock("@/lib/share/token", () => ({
  generateShareToken: jest.fn(),
  getDefaultExpiry: jest.fn(),
}));

import * as TokenModule from "@/lib/share/token";

type PostHandler = typeof ShareRoute.POST;
type PostRequest = Parameters<PostHandler>[0];

const makePostReq = (body: object): PostRequest =>
  new Request("http://localhost/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as PostRequest;

const mockUser = {
  id: "user123",
  email: "owner@example.com",
  name: "Owner User",
};

beforeEach(() => {
  jest.clearAllMocks();
  // Set env var so route doesn't access request.nextUrl (which doesn't exist on standard Request)
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_APP_URL;
});

describe("POST /api/share", () => {
  it("should return 401 if user is not authenticated", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(null);

    const res = await ShareRoute.POST(makePostReq({}));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should create share link with default 48h expiry", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const mockToken = "mock-secure-token-abc123";
    const mockExpiry = new Date("2025-11-28T12:00:00Z");

    (TokenModule.generateShareToken as jest.Mock).mockReturnValueOnce(
      mockToken,
    );
    (TokenModule.getDefaultExpiry as jest.Mock).mockReturnValueOnce(mockExpiry);

    const mockShareLink = {
      id: "share1",
      token: mockToken,
      ownerId: mockUser.id,
      viewerId: null,
      expiresAt: mockExpiry,
      status: "active" as const,
      createdAt: new Date("2025-11-26T12:00:00Z"),
      updatedAt: new Date("2025-11-26T12:00:00Z"),
    };

    prismaMock.shareLink.create.mockResolvedValueOnce(mockShareLink);

    const res = await ShareRoute.POST(makePostReq({}));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.shareLink).toMatchObject({
      id: "share1",
      token: mockToken,
      expiresAt: mockExpiry.toISOString(),
      status: "active",
    });
    expect(data.shareLink.shareUrl).toContain(`token=${mockToken}`);
    expect(data.shareLink.shareUrl).toContain("/api/share/accept");

    expect(prismaMock.shareLink.create).toHaveBeenCalledWith({
      data: {
        token: mockToken,
        ownerId: mockUser.id,
        expiresAt: mockExpiry,
        status: "active",
      },
      select: expect.any(Object),
    });
  });

  it("uses default expiry helper when expiresAt is not provided", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const mockToken = "mock-secure-token-ttl";
    const defaultExpiry = new Date("2025-12-31T12:00:00Z");

    (TokenModule.generateShareToken as jest.Mock).mockReturnValueOnce(
      mockToken,
    );
    (TokenModule.getDefaultExpiry as jest.Mock).mockReturnValueOnce(
      defaultExpiry,
    );

    prismaMock.shareLink.create.mockResolvedValueOnce({
      id: "share-ttl",
      token: mockToken,
      ownerId: mockUser.id,
      viewerId: null,
      expiresAt: defaultExpiry,
      status: "active" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await ShareRoute.POST(makePostReq({}));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.shareLink.expiresAt).toBe(defaultExpiry.toISOString());
    expect(TokenModule.getDefaultExpiry).toHaveBeenCalledTimes(1);
  });

  it("should create share link with custom expiresAt", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const mockToken = "mock-token-custom";
    const customExpiry = new Date("2025-12-01T12:00:00Z");

    (TokenModule.generateShareToken as jest.Mock).mockReturnValueOnce(
      mockToken,
    );

    const mockShareLink = {
      id: "share2",
      token: mockToken,
      ownerId: mockUser.id,
      viewerId: null,
      expiresAt: customExpiry,
      status: "active" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.shareLink.create.mockResolvedValueOnce(mockShareLink);

    const res = await ShareRoute.POST(
      makePostReq({
        expiresAt: customExpiry.toISOString(),
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.shareLink.expiresAt).toBe(customExpiry.toISOString());
    expect(TokenModule.getDefaultExpiry).not.toHaveBeenCalled();
  });

  it("should generate unique secure token", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const mockToken = "unique-secure-token-xyz";
    (TokenModule.generateShareToken as jest.Mock).mockReturnValueOnce(
      mockToken,
    );
    (TokenModule.getDefaultExpiry as jest.Mock).mockReturnValueOnce(new Date());

    prismaMock.shareLink.create.mockResolvedValueOnce({
      id: "share3",
      token: mockToken,
      ownerId: mockUser.id,
      viewerId: null,
      expiresAt: new Date(),
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await ShareRoute.POST(makePostReq({}));

    expect(TokenModule.generateShareToken).toHaveBeenCalledTimes(1);
  });

  it("should return 400 on invalid input data", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const res = await ShareRoute.POST(
      makePostReq({
        expiresAt: "invalid-date",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid input data");
  });

  it("should return 500 on database error", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    (TokenModule.generateShareToken as jest.Mock).mockReturnValueOnce("token");
    (TokenModule.getDefaultExpiry as jest.Mock).mockReturnValueOnce(new Date());

    prismaMock.shareLink.create.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementationOnce(() => {});

    const res = await ShareRoute.POST(makePostReq({}));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
