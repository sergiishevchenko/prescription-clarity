import * as MedicationsSearchRoute from "@/app/api/medications/search/route";
import { prismaMock } from "../../../tests-setup/prisma.mock";
import * as SessionModule from "@/lib/auth/session";

type PostHandler = typeof MedicationsSearchRoute.POST;
type PostRequest = Parameters<PostHandler>[0];

const makePostReq = (body: object): PostRequest =>
  new Request("http://localhost/api/medications/search", {
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

describe("POST /api/medications/search", () => {
  it("should return 401 if user is not authenticated", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(null);

    const res = await MedicationsSearchRoute.POST(
      makePostReq({
        name: "Asp",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 if search query is less than 3 characters", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const res = await MedicationsSearchRoute.POST(
      makePostReq({
        name: "As",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid input data");
  });

  it("should search medications by name and return only name, dose, units", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const mockMedications = [
      {
        name: "Aspirin",
        dose: "100mg",
        units: "tablets",
      },
      {
        name: "Aspirin Extra",
        dose: "200mg",
        units: "tablets",
      },
    ];

    prismaMock.medication.findMany.mockResolvedValueOnce(mockMedications);

    const res = await MedicationsSearchRoute.POST(
      makePostReq({
        name: "Asp",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.medications).toHaveLength(2);
    expect(data.medications[0]).toEqual({
      name: "Aspirin",
      dose: "100mg",
      units: "tablets",
    });
    expect(data.medications[1]).toEqual({
      name: "Aspirin Extra",
      dose: "200mg",
      units: "tablets",
    });

    expect(prismaMock.medication.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user123",
        status: "ACTIVE",
        name: {
          contains: "Asp",
          mode: "insensitive",
        },
      },
      orderBy: {
        name: "asc",
      },
      select: {
        name: true,
        dose: true,
        units: true,
      },
    });
  });

  it("should perform case-insensitive search", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const mockMedications = [
      {
        name: "Aspirin",
        dose: "100mg",
        units: "tablets",
      },
    ];

    prismaMock.medication.findMany.mockResolvedValueOnce(mockMedications);

    const res = await MedicationsSearchRoute.POST(
      makePostReq({
        name: "asp",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.medications).toHaveLength(1);
    expect(prismaMock.medication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: {
            contains: "asp",
            mode: "insensitive",
          },
        }),
      }),
    );
  });

  it("should return empty array if no medications match", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findMany.mockResolvedValueOnce([]);

    const res = await MedicationsSearchRoute.POST(
      makePostReq({
        name: "Xyz",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.medications).toHaveLength(0);
  });

  it("should only search ACTIVE medications", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findMany.mockResolvedValueOnce([]);

    await MedicationsSearchRoute.POST(
      makePostReq({
        name: "Asp",
      }),
    );

    expect(prismaMock.medication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
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

    const res = await MedicationsSearchRoute.POST(
      makePostReq({
        name: "Asp",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
