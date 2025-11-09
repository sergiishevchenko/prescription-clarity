import * as ScheduleIdRoute from "@/app/api/schedule/[id]/route";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { prismaMock } from "../../../tests-setup/prisma.mock";

type PatchHandler = typeof ScheduleIdRoute.PATCH;
type PatchRequest = Parameters<PatchHandler>[0];
type ParamsArg = Parameters<PatchHandler>[1];

const params: ParamsArg = { params: Promise.resolve({ id: "se1" }) };

const makePatchRequest = (body: object): PatchRequest =>
  new Request("http://localhost/api/schedule/se1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as PatchRequest;

describe("PATCH /api/schedule/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no session cookie", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce(null);

    const res = await ScheduleIdRoute.PATCH(makePatchRequest({ status: "DONE" }), params);
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Unauthorized" }),
    );
  });

  it("returns 401 when session is invalid", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("invalid");
    jest.mocked(verifySession).mockResolvedValueOnce(null);

    const res = await ScheduleIdRoute.PATCH(makePatchRequest({ status: "DONE" }), params);
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid session" }),
    );
  });

  it("returns 400 on invalid payload", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");

    const res = await ScheduleIdRoute.PATCH(makePatchRequest({ status: "SKIPPED" }), params);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid input data" }),
    );
    expect(prismaMock.scheduleEntry.findFirst).not.toHaveBeenCalled();
  });

  it("returns 404 when schedule entry missing", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");

    prismaMock.scheduleEntry.findFirst.mockResolvedValueOnce(null);

    const res = await ScheduleIdRoute.PATCH(makePatchRequest({ status: "DONE" }), params);
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Not found" }),
    );
  });

  it("updates status when entry exists", async () => {
    jest.mocked(getSessionCookie).mockResolvedValueOnce("token");

    prismaMock.scheduleEntry.findFirst.mockResolvedValueOnce({ id: "se1", userId: "u1" });
    prismaMock.scheduleEntry.update.mockResolvedValueOnce({
      id: "se1",
      status: "DONE",
    });

    const res = await ScheduleIdRoute.PATCH(makePatchRequest({ status: "DONE" }), params);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ id: "se1", status: "DONE" }),
    );
    expect(prismaMock.scheduleEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "se1" },
        data: { status: "DONE" },
      }),
    );
  });
});
