import * as MedicationsRoute from "@/app/api/medications/route";
import { prismaMock } from "../../../tests-setup/prisma.mock";
import * as SessionModule from "@/lib/auth/session";

type GetHandler = typeof MedicationsRoute.GET;
type PostHandler = typeof MedicationsRoute.POST;
type GetRequest = Parameters<GetHandler>[0];
type PostRequest = Parameters<PostHandler>[0];

const makeGetReq = (queryParams = ""): GetRequest =>
  new Request(
    `http://localhost/api/medications${queryParams}`,
  ) as unknown as GetRequest;

const makePostReq = (body: object): PostRequest =>
  new Request("http://localhost/api/medications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as PostRequest;

const mockUser = {
  id: "user123",
  email: "test@example.com",
  name: "Test User",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/medications", () => {
  it("should return 401 if user is not authenticated", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(null);

    const res = await MedicationsRoute.GET(makeGetReq());
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return active medications by default", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const mockMedications = [
      {
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
      },
    ];

    prismaMock.medication.findMany.mockResolvedValueOnce(mockMedications);

    const res = await MedicationsRoute.GET(makeGetReq());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.medications).toHaveLength(1);
    expect(data.medications[0].name).toBe("Aspirin");
    expect(prismaMock.medication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user123",
          status: "ACTIVE",
        }),
      }),
    );
  });

  it("should filter by status=ACTIVE query parameter", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const mockActiveMedications = [
      {
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
      },
    ];

    prismaMock.medication.findMany.mockResolvedValueOnce(mockActiveMedications);

    const res = await MedicationsRoute.GET(makeGetReq("?status=ACTIVE"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.medications).toHaveLength(1);
    expect(data.medications[0].status).toBe("ACTIVE");
    expect(prismaMock.medication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user123",
          status: "ACTIVE",
        }),
      }),
    );
  });

  it("should filter by status=DELETED query parameter", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const mockDeletedMedications = [
      {
        id: "med2",
        userId: "user123",
        name: "Old Medicine",
        dose: "50mg",
        frequency: 12,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        status: "DELETED" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    prismaMock.medication.findMany.mockResolvedValueOnce(
      mockDeletedMedications,
    );

    const res = await MedicationsRoute.GET(makeGetReq("?status=DELETED"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.medications).toHaveLength(1);
    expect(data.medications[0].status).toBe("DELETED");
    expect(prismaMock.medication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user123",
          status: "DELETED",
        }),
      }),
    );
  });

  it("should only return ACTIVE medications when no status parameter is provided", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const mockActiveMedications = [
      {
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
      },
    ];

    prismaMock.medication.findMany.mockResolvedValueOnce(mockActiveMedications);

    const res = await MedicationsRoute.GET(makeGetReq());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.medications).toHaveLength(1);
    expect(data.medications[0].status).toBe("ACTIVE");
    // Verify that the where clause specifically filters for ACTIVE status
    expect(prismaMock.medication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user123",
          status: "ACTIVE",
        }),
      }),
    );
  });

  it("should return 500 on database error", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findMany.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementationOnce(() => {});

    const res = await MedicationsRoute.GET(makeGetReq());
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe("POST /api/medications", () => {
  it("should return 401 if user is not authenticated", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(null);

    const res = await MedicationsRoute.POST(
      makePostReq({
        name: "Aspirin",
        dose: "100mg",
        frequency: 24,
        startDate: "2025-01-01T00:00:00Z",
        endDate: "2025-12-31T00:00:00Z",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should create medication successfully", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const mockCreatedMedication = {
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

    prismaMock.medication.create.mockResolvedValueOnce(mockCreatedMedication);

    const res = await MedicationsRoute.POST(
      makePostReq({
        name: "Aspirin",
        dose: "100mg",
        frequency: 24,
        startDate: "2025-01-01T00:00:00Z",
        endDate: "2025-12-31T00:00:00Z",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.medication.name).toBe("Aspirin");
    expect(data.medication.status).toBe("ACTIVE");
    expect(prismaMock.medication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user123",
          name: "Aspirin",
          dose: "100mg",
          frequency: 24,
          status: "ACTIVE",
        }),
      }),
    );
  });

  it("should return 400 if end date is before start date", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const res = await MedicationsRoute.POST(
      makePostReq({
        name: "Aspirin",
        dose: "100mg",
        frequency: 24,
        startDate: "2025-12-31T00:00:00Z",
        endDate: "2025-01-01T00:00:00Z",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("End date must be after start date");
  });

  it("should return 400 on invalid input data", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const res = await MedicationsRoute.POST(
      makePostReq({
        name: "",
        dose: "100mg",
        frequency: 24,
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid input data");
  });

  it("should return 500 on database error", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.create.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementationOnce(() => {});

    const res = await MedicationsRoute.POST(
      makePostReq({
        name: "Aspirin",
        dose: "100mg",
        frequency: 24,
        startDate: "2025-01-01T00:00:00Z",
        endDate: "2025-12-31T00:00:00Z",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
