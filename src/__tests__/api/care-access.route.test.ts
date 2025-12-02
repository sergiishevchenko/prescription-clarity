import * as CareAccessRoute from "@/app/api/care-access/route";
import { prismaMock } from "../../../tests-setup/prisma.mock";
import * as SessionModule from "@/lib/auth/session";

type GetHandler = typeof CareAccessRoute.GET;
type GetRequest = Parameters<GetHandler>[0];

type DeleteHandler = typeof CareAccessRoute.DELETE;
type DeleteRequest = Parameters<DeleteHandler>[0];

const makeGetReq = (params?: Record<string, string>): GetRequest => {
  const url = new URL("http://localhost/api/care-access");
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return new Request(url.toString()) as unknown as GetRequest;
};

const makeDeleteReq = (params?: Record<string, string>): DeleteRequest => {
  const url = new URL("http://localhost/api/care-access");
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return new Request(url.toString(), {
    method: "DELETE",
  }) as unknown as DeleteRequest;
};

const mockUser = {
  id: "user123",
  email: "user@example.com",
  name: "Current User",
};

const mockViewer1 = {
  id: "viewer1",
  email: "viewer1@example.com",
  name: "Viewer One",
  dateOfBirth: null,
};

const mockViewer2 = {
  id: "viewer2",
  email: "viewer2@example.com",
  name: "Viewer Two",
  dateOfBirth: null,
};

const mockPatient1 = {
  id: "patient1",
  email: "patient1@example.com",
  name: "Patient One",
  dateOfBirth: null,
};

