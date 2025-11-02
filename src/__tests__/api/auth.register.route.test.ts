import * as bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import * as RegisterRoute from "@/app/api/auth/register/route";
import { prismaMock } from "../../../tests-setup/prisma.mock";

beforeAll(() => {
  (console.error as any).mockRestore?.(); // відновлює консоль, якщо глобально заглушена в jest.setup.api.ts
});
afterAll(() => {
  // після дебагу можна прибрати цей блок або знову заглушити, якщо треба
});

const makeReq = (body: any) =>
  new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/auth/register", () => {
  it("201 when new user", async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValueOnce("mocked-hash");
    (prisma as any).user.findUnique.mockResolvedValueOnce(null);
    (prisma as any).user.create.mockResolvedValueOnce({ id: "u1", email: "a@b.com" });

    // @ts-ignore Next route exports POST
    const res = await RegisterRoute.POST(await makeReq({ email: "abcde@booble.com", password: "Secret123", name: "User" }));
    expect(res.status).toBe(201);
  });

  // 🔻 Відомий баг: API повертає 400 замість 409
  it.failing("409 when email exists  [KNOWN BUG: returns 400 now", async () => {
    (prisma as any).user.findUnique.mockResolvedValueOnce({ id: "u1" });

    // @ts-ignore
    const res = await RegisterRoute.POST(await makeReq({ email: "abcde@booble.com", password: "Secret123", name: "User2" }));
    expect(res.status).toBe(409); // коли бек виправлять -> тест пройде -> CI впаде (expected!)
  });

  afterEach(() => {
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.create.mockReset();
  });
});
