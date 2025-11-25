import { POST } from "@/app/api/export/pdf/route";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import { renderPdfBuffer, PdfTimeoutError } from "@/lib/pdf/render";
import { prismaMock } from "../../../tests-setup/prisma.mock";

jest.mock("@/lib/pdf/render", () => {
  class MockPdfTimeoutError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = "PdfTimeoutError";
    }
  }
  return {
    __esModule: true,
    PdfTimeoutError: MockPdfTimeoutError,
    renderPdfBuffer: jest.fn(),
  };
});

type PostHandler = typeof POST;
type PostRequest = Parameters<PostHandler>[0];

const mockUser = { id: "user-1", email: "demo@example.com", name: "Demo User" };

const makeRequest = (body: object): PostRequest =>
  new Request("http://localhost/api/export/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as PostRequest;

describe("POST /api/export/pdf", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getSessionUserFromRequest).mockResolvedValue(mockUser);
  });

  it("returns 401 when user is not authenticated", async () => {
    jest.mocked(getSessionUserFromRequest).mockResolvedValueOnce(null);

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Unauthorized" }),
    );
  });

  it("returns 400 for invalid payload", async () => {
    const res = await POST(
      makeRequest({
        from: "2025-01-01",
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid input data" }),
    );
  });

  it("returns 403 when userId does not match", async () => {
    const res = await POST(
      makeRequest({
        userId: "different",
        from: "2025-01-01",
        to: "2025-01-07",
        tz: "UTC",
      }),
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Forbidden" }),
    );
  });

  it("returns 404 when no schedule entries are found", async () => {
    prismaMock.scheduleEntry.count.mockResolvedValueOnce(0);
    prismaMock.scheduleEntry.findMany.mockResolvedValueOnce([]);

    const res = await POST(
      makeRequest({
        userId: mockUser.id,
        from: "2025-01-01",
        to: "2025-01-02",
        tz: "UTC",
      }),
    );

    expect(prismaMock.scheduleEntry.count).toHaveBeenCalled();
    expect(prismaMock.scheduleEntry.findMany).toHaveBeenCalled();
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({
        error: "No schedule entries for selected dates",
      }),
    );
  });

  it("returns PDF buffer when data exists", async () => {
    prismaMock.scheduleEntry.count.mockResolvedValueOnce(1);
    prismaMock.scheduleEntry.findMany.mockResolvedValueOnce([
      {
        id: "entry-1",
        userId: mockUser.id,
        dateTime: new Date("2025-01-01T08:00:00Z"),
        status: "PLANNED",
        scheduleId: "sched-1",
        medicationId: "med-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        medication: {
          id: "med-1",
          name: "Ibuprofen",
          dose: 200,
          form: "tablets",
          deletedAt: null,
        },
        schedule: {
          quantity: 1,
          units: "pill",
          mealTiming: "before",
        },
      },
    ]);
    jest
      .mocked(renderPdfBuffer)
      .mockResolvedValueOnce(Buffer.from("pdf-content"));

    const res = await POST(
      makeRequest({
        userId: mockUser.id,
        from: "2025-01-01",
        to: "2025-01-02",
        tz: "UTC",
      }),
    );

    expect(res.status).toBe(200);
    expect(renderPdfBuffer).toHaveBeenCalledTimes(1);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    const arrayBuffer = await res.arrayBuffer();
    expect(Buffer.from(arrayBuffer).toString()).toBe("pdf-content");
  });

  it("returns 422 when date range is invalid", async () => {
    const res = await POST(
      makeRequest({
        userId: mockUser.id,
        from: "2025-01-05",
        to: "2025-01-02",
        tz: "UTC",
      }),
    );

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid date range" }),
    );
  });

  it("returns 422 when PDF rendering times out", async () => {
    prismaMock.scheduleEntry.count.mockResolvedValueOnce(1);
    prismaMock.scheduleEntry.findMany.mockResolvedValueOnce([
      {
        id: "entry-2",
        userId: mockUser.id,
        dateTime: new Date("2025-01-01T08:00:00Z"),
        status: "PLANNED",
        scheduleId: "sched-1",
        medicationId: "med-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        medication: {
          id: "med-1",
          name: "Ibuprofen",
          dose: 200,
          form: "tablets",
          deletedAt: null,
        },
        schedule: {
          quantity: 1,
          units: "pill",
          mealTiming: "before",
        },
      },
    ]);

    jest
      .mocked(renderPdfBuffer)
      .mockRejectedValueOnce(new PdfTimeoutError("timeout"));

    const res = await POST(
      makeRequest({
        userId: mockUser.id,
        from: "2025-01-01",
        to: "2025-01-02",
        tz: "UTC",
      }),
    );

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "PDF rendering timeout" }),
    );
  });
});
