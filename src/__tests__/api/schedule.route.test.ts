import * as ScheduleRoute from "@/app/api/schedule/route";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { prismaMock } from "../../../tests-setup/prisma.mock";

type GetHandler = typeof ScheduleRoute.GET;
type GetRequest = Parameters<GetHandler>[0];

const defaultFrom = "2025-02-01T00:00:00.000Z";
const defaultTo = "2025-02-02T00:00:00.000Z";

const makeGetRequest = (
  params?: Partial<{ from: string; to: string; tz: string }>,
): GetRequest => {
  const url = new URL("http://localhost/api/schedule");
  url.searchParams.set("from", params?.from ?? defaultFrom);
  url.searchParams.set("to", params?.to ?? defaultTo);
  if (params?.tz) {
    url.searchParams.set("tz", params.tz);
  }
  return new Request(url.toString()) as unknown as GetRequest;
};

const mockUser = { id: "u1", email: "user@example.com", name: "User" };

describe("GET /api/schedule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no session cookie", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce(null);

    const res = await ScheduleRoute.GET(makeGetRequest());
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Unauthorized" }),
    );
  });

  it("returns 401 when session is invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("invalid");
    jest.mocked(verifySession).mockResolvedValueOnce(null);

    const res = await ScheduleRoute.GET(makeGetRequest());
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid session" }),
    );
  });

  it("returns 400 when query params are invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    const req = new Request(
      `http://localhost/api/schedule?to=${defaultTo}`,
    ) as unknown as GetRequest;

    const res = await ScheduleRoute.GET(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid input data" }),
    );
    expect(prismaMock.scheduleEntry.findMany).not.toHaveBeenCalled();
  });

  it("returns schedule items when request is valid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    const scheduleEntries = [
      {
        id: "se1",
        medicationId: "med1",
        userId: mockUser.id,
        dateTime: new Date("2025-02-01T03:00:00.000Z"),
        status: "PLANNED",
        medication: { id: "med1", name: "Ibuprofen", dose: "200 mg" },
      },
    ];

    prismaMock.scheduleEntry.findMany.mockResolvedValueOnce(scheduleEntries);

    const res = await ScheduleRoute.GET(
      makeGetRequest({ tz: "UTC", from: defaultFrom, to: defaultTo }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toHaveLength(1);
    expect(json.items[0]).toEqual(
      expect.objectContaining({
        id: "se1",
        medicationId: "med1",
        userId: mockUser.id,
        utcDateTime: "2025-02-01T03:00:00.000Z",
        localDateTime: expect.stringContaining("2025-02-01T03:00:00"),
        medication: scheduleEntries[0].medication,
      }),
    );
    expect(prismaMock.scheduleEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockUser.id,
          dateTime: {
            gte: new Date(defaultFrom),
            lte: new Date(defaultTo),
          },
        }),
      }),
    );
  });

  it("returns 500 when database query fails", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);
    prismaMock.scheduleEntry.findMany.mockRejectedValueOnce(
      new Error("fail"),
    );

    const res = await ScheduleRoute.GET(makeGetRequest());
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Internal server error" }),
    );
  });
});
