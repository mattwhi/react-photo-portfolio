import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { hashToken } from "@/lib/token";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as any;

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const token = String(body.token ?? "").trim();
  const password = String(body.password ?? "");

  if (!email || !token || password.length < 10) {
    return NextResponse.json(
      { ok: false, error: "Invalid request (min password length 10)." },
      { status: 400 }
    );
  }

  const tokenHash = hashToken(token);

  const record = await prisma.verificationToken.findFirst({
    where: {
      email,
      tokenHash,
      type: "PASSWORD_RESET",
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!record) {
    return NextResponse.json(
      { ok: false, error: "Reset link is invalid or expired." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { password: passwordHash, passwordChangedAt: new Date() },
    }),
    // remove used token + any other outstanding reset tokens
    prisma.verificationToken.deleteMany({
      where: { email, type: "PASSWORD_RESET" },
    }),
  ]);

  // Optional: also clear session cookie so they must log in again
  const res = NextResponse.json({ ok: true, redirect: "/login" });
  res.cookies.set("pp_session", "", { path: "/", maxAge: 0 });
  return res;
}
