import { NextRequest } from "next/server";
import {
  extractShareToken,
  validateShareToken,
  checkCareAccess,
  getUserRole,
  hasResourceAccess,
  getShareAccessContext,
} from "@/lib/middleware/shareAccess";
import { prismaMock } from "../../../../tests-setup/prisma.mock";

describe("ShareAccess Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("extractShareToken", () => {
    it("should extract token from query parameter", () => {
      const req = new NextRequest(
        "http://localhost:3000/api/schedule?token=abc123",
      );
      const token = extractShareToken(req);
      expect(token).toBe("abc123");
    });

    it("should extract token from Authorization header", () => {
      const req = new NextRequest("http://localhost:3000/api/schedule", {
        headers: {
          Authorization: "Bearer xyz789",
        },
      });
      const token = extractShareToken(req);
      expect(token).toBe("xyz789");
    });

    it("should prioritize query parameter over header", () => {
      const req = new NextRequest(
        "http://localhost:3000/api/schedule?token=query-token",
        {
          headers: {
            Authorization: "Bearer header-token",
          },
        },
      );
      const token = extractShareToken(req);
      expect(token).toBe("query-token");
    });

    it("should return null when no token present", () => {
      const req = new NextRequest("http://localhost:3000/api/schedule");
      const token = extractShareToken(req);
      expect(token).toBeNull();
    });

    it("should return null when Authorization header is malformed", () => {
      const req = new NextRequest("http://localhost:3000/api/schedule", {
        headers: {
          Authorization: "InvalidFormat",
        },
      });
      const token = extractShareToken(req);
      expect(token).toBeNull();
    });
  });

  describe("validateShareToken", () => {
    const mockDate = new Date("2025-11-26T12:00:00Z");

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should return null when token not found", async () => {
      prismaMock.shareLink.findUnique.mockResolvedValueOnce(null);

      const result = await validateShareToken("invalid-token");

      expect(result).toBeNull();
      expect(prismaMock.shareLink.findUnique).toHaveBeenCalledWith({
        where: { token: "invalid-token" },
        select: {
          id: true,
          ownerId: true,
          viewerId: true,
          expiresAt: true,
          status: true,
        },
      });
    });

    it("should return null when token is revoked", async () => {
      prismaMock.shareLink.findUnique.mockResolvedValueOnce({
        id: "share1",
        ownerId: "owner1",
        viewerId: null,
        expiresAt: new Date("2025-11-28T12:00:00Z"),
        status: "revoked",
      });

      const result = await validateShareToken("revoked-token");

      expect(result).toBeNull();
    });

    it("should return null and update status when token is expired", async () => {
      const expiredDate = new Date("2025-11-25T12:00:00Z"); // Yesterday

      prismaMock.shareLink.findUnique.mockResolvedValueOnce({
        id: "share1",
        ownerId: "owner1",
        viewerId: null,
        expiresAt: expiredDate,
        status: "active",
      });

      prismaMock.shareLink.update.mockResolvedValueOnce({
        id: "share1",
        token: "expired-token",
        ownerId: "owner1",
        viewerId: null,
        expiresAt: expiredDate,
        status: "expired",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await validateShareToken("expired-token");

      expect(result).toBeNull();
      expect(prismaMock.shareLink.update).toHaveBeenCalledWith({
        where: { id: "share1" },
        data: { status: "expired" },
      });
    });

    it("should return null when status is already expired", async () => {
      const expiredDate = new Date("2025-11-25T12:00:00Z");

      prismaMock.shareLink.findUnique.mockResolvedValueOnce({
        id: "share1",
        ownerId: "owner1",
        viewerId: null,
        expiresAt: expiredDate,
        status: "expired",
      });

      const result = await validateShareToken("expired-token");

      expect(result).toBeNull();
      expect(prismaMock.shareLink.update).not.toHaveBeenCalled();
    });

    it("should return share link details when valid and active", async () => {
      const futureDate = new Date("2025-11-28T12:00:00Z");

      prismaMock.shareLink.findUnique.mockResolvedValueOnce({
        id: "share1",
        ownerId: "owner1",
        viewerId: "viewer1",
        expiresAt: futureDate,
        status: "active",
      });

      const result = await validateShareToken("valid-token");

      expect(result).toEqual({
        id: "share1",
        ownerId: "owner1",
        viewerId: "viewer1",
        status: "active",
      });
      expect(prismaMock.shareLink.update).not.toHaveBeenCalled();
    });
  });

  describe("checkCareAccess", () => {
    it("should return true when care access exists", async () => {
      prismaMock.careAccess.findUnique.mockResolvedValueOnce({
        id: "care1",
        ownerId: "owner1",
        viewerId: "viewer1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const hasAccess = await checkCareAccess("owner1", "viewer1");

      expect(hasAccess).toBe(true);
      expect(prismaMock.careAccess.findUnique).toHaveBeenCalledWith({
        where: {
          ownerId_viewerId: {
            ownerId: "owner1",
            viewerId: "viewer1",
          },
        },
      });
    });

    it("should return false when care access does not exist", async () => {
      prismaMock.careAccess.findUnique.mockResolvedValueOnce(null);

      const hasAccess = await checkCareAccess("owner1", "viewer1");

      expect(hasAccess).toBe(false);
    });
  });

  describe("getUserRole", () => {
    it("should return owner when userId equals ownerId", async () => {
      const role = await getUserRole("user1", "user1");

      expect(role).toBe("owner");
      // No DB calls should be made
      expect(prismaMock.shareLink.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.careAccess.findUnique).not.toHaveBeenCalled();
    });

    it("should return viewer when valid share token provided", async () => {
      // Use a date far in the future to ensure it's not expired
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      prismaMock.shareLink.findUnique.mockResolvedValueOnce({
        id: "share1",
        ownerId: "owner1",
        viewerId: null,
        expiresAt: futureDate,
        status: "active",
      });

      const role = await getUserRole("viewer1", "owner1", "valid-token");

      expect(role).toBe("viewer");
    });

    it("should return viewer when permanent care access exists", async () => {
      // No share token provided, so validateShareToken not called
      prismaMock.careAccess.findUnique.mockResolvedValueOnce({
        id: "care1",
        ownerId: "owner1",
        viewerId: "viewer1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const role = await getUserRole("viewer1", "owner1");

      expect(role).toBe("viewer");
      expect(prismaMock.careAccess.findUnique).toHaveBeenCalledWith({
        where: {
          ownerId_viewerId: {
            ownerId: "owner1",
            viewerId: "viewer1",
          },
        },
      });
    });

    it("should return anonymous when no access", async () => {
      // No share token provided
      prismaMock.careAccess.findUnique.mockResolvedValueOnce(null);

      const role = await getUserRole("viewer1", "owner1");

      expect(role).toBe("anonymous");
    });

    it("should return anonymous when share token is invalid", async () => {
      prismaMock.shareLink.findUnique.mockResolvedValueOnce(null);
      prismaMock.careAccess.findUnique.mockResolvedValueOnce(null);

      const role = await getUserRole("viewer1", "owner1", "invalid-token");

      expect(role).toBe("anonymous");
    });

    it("should return anonymous when share token belongs to different owner", async () => {
      const futureDate = new Date("2025-11-28T12:00:00Z");

      prismaMock.shareLink.findUnique.mockResolvedValueOnce({
        id: "share1",
        ownerId: "differentOwner",
        viewerId: null,
        expiresAt: futureDate,
        status: "active",
      });

      prismaMock.careAccess.findUnique.mockResolvedValueOnce(null);

      const role = await getUserRole("viewer1", "owner1", "valid-token");

      expect(role).toBe("anonymous");
    });
  });

  describe("hasResourceAccess", () => {
    it("should allow owner to access owner-required resources", () => {
      expect(hasResourceAccess("owner", "owner")).toBe(true);
    });

    it("should deny viewer from accessing owner-required resources", () => {
      expect(hasResourceAccess("viewer", "owner")).toBe(false);
    });

    it("should deny anonymous from accessing owner-required resources", () => {
      expect(hasResourceAccess("anonymous", "owner")).toBe(false);
    });

    it("should allow owner to access viewer-required resources", () => {
      expect(hasResourceAccess("owner", "viewer")).toBe(true);
    });

    it("should allow viewer to access viewer-required resources", () => {
      expect(hasResourceAccess("viewer", "viewer")).toBe(true);
    });

    it("should deny anonymous from accessing viewer-required resources", () => {
      expect(hasResourceAccess("anonymous", "viewer")).toBe(false);
    });
  });

  describe("getShareAccessContext", () => {
    const mockDate = new Date("2025-11-26T12:00:00Z");

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should return owner context when userId equals ownerId", async () => {
      const req = new NextRequest("http://localhost:3000/api/schedule");

      const context = await getShareAccessContext(req, "user1", "user1");

      expect(context).toEqual({
        userId: "user1",
        role: "owner",
        ownerId: "user1",
        shareToken: undefined,
      });
    });

    it("should return viewer context with valid token", async () => {
      const futureDate = new Date("2025-11-28T12:00:00Z");

      const req = new NextRequest(
        "http://localhost:3000/api/schedule?token=valid-token",
      );

      prismaMock.shareLink.findUnique.mockResolvedValueOnce({
        id: "share1",
        ownerId: "owner1",
        viewerId: null,
        expiresAt: futureDate,
        status: "active",
      });

      const context = await getShareAccessContext(req, "viewer1", "owner1");

      expect(context).toEqual({
        userId: "viewer1",
        role: "viewer",
        ownerId: "owner1",
        shareToken: "valid-token",
      });
    });

    it("should return viewer context with permanent care access", async () => {
      const req = new NextRequest("http://localhost:3000/api/schedule");

      prismaMock.careAccess.findUnique.mockResolvedValueOnce({
        id: "care1",
        ownerId: "owner1",
        viewerId: "viewer1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const context = await getShareAccessContext(req, "viewer1", "owner1");

      expect(context).toEqual({
        userId: "viewer1",
        role: "viewer",
        ownerId: "owner1",
        shareToken: undefined,
      });
    });

    it("should return anonymous context when no access", async () => {
      const req = new NextRequest("http://localhost:3000/api/schedule");

      prismaMock.careAccess.findUnique.mockResolvedValueOnce(null);

      const context = await getShareAccessContext(req, "viewer1", "owner1");

      expect(context).toEqual({
        userId: "viewer1",
        role: "anonymous",
        ownerId: "owner1",
        shareToken: undefined,
      });
    });

    it("should extract token from Authorization header", async () => {
      const futureDate = new Date("2025-11-28T12:00:00Z");

      const req = new NextRequest("http://localhost:3000/api/schedule", {
        headers: {
          Authorization: "Bearer header-token",
        },
      });

      prismaMock.shareLink.findUnique.mockResolvedValueOnce({
        id: "share1",
        ownerId: "owner1",
        viewerId: null,
        expiresAt: futureDate,
        status: "active",
      });

      const context = await getShareAccessContext(req, "viewer1", "owner1");

      expect(context).toEqual({
        userId: "viewer1",
        role: "viewer",
        ownerId: "owner1",
        shareToken: "header-token",
      });
    });
  });
});
