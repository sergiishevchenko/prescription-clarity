import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { ZodError } from "zod";

import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validators/auth";
import { createSession } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookies";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = registerSchema.parse(body);

    // Перевірка — чи існує користувач
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Хешування паролю
    const passwordHash = await bcrypt.hash(password, 12);

    // Створення нового користувача
    const user = await prisma.user.create({
      data: { email, passwordHash, name: name || null },
      select: { id: true, email: true, name: true },
    });

    // Створення сесії
    const sessionToken = await createSession(user.id);
    const res = NextResponse.json({ user }, { status: 201 });

    setSessionCookie(res, sessionToken);

    return res;
  } catch (err: unknown) {
    // 1️⃣ Помилка Prisma — дубльований email
    if (
      err instanceof PrismaClientKnownRequestError &&
      err.code === "P2002" &&
      Array.isArray(err.meta?.target) &&
      err.meta.target.includes("email")
    ) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // 2️⃣ Помилка валідації (Zod)
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: err.flatten() },
        { status: 400 },
      );
    }

    // 3️⃣ Інші помилки
    console.error("Register API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
