import * as bcrypt from "bcryptjs";
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
    prismaMock.user.create.mockResolvedValueOnce({ id: "u1", email: "a@b.com" });

    const res = await RegisterRoute.POST(makeReq({ email: "abcde@booble.com", password: "Secret123", name: "User" }));
    expect(res.status).toBe(201);
  });

  // 🔻 Відомий баг: API повертає 400 замість 409
  it.failing("409 when email exists  [KNOWN BUG: returns 400 now", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "u1" });

    const res = await RegisterRoute.POST(makeReq({ email: "abcde@booble.com", password: "Secret123", name: "User2" }));
    expect(res.status).toBe(409); // коли бек виправлять -> тест пройде -> CI впаде (expected!)
  });
});
