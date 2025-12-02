import * as ShareRoute from "@/app/api/share/route";
import * as ShareValidateRoute from "@/app/api/share/validate/route";
import * as ShareAcceptRoute from "@/app/api/share/accept/route";
import * as ShareStatusRoute from "@/app/api/share/status/route";
import * as ShareRevokeRoute from "@/app/api/share/revoke/route";
import * as ExportPdfRoute from "@/app/api/export/pdf/route";
import * as MedicationIdRoute from "@/app/api/medications/[id]/route";
import { prismaMock } from "../../../../tests-setup/prisma.mock";
import * as SessionModule from "@/lib/auth/session";
import { renderPdfBuffer } from "@/lib/pdf/render";
import { NextRequest } from "next/server";

jest.mock("@/lib/pdf/render", () => ({
  __esModule: true,
  renderPdfBuffer: jest.fn(),
  PdfTimeoutError: class MockPdfTimeoutError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = "PdfTimeoutError";
    }
  },
}));

type ShareValidateRequest = Parameters<typeof ShareValidateRoute.GET>[0];
type ShareStatusRequest = Parameters<typeof ShareStatusRoute.GET>[0];
type ExportPdfRequest = Parameters<typeof ExportPdfRoute.POST>[0];
type DeleteRequest = Parameters<typeof MedicationIdRoute.DELETE>[0];
type DeleteParams = Parameters<typeof MedicationIdRoute.DELETE>[1];

const makeNextJsonRequest = (url: string, method: string, body: object) =>
  new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const makeNextGetRequest = (url: string) => new NextRequest(url);

const makeNextRequest = (url: string, method: string) =>
  new NextRequest(url, { method });

const makeDeleteParams = (id: string): DeleteParams => ({
  params: Promise.resolve({ id }),
});

const owner = { id: "owner-1", email: "owner@example.com", name: "Owner" };
const viewer = { id: "viewer-1", email: "viewer@example.com", name: "Viewer" };

