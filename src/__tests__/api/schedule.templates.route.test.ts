import * as TemplatesRoute from "@/app/api/schedule/templates/route";
import * as TemplateDetailRoute from "@/app/api/schedule/templates/[id]/route";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { prismaMock } from "../../../tests-setup/prisma.mock";
import { generateScheduleEntries } from "@/app/api/schedule/generate/route";

jest.mock("@/app/api/schedule/generate/route", () => ({
  generateScheduleEntries: jest.fn().mockResolvedValue(5),
}));

const mockUser = { id: "user1", email: "test@example.com", name: "Test" };

const makeGetRequest = () =>
  new Request(
    "http://localhost/api/schedule/templates",
  ) as unknown as Parameters<typeof TemplatesRoute.GET>[0];

const makePatchRequest = (body: object) =>
  new Request("http://localhost/api/schedule/templates/s1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof TemplateDetailRoute.PATCH>[0];

type PatchParams = Parameters<typeof TemplateDetailRoute.PATCH>[1];
const makePatchParams = (): PatchParams => ({
  params: Promise.resolve({ id: "s1" }),
});

describe("GET /api/schedule/templates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no session cookie", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce(null);

    const res = await TemplatesRoute.GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it("returns 401 when session invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(null);

    const res = await TemplatesRoute.GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it("returns schedule templates when authenticated", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);

    prismaMock.schedule.findMany.mockResolvedValueOnce([
      {
        id: "s1",
        medicationId: "m1",
        userId: mockUser.id,
        quantity: 1,
        units: "pill",
        frequencyDays: [1, 2],
        durationDays: 14,
        dateStart: new Date("2025-02-01T00:00:00.000Z"),
        dateEnd: new Date("2025-02-15T00:00:00.000Z"),
        timeOfDay: ["08:00"],
        mealTiming: "before",
        createdAt: new Date(),
        updatedAt: new Date(),
        medication: { id: "m1", name: "Aspirin", dose: 100 },
      },
    ]);

    const res = await TemplatesRoute.GET(makeGetRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toHaveLength(1);
    expect(json.items[0]).toEqual(
      expect.objectContaining({
        id: "s1",
        medicationId: "m1",
        frequencyDays: [1, 2],
        timeOfDay: ["08:00"],
      }),
    );
  });

  it("returns 500 when database query fails", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);
    prismaMock.schedule.findMany.mockRejectedValueOnce(new Error("boom"));

    const res = await TemplatesRoute.GET(makeGetRequest());
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/schedule/templates/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no session cookie", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce(null);

    const res = await TemplateDetailRoute.PATCH(
      makePatchRequest({ quantity: 2 }),
      makePatchParams(),
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 when session invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(null);

    const res = await TemplateDetailRoute.PATCH(
      makePatchRequest({ quantity: 2 }),
      makePatchParams(),
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when schedule missing", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);
    prismaMock.schedule.findFirst.mockResolvedValueOnce(null);

    const res = await TemplateDetailRoute.PATCH(
      makePatchRequest({ quantity: 2 }),
      makePatchParams(),
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 when payload invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);
    prismaMock.schedule.findFirst.mockResolvedValueOnce({
      id: "s1",
      medicationId: "m1",
      userId: mockUser.id,
      quantity: 1,
      units: "pill",
      frequencyDays: [1],
      durationDays: 7,
      dateStart: new Date("2025-02-01T00:00:00.000Z"),
      dateEnd: new Date("2025-02-08T00:00:00.000Z"),
      timeOfDay: ["08:00"],
      mealTiming: "before",
      createdAt: new Date(),
      updatedAt: new Date(),
      medication: { id: "m1", name: "Aspirin", dose: 100 },
    });

    const res = await TemplateDetailRoute.PATCH(
      makePatchRequest({}),
      makePatchParams(),
    );
    expect(res.status).toBe(400);
  });

  it("updates schedule and regenerates entries", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");
    jest.mocked(verifySession).mockResolvedValueOnce(mockUser);
    const existingSchedule = {
      id: "s1",
      medicationId: "m1",
      userId: mockUser.id,
      quantity: 1,
      units: "pill",
      frequencyDays: [1],
      durationDays: 7,
      dateStart: new Date("2025-02-01T00:00:00.000Z"),
      dateEnd: new Date("2025-02-08T00:00:00.000Z"),
      timeOfDay: ["08:00"],
      mealTiming: "before",
      createdAt: new Date(),
      updatedAt: new Date(),
      medication: { id: "m1", name: "Aspirin", dose: 100 },
    };
    prismaMock.schedule.findFirst.mockResolvedValueOnce(existingSchedule);
    prismaMock.schedule.update.mockResolvedValueOnce({
      ...existingSchedule,
      quantity: 2,
      frequencyDays: [1, 3, 5],
      timeOfDay: ["08:00", "20:00"],
      updatedAt: new Date(),
    });
    prismaMock.scheduleEntry.deleteMany.mockResolvedValueOnce({ count: 3 });

    const res = await TemplateDetailRoute.PATCH(
      makePatchRequest({
        quantity: 2,
        frequencyDays: [1, 3, 5],
        timeOfDay: ["08:00", "20:00"],
      }),
      makePatchParams(),
    );

    expect(res.status).toBe(200);
    expect(prismaMock.schedule.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "s1" },
        data: expect.objectContaining({
          quantity: 2,
          frequencyDays: [1, 3, 5],
          timeOfDay: ["08:00", "20:00"],
        }),
      }),
    );
    expect(prismaMock.scheduleEntry.deleteMany).toHaveBeenCalled();
    expect(generateScheduleEntries).toHaveBeenCalledWith("s1", mockUser.id);
  });
});
