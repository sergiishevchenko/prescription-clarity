import * as MedicationSearchRoute from "@/app/api/medications/search/route";
import { prismaMock } from "../../../tests-setup/prisma.mock";
import * as SessionModule from "@/lib/auth/session";

type PostHandler = typeof MedicationSearchRoute.POST;
type PostRequest = Parameters<PostHandler>[0];

const makeSearchRequest = (body: object): PostRequest =>
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

describe("POST /api/medications/search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(null);

    const res = await MedicationSearchRoute.POST(
      makeSearchRequest({ name: "asp" }),
    );
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Unauthorized" }),
    );
  });

  it("returns 400 when query is shorter than 3 characters", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const res = await MedicationSearchRoute.POST(
      makeSearchRequest({ name: "as" }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Invalid input data" }),
    );
    expect(prismaMock.medication.findMany).not.toHaveBeenCalled();
  });

  it("returns matching medications for a valid prefix", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const matches = [
      {
        id: "m1",
        userId: mockUser.id,
        name: "Aspirin",
        dose: 500,
        form: "tablets",
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "m2",
        userId: mockUser.id,
        name: "Aspartame",
        dose: null,
        form: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    prismaMock.medication.findMany.mockResolvedValueOnce(matches);

    const res = await MedicationSearchRoute.POST(
      makeSearchRequest({ name: "asp" }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.medications).toHaveLength(2);
    expect(prismaMock.medication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockUser.id,
          deletedAt: null,
          name: expect.objectContaining({
            startsWith: "asp",
            mode: "insensitive",
          }),
        }),
      }),
    );
  });

  it("returns empty array when nothing matches", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findMany.mockResolvedValueOnce([]);

    const res = await MedicationSearchRoute.POST(
      makeSearchRequest({ name: "zzz" }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.medications).toEqual([]);
  });

  it("returns 500 when database query fails", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.medication.findMany.mockRejectedValueOnce(new Error("DB fail"));

    const res = await MedicationSearchRoute.POST(
      makeSearchRequest({ name: "asp" }),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Internal server error" }),
    );
  });
});
