import * as ScheduleStatusRoute from "@/app/api/schedule/status/route";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import * as DayStatus from "@/lib/day-status";
import type { DayStatusType } from "@prisma/client";

jest.mock("@/lib/day-status", () => ({
  getDayStatusesForRange: jest.fn(),
}));

type GetHandler = typeof ScheduleStatusRoute.GET;
type GetRequest = Parameters<GetHandler>[0];

const defaultFrom = "2025-02-01";
const defaultTo = "2025-02-07";

const makeGetRequest = (
  params?: Partial<{ from: string; to: string; tz: string }>,
): GetRequest => {
  const url = new URL("http://localhost/api/schedule/status");
  url.searchParams.set("from", params?.from ?? defaultFrom);
  url.searchParams.set("to", params?.to ?? defaultTo);
  if (params?.tz) {
    url.searchParams.set("tz", params.tz);
  }
  return new Request(url.toString()) as unknown as GetRequest;
};

const mockUser = { id: "u1", email: "user@example.com", name: "User" };

describe("GET /api/schedule/status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no session cookie", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce(null);

    const res = await ScheduleStatusRoute.GET(makeGetRequest());
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Unauthorized" }),
    );
  });

  it("returns 401 when session is invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("invalid");
    jest.mocked(verifySession).mockResolvedValueOnce(null);

    const res = await ScheduleStatusRoute.GET(makeGetRequest());
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid session" }),
    );
  });

  it("returns 400 when from param is missing", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    const req = new Request(
      `http://localhost/api/schedule/status?to=${defaultTo}`,
    ) as unknown as GetRequest;

    const res = await ScheduleStatusRoute.GET(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid input data" }),
    );
  });

  it("returns 400 when to param is missing", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    const req = new Request(
      `http://localhost/api/schedule/status?from=${defaultFrom}`,
    ) as unknown as GetRequest;

    const res = await ScheduleStatusRoute.GET(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid input data" }),
    );
  });

  it("returns 400 when date format is invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    const req = new Request(
      `http://localhost/api/schedule/status?from=2025-2-1&to=${defaultTo}`,
    ) as unknown as GetRequest;

    const res = await ScheduleStatusRoute.GET(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid input data" }),
    );
  });

  it("returns 400 when from date is after to date", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    const res = await ScheduleStatusRoute.GET(
      makeGetRequest({ from: "2025-02-07", to: "2025-02-01" }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({
        error: "From date must be before or equal to to date",
      }),
    );
  });

  it("returns day statuses when request is valid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    const mockStatuses: Record<string, DayStatusType> = {
      "2025-02-01": "ALL_TAKEN",
      "2025-02-02": "PARTIAL",
      "2025-02-03": "SCHEDULED",
    };

    jest
      .mocked(DayStatus.getDayStatusesForRange)
      .mockResolvedValueOnce(mockStatuses);

    const res = await ScheduleStatusRoute.GET(
      makeGetRequest({ tz: "UTC", from: defaultFrom, to: defaultTo }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.statuses).toEqual(mockStatuses);
    expect(DayStatus.getDayStatusesForRange).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(Date),
      expect.any(Date),
      "UTC",
    );
  });

  it("defaults timezone to UTC when not provided", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    jest.mocked(DayStatus.getDayStatusesForRange).mockResolvedValueOnce({});

    const req = new Request(
      `http://localhost/api/schedule/status?from=${defaultFrom}&to=${defaultTo}`,
    ) as unknown as GetRequest;

    await ScheduleStatusRoute.GET(req);

    expect(DayStatus.getDayStatusesForRange).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(Date),
      expect.any(Date),
      "UTC",
    );
  });

  it("returns 500 when getDayStatusesForRange fails", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);
    jest
      .mocked(DayStatus.getDayStatusesForRange)
      .mockRejectedValueOnce(new Error("Database error"));

    const res = await ScheduleStatusRoute.GET(makeGetRequest());
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Internal server error" }),
    );
  });
});