const mockPatient2 = {
  id: "patient2",
  email: "patient2@example.com",
  name: "Patient Two",
  dateOfBirth: null,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/care-access", () => {
  it("should return 401 if user is not authenticated", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(null);

    const res = await CareAccessRoute.GET(makeGetReq());
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return empty lists when user has no care access relationships", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.careAccess.findMany.mockResolvedValueOnce([]); // viewers
    prismaMock.careAccess.findMany.mockResolvedValueOnce([]); // caringFor

    const res = await CareAccessRoute.GET(makeGetReq());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.viewers).toEqual([]);
    expect(data.caringFor).toEqual([]);
  });

  it("should return list of viewers (people who can view my data)", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const myViewersData = [
      {
        id: "access1",
        viewerId: mockViewer1.id,
        createdAt: new Date("2025-11-20T10:00:00Z"),
        updatedAt: new Date("2025-11-20T10:00:00Z"),
        viewer: mockViewer1,
      },
      {
        id: "access2",
        viewerId: mockViewer2.id,
        createdAt: new Date("2025-11-21T10:00:00Z"),
        updatedAt: new Date("2025-11-21T10:00:00Z"),
        viewer: mockViewer2,
      },
    ];

    prismaMock.careAccess.findMany.mockResolvedValueOnce(myViewersData); // viewers
    prismaMock.careAccess.findMany.mockResolvedValueOnce([]); // caringFor

    const res = await CareAccessRoute.GET(makeGetReq());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.viewers).toHaveLength(2);
    expect(data.viewers[0]).toMatchObject({
      accessId: "access1",
      userId: mockViewer1.id,
      user: mockViewer1,
    });
    expect(data.viewers[1]).toMatchObject({
      accessId: "access2",
      userId: mockViewer2.id,
      user: mockViewer2,
    });
    expect(data.caringFor).toEqual([]);

    // Verify correct query for viewers (where I am the owner)
    expect(prismaMock.careAccess.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { ownerId: mockUser.id },
      }),
    );
  });

  it("should return list of people I'm caring for (whose data I can view)", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const caringForData = [
      {
        id: "access3",
        ownerId: mockPatient1.id,
        createdAt: new Date("2025-11-22T10:00:00Z"),
        updatedAt: new Date("2025-11-22T10:00:00Z"),
        owner: mockPatient1,
      },
      {
        id: "access4",
        ownerId: mockPatient2.id,
        createdAt: new Date("2025-11-23T10:00:00Z"),
        updatedAt: new Date("2025-11-23T10:00:00Z"),
        owner: mockPatient2,
      },
    ];

    prismaMock.careAccess.findMany.mockResolvedValueOnce([]); // viewers
    prismaMock.careAccess.findMany.mockResolvedValueOnce(caringForData); // caringFor
    // Mock adherence calculations for both patients
    prismaMock.dayStatus.findMany.mockResolvedValueOnce([]); // patient1 - 7 days
    prismaMock.dayStatus.findMany.mockResolvedValueOnce([]); // patient1 - 30 days
    prismaMock.dayStatus.findMany.mockResolvedValueOnce([]); // patient2 - 7 days
    prismaMock.dayStatus.findMany.mockResolvedValueOnce([]); // patient2 - 30 days

    const res = await CareAccessRoute.GET(makeGetReq());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.viewers).toEqual([]);
    expect(data.caringFor).toHaveLength(2);
    expect(data.caringFor[0]).toMatchObject({
      accessId: "access3",
      userId: mockPatient1.id,
      user: mockPatient1,
    });
    expect(data.caringFor[1]).toMatchObject({
      accessId: "access4",
      userId: mockPatient2.id,
      user: mockPatient2,
    });

    // Verify correct query for caringFor (where I am the viewer)
    expect(prismaMock.careAccess.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { viewerId: mockUser.id },
      }),
    );
  });

  it("should return both viewers and caringFor lists", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const myViewersData = [
      {
        id: "access1",
        viewerId: mockViewer1.id,
        createdAt: new Date("2025-11-20T10:00:00Z"),
        updatedAt: new Date("2025-11-20T10:00:00Z"),
        viewer: mockViewer1,
      },
    ];

    const caringForData = [
      {
        id: "access3",
        ownerId: mockPatient1.id,
        createdAt: new Date("2025-11-22T10:00:00Z"),
        updatedAt: new Date("2025-11-22T10:00:00Z"),
        owner: mockPatient1,
      },
    ];

    prismaMock.careAccess.findMany.mockResolvedValueOnce(myViewersData);
    prismaMock.careAccess.findMany.mockResolvedValueOnce(caringForData);
    // Mock adherence calculations for patient1
    prismaMock.dayStatus.findMany.mockResolvedValueOnce([]); // patient1 - 7 days
    prismaMock.dayStatus.findMany.mockResolvedValueOnce([]); // patient1 - 30 days

    const res = await CareAccessRoute.GET(makeGetReq());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.viewers).toHaveLength(1);
    expect(data.caringFor).toHaveLength(1);
  });

  it("should return 500 on database error", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.careAccess.findMany.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementationOnce(() => {});

    const res = await CareAccessRoute.GET(makeGetReq());
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe("DELETE /api/care-access", () => {
  it("should return 401 if user is not authenticated", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(null);

    const res = await CareAccessRoute.DELETE(
      makeDeleteReq({ accessId: "access1" }),
    );
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 if accessId is missing", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const res = await CareAccessRoute.DELETE(makeDeleteReq());
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Missing accessId parameter");
  });

  it("should return 404 if care access not found", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.careAccess.findUnique.mockResolvedValueOnce(null);

    const res = await CareAccessRoute.DELETE(
      makeDeleteReq({ accessId: "nonexistent" }),
    );
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Care access not found");
  });

  it("should return 403 if user is not the owner", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const careAccess = {
      id: "access1",
      ownerId: "differentUser", // Not the current user
      viewerId: mockViewer1.id,
    };

    prismaMock.careAccess.findUnique.mockResolvedValueOnce(careAccess);

    const res = await CareAccessRoute.DELETE(
      makeDeleteReq({ accessId: "access1" }),
    );
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Forbidden: Only the owner can revoke care access");
    expect(prismaMock.careAccess.delete).not.toHaveBeenCalled();
  });

  it("should successfully revoke care access when user is the owner", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    const careAccess = {
      id: "access1",
      ownerId: mockUser.id,
      viewerId: mockViewer1.id,
    };

    prismaMock.careAccess.findUnique.mockResolvedValueOnce(careAccess);
    prismaMock.careAccess.delete.mockResolvedValueOnce({
      id: "access1",
      ownerId: mockUser.id,
      viewerId: mockViewer1.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await CareAccessRoute.DELETE(
      makeDeleteReq({ accessId: "access1" }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Care access revoked successfully");
    expect(prismaMock.careAccess.delete).toHaveBeenCalledWith({
      where: { id: "access1" },
    });
  });

  it("should return 500 on database error", async () => {
    jest
      .spyOn(SessionModule, "getSessionUserFromRequest")
      .mockResolvedValueOnce(mockUser);

    prismaMock.careAccess.findUnique.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementationOnce(() => {});

    const res = await CareAccessRoute.DELETE(
      makeDeleteReq({ accessId: "access1" }),
    );
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