describe("Integration flow: share → caregiver view → PDF → revoke", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-05T10:00:00Z"));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("runs end-to-end share lifecycle and read-only/export/revoke expectations", async () => {
    const token = "share-token-123";
    const sessionSpy = jest.spyOn(SessionModule, "getSessionUserFromRequest");

    // 1) Owner creates share link
    sessionSpy.mockResolvedValueOnce(owner);
    prismaMock.shareLink.create.mockResolvedValueOnce({
      id: "share-1",
      token,
      ownerId: owner.id,
      viewerId: null,
      expiresAt: new Date("2025-01-07T10:00:00Z"),
      status: "active" as const,
      createdAt: new Date("2025-01-05T10:00:00Z"),
      updatedAt: new Date("2025-01-05T10:00:00Z"),
    });

    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

    const createRes = await ShareRoute.POST(
      makeNextJsonRequest("http://localhost/api/share", "POST", {}),
    );
    expect(createRes.status).toBe(201);

    // 2) Viewer checks link validity
    prismaMock.shareLink.findUnique.mockResolvedValueOnce({
      id: "share-1",
      ownerId: owner.id,
      viewerId: null,
      expiresAt: new Date("2025-01-07T10:00:00Z"),
      status: "active" as const,
      owner,
    });
    const validateRes = await ShareValidateRoute.GET(
      makeNextGetRequest(
        `http://localhost/api/share/validate?token=${token}`,
      ) as ShareValidateRequest,
    );
    const validateBody = await validateRes.json();
    expect(validateRes.status).toBe(200);
    expect(validateBody.valid).toBe(true);

    // 3) Viewer accepts share link (creates CareAccess)
    sessionSpy.mockResolvedValueOnce(viewer);
    prismaMock.shareLink.findUnique.mockResolvedValueOnce({
      id: "share-1",
      ownerId: owner.id,
      viewerId: null,
      expiresAt: new Date("2025-01-07T10:00:00Z"),
      status: "active" as const,
    });
    prismaMock.careAccess.findUnique.mockResolvedValueOnce(null);
    prismaMock.$transaction.mockResolvedValueOnce({
      updatedShareLink: {
        id: "share-1",
        token,
        ownerId: owner.id,
        viewerId: viewer.id,
      },
      careAccess: {
        id: "care-1",
        ownerId: owner.id,
        viewerId: viewer.id,
        createdAt: new Date("2025-01-05T10:05:00Z"),
        owner,
      },
    });

    const acceptRes = await ShareAcceptRoute.POST(
      makeNextJsonRequest("http://localhost/api/share/accept", "POST", {
        token,
      }),
    );
    const acceptBody = await acceptRes.json();
    expect(acceptRes.status).toBe(201);
    expect(acceptBody.careAccess.viewerId).toBe(viewer.id);

    // 4) Owner checks status list; viewer appears on link
    sessionSpy.mockResolvedValueOnce(owner);
    prismaMock.shareLink.findMany.mockResolvedValueOnce([
      {
        id: "share-1",
        token,
        ownerId: owner.id,
        viewerId: viewer.id,
        expiresAt: new Date("2025-01-07T10:00:00Z"),
        status: "active" as const,
        createdAt: new Date("2025-01-05T10:00:00Z"),
        updatedAt: new Date("2025-01-05T10:00:00Z"),
        viewer,
      },
    ]);
    const statusRes = await ShareStatusRoute.GET(
      makeNextGetRequest(
        "http://localhost/api/share/status",
      ) as ShareStatusRequest,
    );
    const statusBody = await statusRes.json();
    expect(statusRes.status).toBe(200);
    expect(statusBody.shareLinks[0].viewerId).toBe(viewer.id);

    // 5) Viewer opens read-only calendar and exports PDF
    sessionSpy.mockResolvedValueOnce(owner);
    prismaMock.user.findUnique.mockResolvedValueOnce(owner);
    prismaMock.scheduleEntry.count.mockResolvedValueOnce(1);
    prismaMock.scheduleEntry.findMany.mockResolvedValueOnce([
      {
        id: "entry-1",
        userId: owner.id,
        dateTime: new Date("2025-01-06T08:00:00Z"),
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
      .mockResolvedValueOnce(Buffer.from("pdf-binary-content"));

    const pdfRes = await ExportPdfRoute.POST(
      makeNextJsonRequest("http://localhost/api/export/pdf", "POST", {
        userId: owner.id,
        from: "2025-01-06",
        to: "2025-01-07",
        tz: "UTC",
      }) as ExportPdfRequest,
    );
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers.get("Content-Type")).toBe("application/pdf");
    const pdfArrayBuffer = await pdfRes.arrayBuffer();
    expect(Buffer.from(pdfArrayBuffer).length).toBeGreaterThan(0);

    // 6) Owner revokes; viewer sees invalid
    sessionSpy.mockResolvedValueOnce(owner);
    prismaMock.shareLink.findFirst.mockResolvedValueOnce({
      id: "share-1",
      ownerId: owner.id,
      status: "active" as const,
    });
    prismaMock.shareLink.update.mockResolvedValueOnce({
      id: "share-1",
      token,
      status: "revoked" as const,
      updatedAt: new Date("2025-01-05T11:00:00Z"),
    });
    const revokeRes = await ShareRevokeRoute.POST(
      makeNextJsonRequest("http://localhost/api/share/revoke", "POST", {
        token,
      }),
    );
    expect(revokeRes.status).toBe(200);

    // Validate again -> invalid
    prismaMock.shareLink.findUnique.mockResolvedValueOnce({
      id: "share-1",
      ownerId: owner.id,
      viewerId: viewer.id,
      expiresAt: new Date("2025-01-07T10:00:00Z"),
      status: "revoked" as const,
      owner,
    });
    const validateAfterRevoke = await ShareValidateRoute.GET(
      makeNextGetRequest(
        `http://localhost/api/share/validate?token=${token}`,
      ) as ShareValidateRequest,
    );
    const validateAfterBody = await validateAfterRevoke.json();
    expect(validateAfterRevoke.status).toBe(200);
    expect(validateAfterBody.valid).toBe(false);
    expect(validateAfterBody.status).toBe("revoked");
  });

  it("blocks viewer mutations and keeps past entries after delete", async () => {
    const sessionSpy = jest.spyOn(SessionModule, "getSessionUserFromRequest");
    // Viewer attempts to delete someone else's medication -> 404/Unauthorized path
    sessionSpy.mockResolvedValueOnce(viewer);
    prismaMock.medication.findFirst.mockResolvedValueOnce(null);

    const deleteReq = makeNextRequest(
      "http://localhost/api/medications/med-1",
      "DELETE",
    );
    const deleteRes = await MedicationIdRoute.DELETE(
      deleteReq as DeleteRequest,
      makeDeleteParams("med-1"),
    );
    expect(deleteRes.status).toBe(404); // viewer sees no access to owner's medication

    // Owner deletes medication; only future PLANNED entries are removed
    sessionSpy.mockResolvedValueOnce(owner);
    prismaMock.medication.findFirst.mockResolvedValueOnce({
      id: "med-1",
      userId: owner.id,
      deletedAt: null,
    });
    prismaMock.scheduleEntry.findMany.mockResolvedValueOnce([
      { dateTime: new Date("2025-01-04T08:00:00Z") }, // past
      { dateTime: new Date("2025-01-08T08:00:00Z") }, // future
    ]);
    prismaMock.scheduleEntry.deleteMany.mockResolvedValueOnce({ count: 1 });
    prismaMock.schedule.updateMany.mockResolvedValueOnce({ count: 1 });
    prismaMock.medication.update.mockResolvedValueOnce({
      id: "med-1",
      deletedAt: new Date(),
    });
    prismaMock.$transaction.mockImplementationOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (cb: any) =>
        cb({
          medication: prismaMock.medication,
          schedule: prismaMock.schedule,
          scheduleEntry: prismaMock.scheduleEntry,
        }),
    );

    const ownerDeleteRes = await MedicationIdRoute.DELETE(
      deleteReq as DeleteRequest,
      makeDeleteParams("med-1"),
    );
    expect(ownerDeleteRes.status).toBe(200);
    expect(prismaMock.scheduleEntry.deleteMany).toHaveBeenCalledWith({
      where: {
        medicationId: "med-1",
        userId: owner.id,
        dateTime: { gte: new Date() },
        status: "PLANNED",
      },
    });
  });
});
