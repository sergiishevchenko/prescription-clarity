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
        dose: 100,
        form: "tablets",
        deletedAt: null,
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
          deletedAt: null,
        }),
      }),
    );
  });

  it("should filter by deletedAt=null to show active medications", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const mockActiveMedications = [
      {
        id: "med1",
        userId: "user123",
        name: "Aspirin",
        dose: 100,
        form: "tablets",
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    prismaMock.medication.findMany.mockResolvedValueOnce(mockActiveMedications);

    const res = await MedicationsRoute.GET(makeGetReq());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.medications).toHaveLength(1);
    expect(data.medications[0].deletedAt).toBeNull();
    expect(prismaMock.medication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user123",
          deletedAt: null,
        }),
      }),
    );
  });

  it("should not include deleted medications regardless of query parameter", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const mockActiveMedications = [
      {
        id: "med1",
        userId: "user123",
        name: "Aspirin",
        dose: 100,
        form: "tablets",
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    prismaMock.medication.findMany.mockResolvedValueOnce(mockActiveMedications);

    const res = await MedicationsRoute.GET(makeGetReq("?deleted=true"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.medications).toHaveLength(1);
    expect(data.medications[0].deletedAt).toBeNull();
    expect(prismaMock.medication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user123",
          deletedAt: null,
        }),
      }),
    );
  });

  it("should only return active medications when no parameter is provided", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const mockActiveMedications = [
      {
        id: "med1",
        userId: "user123",
        name: "Aspirin",
        dose: 100,
        form: "tablets",
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    prismaMock.medication.findMany.mockResolvedValueOnce(mockActiveMedications);

    const res = await MedicationsRoute.GET(makeGetReq());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.medications).toHaveLength(1);
    expect(data.medications[0].deletedAt).toBeNull();
    // Verify that the where clause specifically filters for active (not deleted) medications
    expect(prismaMock.medication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user123",
          deletedAt: null,
        }),
      }),
    );
  });

  it("should fallback to active medications when parameter is invalid", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const mockActiveMedications = [
      {
        id: "med1",
        userId: "user123",
        name: "Aspirin",
        dose: 100,
        form: "tablets",
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    prismaMock.medication.findMany.mockResolvedValueOnce(mockActiveMedications);

    const res = await MedicationsRoute.GET(makeGetReq("?deleted=invalid"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.medications).toHaveLength(1);
    expect(prismaMock.medication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user123",
          deletedAt: null,
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
        dose: 100,
        form: "tablets",
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
      dose: 100,
      form: "tablets",
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.medication.findFirst.mockResolvedValueOnce(null);
    prismaMock.medication.create.mockResolvedValueOnce(mockCreatedMedication);

    const res = await MedicationsRoute.POST(
      makePostReq({
        name: "Aspirin",
        dose: 100,
        form: "tablets",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.medication.name).toBe("Aspirin");
    expect(data.medication.deletedAt).toBeNull();
    expect(prismaMock.medication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user123",
          name: "Aspirin",
          dose: 100,
          form: "tablets",
        }),
      }),
    );
  });

  it("should return 400 on invalid input data", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const res = await MedicationsRoute.POST(
      makePostReq({
        name: "",
        dose: 100,
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid input data");
  });

  it("should return 409 when duplicate medication exists (same name + dose + form)", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const existingMedication = {
      id: "med1",
      userId: "user123",
      name: "Aspirin",
      dose: 100,
      form: "tablets",
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.medication.findFirst.mockResolvedValueOnce(existingMedication);

    const res = await MedicationsRoute.POST(
      makePostReq({
        name: "Aspirin",
        dose: 100,
        form: "tablets",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toBe("Medication already exists");
    expect(prismaMock.medication.findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user123",
        deletedAt: null,
        name: {
          equals: "Aspirin",
          mode: "insensitive",
        },
        dose: 100,
        form: {
          equals: "tablets",
          mode: "insensitive",
        },
      },
    });
  });

  it("should return 409 for case-insensitive duplicate name", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const existingMedication = {
      id: "med1",
      userId: "user123",
      name: "Aspirin",
      dose: 100,
      form: "tablets",
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.medication.findFirst.mockResolvedValueOnce(existingMedication);

    const res = await MedicationsRoute.POST(
      makePostReq({
        name: "ASPIRIN",
        dose: 100,
        form: "tablets",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toBe("Medication already exists");
  });

  it("should allow creation when different dose", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(null);

    const mockCreatedMedication = {
      id: "med2",
      userId: "user123",
      name: "Aspirin",
      dose: 200,
      form: "tablets",
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.medication.create.mockResolvedValueOnce(mockCreatedMedication);

    const res = await MedicationsRoute.POST(
      makePostReq({
        name: "Aspirin",
        dose: 200,
        form: "tablets",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.medication.dose).toBe(200);
  });

  it("should allow creation when different form", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(null);

    const mockCreatedMedication = {
      id: "med2",
      userId: "user123",
      name: "Aspirin",
      dose: 100,
      form: "capsules",
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.medication.create.mockResolvedValueOnce(mockCreatedMedication);

    const res = await MedicationsRoute.POST(
      makePostReq({
        name: "Aspirin",
        dose: 100,
        form: "capsules",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.medication.form).toBe("capsules");
  });

  it("should allow creation when same medication was soft-deleted", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    // findFirst returns null because deletedAt filter excludes soft-deleted
    prismaMock.medication.findFirst.mockResolvedValueOnce(null);

    const mockCreatedMedication = {
      id: "med2",
      userId: "user123",
      name: "Aspirin",
      dose: 100,
      form: "tablets",
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.medication.create.mockResolvedValueOnce(mockCreatedMedication);

    const res = await MedicationsRoute.POST(
      makePostReq({
        name: "Aspirin",
        dose: 100,
        form: "tablets",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.medication.name).toBe("Aspirin");
  });

  it("should return 500 on database error", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findFirst.mockResolvedValueOnce(null);
    prismaMock.medication.create.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementationOnce(() => {});

    const res = await MedicationsRoute.POST(
      makePostReq({
        name: "Aspirin",
        dose: 100,
        form: "tablets",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
