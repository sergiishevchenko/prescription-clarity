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
  dose: 100,
  form: "tablets",
  deletedAt: null,
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
          deletedAt: null,
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

  it("should update medication successfully (no active schedule)", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(mockMedication);
    // No active schedule - use simple update path
    prismaMock.schedule.findFirst.mockResolvedValueOnce(null);

    const updatedMedication = { ...mockMedication, name: "Updated Aspirin" };
    prismaMock.medication.update.mockResolvedValueOnce(updatedMedication);

    const res = await MedicationIdRoute.PATCH(
      makePatchReq({ name: "Updated Aspirin" }),
      params,
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.medication.name).toBe("Updated Aspirin");
    expect(data.isNewVersion).toBe(false);
    expect(prismaMock.medication.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "med1" },
        data: expect.objectContaining({
          name: "Updated Aspirin",
        }),
      }),
    );
  });

  it("should update multiple fields (no active schedule)", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(mockMedication);
    // No active schedule - use simple update path
    prismaMock.schedule.findFirst.mockResolvedValueOnce(null);

    const updatedMedication = {
      ...mockMedication,
      name: "New Name",
      dose: 200,
      form: "capsules",
    };
    prismaMock.medication.update.mockResolvedValueOnce(updatedMedication);

    const res = await MedicationIdRoute.PATCH(
      makePatchReq({
        name: "New Name",
        dose: 200,
        form: "capsules",
      }),
      params,
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.medication.name).toBe("New Name");
    expect(data.medication.dose).toBe(200);
    expect(data.medication.form).toBe("capsules");
  });

  it("should return 400 on invalid input data", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(mockMedication);

    const res = await MedicationIdRoute.PATCH(
      makePatchReq({
        dose: -5,
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
    // No active schedule - use simple update path
    prismaMock.schedule.findFirst.mockResolvedValueOnce(null);
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

  it("should use versioning flow when medication has active schedule", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const medicationWithSchedules = {
      ...mockMedication,
      schedules: [
        {
          id: "sched1",
          medicationId: "med1",
          userId: "user123",
          quantity: 1,
          units: "pill",
          frequencyDays: [1, 2, 3, 4, 5],
          durationDays: 30,
          dateStart: new Date(),
          dateEnd: null,
          timeOfDay: ["08:00", "20:00"],
          mealTiming: "anytime",
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    // First findFirst for checking medication exists
    prismaMock.medication.findFirst
      .mockResolvedValueOnce(mockMedication)
      // Second findFirst includes schedules (in createMedicationVersion)
      .mockResolvedValueOnce(medicationWithSchedules);

    // Has active schedule - triggers versioning
    prismaMock.schedule.findFirst.mockResolvedValueOnce({
      id: "sched1",
      deletedAt: null,
    });

    // Mock $transaction operations
    prismaMock.scheduleEntry.findMany.mockResolvedValue([]);
    prismaMock.scheduleEntry.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.scheduleEntry.createMany.mockResolvedValue({ count: 5 });
    prismaMock.schedule.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.medication.update.mockResolvedValue({
      ...mockMedication,
      deletedAt: new Date(),
    });

    const newMedication = {
      id: "med2",
      userId: "user123",
      name: "Updated Aspirin",
      dose: 100,
      form: "tablets",
      previousMedicationId: "med1",
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.medication.create.mockResolvedValue(newMedication);

    const newSchedule = {
      id: "sched2",
      medicationId: "med2",
      userId: "user123",
      quantity: 1,
      units: "pill",
      frequencyDays: [1, 2, 3, 4, 5],
      durationDays: 30,
      dateStart: new Date(),
      dateEnd: null,
      timeOfDay: ["08:00", "20:00"],
      mealTiming: "anytime",
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.schedule.create.mockResolvedValue(newSchedule);

    const res = await MedicationIdRoute.PATCH(
      makePatchReq({ name: "Updated Aspirin" }),
      params,
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.isNewVersion).toBe(true);
    expect(data.medication.name).toBe("Updated Aspirin");
    expect(data.previousMedicationId).toBe("med1");
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

    // Mock for verification that medication exists
    prismaMock.medication.findFirst.mockResolvedValueOnce(mockMedication);

    // Mock for $transaction operations
    prismaMock.scheduleEntry.findMany.mockResolvedValue([]);
    prismaMock.scheduleEntry.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.schedule.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.medication.update.mockResolvedValue({
      ...mockMedication,
      deletedAt: new Date(),
    });

    const res = await MedicationIdRoute.DELETE(makeDeleteReq(), params);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe("Medication deleted successfully");
  });

  it("should return 500 on database error", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(mockMedication);

    // Mock $transaction to throw
    prismaMock.$transaction.mockRejectedValueOnce(new Error("Database error"));

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
