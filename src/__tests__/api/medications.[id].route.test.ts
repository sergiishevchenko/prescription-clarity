import * as MedicationIdRoute from "@/app/api/medications/[id]/route";
import { prismaMock } from "../../../tests-setup/prisma.mock";
import * as SessionModule from "@/lib/auth/session";

type GetHandler = typeof MedicationIdRoute.GET;
type PatchHandler = typeof MedicationIdRoute.PATCH;
type DeleteHandler = typeof MedicationIdRoute.DELETE;
type GetRequest = Parameters<GetHandler>[0];
type PatchRequest = Parameters<PatchHandler>[0];
type DeleteRequest = Parameters<DeleteHandler>[0];
type Params = { params: Promise<{ id: string }> };

const makeGetReq = (): GetRequest =>
  new Request("http://localhost/api/medications/med1") as unknown as GetRequest;

const makePatchReq = (body: object): PatchRequest =>
  new Request("http://localhost/api/medications/med1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as PatchRequest;

const makeDeleteReq = (): DeleteRequest =>
  new Request("http://localhost/api/medications/med1", {
    method: "DELETE",
  }) as unknown as DeleteRequest;

const mockUser = {
  id: "user123",
  email: "test@example.com",
  name: "Test User",
};

const mockMedication = {
  id: "med1",
  userId: "user123",
  name: "Aspirin",
  dose: "100mg",
  frequency: 24,
  startDate: new Date("2025-01-01"),
  endDate: new Date("2025-12-31"),
  status: "ACTIVE" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const params: Params = { params: Promise.resolve({ id: "med1" }) };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/medications/[id]", () => {
  it("should return 401 if user is not authenticated", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(null);

    const res = await MedicationIdRoute.GET(makeGetReq(), params);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return medication by id", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(mockMedication);

    const res = await MedicationIdRoute.GET(makeGetReq(), params);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.medication.id).toBe("med1");
    expect(data.medication.name).toBe("Aspirin");
    expect(prismaMock.medication.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "med1",
          userId: "user123",
        },
      }),
    );
  });

  it("should return 404 if medication not found", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(null);

    const res = await MedicationIdRoute.GET(makeGetReq(), params);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Medication not found");
  });

  it("should return 404 if medication belongs to different user", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(null);

    const res = await MedicationIdRoute.GET(makeGetReq(), params);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Medication not found");
  });

  it("should return 500 on database error", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementationOnce(() => {});

    const res = await MedicationIdRoute.GET(makeGetReq(), params);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe("PATCH /api/medications/[id]", () => {
  it("should return 401 if user is not authenticated", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(null);

    const res = await MedicationIdRoute.PATCH(
      makePatchReq({ name: "New Name" }),
      params,
    );
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 404 if medication not found", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(null);

    const res = await MedicationIdRoute.PATCH(
      makePatchReq({ name: "New Name" }),
      params,
    );
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Medication not found");
  });

  it("should update medication successfully", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(mockMedication);

    const updatedMedication = { ...mockMedication, name: "Updated Aspirin" };
    prismaMock.medication.update.mockResolvedValueOnce(updatedMedication);

    const res = await MedicationIdRoute.PATCH(
      makePatchReq({ name: "Updated Aspirin" }),
      params,
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.medication.name).toBe("Updated Aspirin");
    expect(prismaMock.medication.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "med1" },
        data: expect.objectContaining({
          name: "Updated Aspirin",
        }),
      }),
    );
  });

  it("should update multiple fields", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(mockMedication);

    const updatedMedication = {
      ...mockMedication,
      name: "New Name",
      dose: "200mg",
      frequency: 12,
    };
    prismaMock.medication.update.mockResolvedValueOnce(updatedMedication);

    const res = await MedicationIdRoute.PATCH(
      makePatchReq({
        name: "New Name",
        dose: "200mg",
        frequency: 12,
      }),
      params,
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.medication.name).toBe("New Name");
    expect(data.medication.dose).toBe("200mg");
    expect(data.medication.frequency).toBe(12);
  });

  it("should return 400 if end date is before start date", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(mockMedication);

    const res = await MedicationIdRoute.PATCH(
      makePatchReq({
        startDate: "2025-12-31T00:00:00Z",
        endDate: "2025-01-01T00:00:00Z",
      }),
      params,
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("End date must be after start date");
  });

  it("should return 400 when only startDate pushes past endDate", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(mockMedication);

    const res = await MedicationIdRoute.PATCH(
      makePatchReq({
        startDate: "2026-01-01T00:00:00Z",
      }),
      params,
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("End date must be after start date");
  });

  it("should return 400 when only endDate precedes startDate", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(mockMedication);

    const res = await MedicationIdRoute.PATCH(
      makePatchReq({
        endDate: "2024-01-01T00:00:00Z",
      }),
      params,
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("End date must be after start date");
  });

  it("should return 400 on invalid input data", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(mockMedication);

    const res = await MedicationIdRoute.PATCH(
      makePatchReq({
        frequency: -5,
      }),
      params,
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid input data");
  });

  it("should return 500 on database error", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(mockMedication);
    prismaMock.medication.update.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementationOnce(() => {});

    const res = await MedicationIdRoute.PATCH(
      makePatchReq({ name: "New Name" }),
      params,
    );
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe("DELETE /api/medications/[id]", () => {
  it("should return 401 if user is not authenticated", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(null);

    const res = await MedicationIdRoute.DELETE(makeDeleteReq(), params);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 404 if medication not found", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(null);

    const res = await MedicationIdRoute.DELETE(makeDeleteReq(), params);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Medication not found");
  });

  it("should soft delete medication successfully", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(mockMedication);
    prismaMock.medication.update.mockResolvedValueOnce({
      ...mockMedication,
      status: "DELETED",
    });

    const res = await MedicationIdRoute.DELETE(makeDeleteReq(), params);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe("Medication deleted successfully");
    expect(prismaMock.medication.update).toHaveBeenCalledWith({
      where: { id: "med1" },
      data: { status: "DELETED" },
    });
  });

  it("should return 500 on database error", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(mockMedication);
    prismaMock.medication.update.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementationOnce(() => {});

    const res = await MedicationIdRoute.DELETE(makeDeleteReq(), params);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
