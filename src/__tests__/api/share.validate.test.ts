import * as ShareValidateRoute from "@/app/api/share/validate/route";
import { prismaMock } from "../../../tests-setup/prisma.mock";

type GetHandler = typeof ShareValidateRoute.GET;
type GetRequest = Parameters<GetHandler>[0];

const makeGetReq = (queryParams = ""): GetRequest =>
  new Request(
    `http://localhost/api/share/validate${queryParams}`,
  ) as unknown as GetRequest;

const mockOwner = {
  id: "owner123",
  name: "Owner User",
  email: "owner@example.com",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/share/validate", () => {
  it("should return 400 if token parameter is missing", async () => {
    const res = await ShareValidateRoute.GET(makeGetReq());
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid token parameter");
  });

  it("should return 404 if token not found", async () => {
    prismaMock.shareLink.findUnique.mockResolvedValueOnce(null);

    const res = await ShareValidateRoute.GET(
      makeGetReq("?token=non-existent-token"),
    );
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.valid).toBe(false);
    expect(data.error).toBe("Token not found");
  });

  it("should return valid=false if token is revoked", async () => {
    const mockShareLink = {
      id: "share1",
      ownerId: mockOwner.id,
      viewerId: null,
      expiresAt: new Date("2025-11-28T12:00:00Z"),
      status: "revoked" as const,
      owner: mockOwner,
    };

    prismaMock.shareLink.findUnique.mockResolvedValueOnce(mockShareLink);

    const res = await ShareValidateRoute.GET(
      makeGetReq("?token=revoked-token"),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.valid).toBe(false);
    expect(data.error).toBe("Token has been revoked");
    expect(data.status).toBe("revoked");
  });

  it("should return valid=false if token is expired", async () => {
    const pastDate = new Date("2025-11-20T12:00:00Z");
    const mockShareLink = {
      id: "share2",
      ownerId: mockOwner.id,
      viewerId: null,
      expiresAt: pastDate,
      status: "active" as const,
      owner: mockOwner,
    };

    prismaMock.shareLink.findUnique.mockResolvedValueOnce(mockShareLink);
    prismaMock.shareLink.update.mockResolvedValueOnce({
      ...mockShareLink,
      status: "expired",
    });

    const res = await ShareValidateRoute.GET(
      makeGetReq("?token=expired-token"),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.valid).toBe(false);
    expect(data.error).toBe("Token has expired");
    expect(data.status).toBe("expired");
    expect(data.expiresAt).toBe(pastDate.toISOString());

    // Should update status to expired
    expect(prismaMock.shareLink.update).toHaveBeenCalledWith({
      where: { id: "share2" },
      data: { status: "expired" },
    });
  });

  it("should not update status if already expired", async () => {
    const pastDate = new Date("2025-11-20T12:00:00Z");
    const mockShareLink = {
      id: "share3",
      ownerId: mockOwner.id,
      viewerId: null,
      expiresAt: pastDate,
      status: "expired" as const,
      owner: mockOwner,
    };

    prismaMock.shareLink.findUnique.mockResolvedValueOnce(mockShareLink);

    const res = await ShareValidateRoute.GET(
      makeGetReq("?token=already-expired-token"),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.valid).toBe(false);
    expect(prismaMock.shareLink.update).not.toHaveBeenCalled();
  });

  it("should return valid=true for active non-expired token", async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const mockShareLink = {
      id: "share4",
      ownerId: mockOwner.id,
      viewerId: null,
      expiresAt: futureDate,
      status: "active" as const,
      owner: mockOwner,
    };

    prismaMock.shareLink.findUnique.mockResolvedValueOnce(mockShareLink);

    const res = await ShareValidateRoute.GET(makeGetReq("?token=valid-token"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.shareLink).toMatchObject({
      id: "share4",
      ownerId: mockOwner.id,
      viewerId: null,
      expiresAt: futureDate.toISOString(),
      status: "active",
      owner: mockOwner,
    });
  });

  it("should include owner details in valid token response", async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const mockShareLink = {
      id: "share5",
      ownerId: mockOwner.id,
      viewerId: "viewer456",
      expiresAt: futureDate,
      status: "active" as const,
      owner: mockOwner,
    };

    prismaMock.shareLink.findUnique.mockResolvedValueOnce(mockShareLink);

    const res = await ShareValidateRoute.GET(
      makeGetReq("?token=token-with-viewer"),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.shareLink.owner).toEqual(mockOwner);
    expect(data.shareLink.viewerId).toBe("viewer456");
  });

  it("should handle token with special characters", async () => {
    const token = "token-with-special_chars.123";
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const mockShareLink = {
      id: "share6",
      ownerId: mockOwner.id,
      viewerId: null,
      expiresAt: futureDate,
      status: "active" as const,
      owner: mockOwner,
    };

    prismaMock.shareLink.findUnique.mockResolvedValueOnce(mockShareLink);

    const res = await ShareValidateRoute.GET(makeGetReq(`?token=${token}`));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.valid).toBe(true);

    expect(prismaMock.shareLink.findUnique).toHaveBeenCalledWith({
      where: { token },
      select: expect.any(Object),
    });
  });

  it("should return 500 on database error", async () => {
    prismaMock.shareLink.findUnique.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementationOnce(() => {});

    const res = await ShareValidateRoute.GET(makeGetReq("?token=some-token"));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
