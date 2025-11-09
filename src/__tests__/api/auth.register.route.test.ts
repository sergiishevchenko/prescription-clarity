import * as bcrypt from "bcryptjs";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import * as RegisterRoute from "@/app/api/auth/register/route";
import { prismaMock } from "../../../tests-setup/prisma.mock";
import type { MockedFunction } from "jest-mock";

type RegisterHandler = typeof RegisterRoute.POST;
type RegisterRequest = Parameters<RegisterHandler>[0];
type RegisterPayload = Partial<{
  email: string;
  password: string;
  name: string | null;
}>;

const makeReq = (body: RegisterPayload): RegisterRequest =>
  new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as RegisterRequest;

const restoreConsoleErrorIfMocked = () => {
  if (jest.isMockFunction(console.error)) {
    (console.error as jest.MockedFunction<typeof console.error>).mockRestore();
  }
};

beforeAll(restoreConsoleErrorIfMocked);
afterAll(restoreConsoleErrorIfMocked);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/auth/register", () => {
  const hashMock = bcrypt.hash as MockedFunction<typeof bcrypt.hash>;

  it("201 when new user", async () => {
    hashMock.mockImplementationOnce(async () => "mocked-hash");
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.create.mockResolvedValueOnce({
      id: "u1",
      email: "a@b.com",
    });

    const res = await RegisterRoute.POST(
      makeReq({
        email: "abcde@booble.com",
        password: "Secret123",
        name: "User",
      }),
    );
    expect(res.status).toBe(201);
  });

  it("409 when email exists", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "u1" });

    const res = await RegisterRoute.POST(
      makeReq({
        email: "abcde@booble.com",
        password: "Secret123",
        name: "User2",
      }),
    );
    expect(res.status).toBe(409);
  });

  it("400 when payload violates schema", async () => {
    const res = await RegisterRoute.POST(
      makeReq({
        email: "not-an-email",
        password: "short",
        name: "",
      }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid input data");
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("409 when Prisma unique constraint error occurs during create", async () => {
    hashMock.mockImplementationOnce(async () => "hash");
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.create.mockRejectedValueOnce(
      new PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
        meta: { target: ["email"] },
      }),
    );

    const res = await RegisterRoute.POST(
      makeReq({
        email: "abcde@booble.com",
        password: "Secret123",
      }),
    );

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/already exists/i);
  });

  it("500 when unexpected error bubbles up", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    hashMock.mockImplementationOnce(async () => "hash");
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.create.mockRejectedValueOnce(new Error("boom"));

    const res = await RegisterRoute.POST(
      makeReq({
        email: "abcde@booble.com",
        password: "Secret123",
      }),
    );

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal server error");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
