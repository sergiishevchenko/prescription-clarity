import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";

import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validators/auth";
import { createSession, destroyAllUserSessions } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookies";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Валідація вхідних даних
    const { email, password } = loginSchema.parse(body);

    // Знайти користувача
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Перевірити пароль
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // (Опційно) ротація попередніх сесій
    await destroyAllUserSessions(user.id);

    // Створити нову сесію і виставити cookie через NextResponse
    const sessionToken = await createSession(user.id);

    const res = NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name } },
      { status: 200 },
    );

    setSessionCookie(res, sessionToken);

    return res;
  } catch (err: unknown) {
    // Помилки валідації Zod
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: err.flatten() },
        { status: 400 },
      );
    }

    // Інші помилки
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
