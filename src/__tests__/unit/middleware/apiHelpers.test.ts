import { NextRequest } from "next/server";
import {
  checkApiAccess,
  extractTargetUserId,
  checkApiAccessAuto,
} from "@/lib/middleware/apiHelpers";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import { getShareAccessContext } from "@/lib/middleware/shareAccess";

jest.mock("@/lib/auth/session");

// Mock only getShareAccessContext, keep hasResourceAccess real
jest.mock("@/lib/middleware/shareAccess", () => {
  const actual = jest.requireActual("@/lib/middleware/shareAccess");
  return {
    ...actual,
    getShareAccessContext: jest.fn(),
  };
});

const mockGetSessionUserFromRequest =
  getSessionUserFromRequest as jest.MockedFunction<
    typeof getSessionUserFromRequest
  >;
const mockGetShareAccessContext = getShareAccessContext as jest.MockedFunction<
  typeof getShareAccessContext
>;

describe("API Helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkApiAccess", () => {
    it("should return 401 when user not authenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/schedule");

      mockGetSessionUserFromRequest.mockResolvedValueOnce(null);

      const result = await checkApiAccess(req, "owner1", "viewer");

      expect(result.authorized).toBe(false);
      expect(result.response).toBeDefined();

      const json = await result.response!.json();
      expect(json).toEqual({ error: "Unauthorized" });
      expect(result.response!.status).toBe(401);
    });

    it("should return 403 when user lacks required role", async () => {
      const req = new NextRequest("http://localhost:3000/api/schedule");

      mockGetSessionUserFromRequest.mockResolvedValueOnce({
        id: "viewer1",
        email: "viewer@example.com",
        name: "Viewer User",
      });

      mockGetShareAccessContext.mockResolvedValueOnce({
        userId: "viewer1",
        role: "anonymous",
        ownerId: "owner1",
      });

      const result = await checkApiAccess(req, "owner1", "viewer");

      expect(result.authorized).toBe(false);
      expect(result.response).toBeDefined();

      const json = await result.response!.json();
      expect(json).toEqual({
        error: "Forbidden: You do not have access to this resource",
        required: "viewer",
        actual: "anonymous",
      });
      expect(result.response!.status).toBe(403);
    });

    it("should return authorized when user is owner", async () => {
      const req = new NextRequest("http://localhost:3000/api/schedule");

      mockGetSessionUserFromRequest.mockResolvedValueOnce({
        id: "owner1",
        email: "owner@example.com",
        name: "Owner User",
      });

      mockGetShareAccessContext.mockResolvedValueOnce({
        userId: "owner1",
        role: "owner",
        ownerId: "owner1",
      });

      const result = await checkApiAccess(req, "owner1", "viewer");

      expect(result.authorized).toBe(true);
      expect(result.context).toEqual({
        userId: "owner1",
        role: "owner",
        ownerId: "owner1",
      });
      expect(result.response).toBeUndefined();
    });

    it("should return authorized when user has viewer role and viewer required", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/schedule?token=valid-token",
      );

      mockGetSessionUserFromRequest.mockResolvedValueOnce({
        id: "viewer1",
        email: "viewer@example.com",
        name: "Viewer User",
      });

      mockGetShareAccessContext.mockResolvedValueOnce({
        userId: "viewer1",
        role: "viewer",
        ownerId: "owner1",
        shareToken: "valid-token",
      });

      const result = await checkApiAccess(req, "owner1", "viewer");

      expect(result.authorized).toBe(true);
      expect(result.context).toEqual({
        userId: "viewer1",
        role: "viewer",
        ownerId: "owner1",
        shareToken: "valid-token",
      });
    });

    it("should return 403 when viewer tries to access owner-only resource", async () => {
      const req = new NextRequest("http://localhost:3000/api/settings");

      mockGetSessionUserFromRequest.mockResolvedValueOnce({
        id: "viewer1",
        email: "viewer@example.com",
        name: "Viewer User",
      });

      mockGetShareAccessContext.mockResolvedValueOnce({
        userId: "viewer1",
        role: "viewer",
        ownerId: "owner1",
        shareToken: "valid-token",
      });

      const result = await checkApiAccess(req, "owner1", "owner");

      expect(result.authorized).toBe(false);
      expect(result.response).toBeDefined();

      const json = await result.response!.json();
      expect(json).toEqual({
        error: "Forbidden: You do not have access to this resource",
        required: "owner",
        actual: "viewer",
      });
    });

    it("should default to viewer requirement when not specified", async () => {
      const req = new NextRequest("http://localhost:3000/api/schedule");

      mockGetSessionUserFromRequest.mockResolvedValueOnce({
        id: "viewer1",
        email: "viewer@example.com",
        name: "Viewer User",
      });

      mockGetShareAccessContext.mockResolvedValueOnce({
        userId: "viewer1",
        role: "viewer",
        ownerId: "owner1",
      });

      const result = await checkApiAccess(req, "owner1");

      expect(result.authorized).toBe(true);
    });
  });

  describe("extractTargetUserId", () => {
    it("should extract userId from query parameter", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/schedule?userId=user123",
      );

      const userId = await extractTargetUserId(req);

      expect(userId).toBe("user123");
    });

    it("should extract ownerId from query parameter", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/schedule?ownerId=owner123",
      );

      const userId = await extractTargetUserId(req);

      expect(userId).toBe("owner123");
    });

    it("should prioritize userId over ownerId in query", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/schedule?userId=user123&ownerId=owner456",
      );

      const userId = await extractTargetUserId(req);

      expect(userId).toBe("user123");
    });

    it("should extract userId from POST body", async () => {
      const req = new NextRequest("http://localhost:3000/api/schedule", {
        method: "POST",
        body: JSON.stringify({ userId: "user123" }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const userId = await extractTargetUserId(req);

      expect(userId).toBe("user123");
    });

    it("should extract ownerId from POST body", async () => {
      const req = new NextRequest("http://localhost:3000/api/schedule", {
        method: "POST",
        body: JSON.stringify({ ownerId: "owner123" }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const userId = await extractTargetUserId(req);

      expect(userId).toBe("owner123");
    });

    it("should extract userId from PATCH body", async () => {
      const req = new NextRequest("http://localhost:3000/api/schedule", {
        method: "PATCH",
        body: JSON.stringify({ userId: "user123" }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const userId = await extractTargetUserId(req);

      expect(userId).toBe("user123");
    });

    it("should return null for GET without query params", async () => {
      const req = new NextRequest("http://localhost:3000/api/schedule");

      const userId = await extractTargetUserId(req);

      expect(userId).toBeNull();
    });

    it("should return null for POST with invalid JSON", async () => {
      const req = new NextRequest("http://localhost:3000/api/schedule", {
        method: "POST",
        body: "invalid json",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const userId = await extractTargetUserId(req);

      expect(userId).toBeNull();
    });

    it("should return null for POST without userId/ownerId", async () => {
      const req = new NextRequest("http://localhost:3000/api/schedule", {
        method: "POST",
        body: JSON.stringify({ otherField: "value" }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const userId = await extractTargetUserId(req);

      expect(userId).toBeNull();
    });
  });

  describe("checkApiAccessAuto", () => {
    it("should return 400 when userId/ownerId not found", async () => {
      const req = new NextRequest("http://localhost:3000/api/schedule");

      const result = await checkApiAccessAuto(req, "viewer");

      expect(result.authorized).toBe(false);
      expect(result.response).toBeDefined();

      const json = await result.response!.json();
      expect(json).toEqual({ error: "Missing userId or ownerId parameter" });
      expect(result.response!.status).toBe(400);
    });

    it("should call checkApiAccess with extracted userId from query", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/schedule?userId=owner1",
      );

      mockGetSessionUserFromRequest.mockResolvedValueOnce({
        id: "owner1",
        email: "owner@example.com",
        name: "Owner User",
      });

      mockGetShareAccessContext.mockResolvedValueOnce({
        userId: "owner1",
        role: "owner",
        ownerId: "owner1",
      });

      const result = await checkApiAccessAuto(req, "viewer");

      expect(result.authorized).toBe(true);
      expect(mockGetSessionUserFromRequest).toHaveBeenCalledWith(req);
      expect(mockGetShareAccessContext).toHaveBeenCalledWith(
        req,
        "owner1",
        "owner1",
      );
    });

    it("should call checkApiAccess with extracted userId from POST body", async () => {
      const req = new NextRequest("http://localhost:3000/api/schedule", {
        method: "POST",
        body: JSON.stringify({ userId: "owner1" }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      mockGetSessionUserFromRequest.mockResolvedValueOnce({
        id: "owner1",
        email: "owner@example.com",
        name: "Owner User",
      });

      mockGetShareAccessContext.mockResolvedValueOnce({
        userId: "owner1",
        role: "owner",
        ownerId: "owner1",
      });

      const result = await checkApiAccessAuto(req, "viewer");

      expect(result.authorized).toBe(true);
    });

    it("should use default viewer requirement when not specified", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/schedule?userId=owner1",
      );

      mockGetSessionUserFromRequest.mockResolvedValueOnce({
        id: "viewer1",
        email: "viewer@example.com",
        name: "Viewer User",
      });

      mockGetShareAccessContext.mockResolvedValueOnce({
        userId: "viewer1",
        role: "viewer",
        ownerId: "owner1",
      });

      const result = await checkApiAccessAuto(req);

      expect(result.authorized).toBe(true);
    });
  });
});
