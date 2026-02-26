// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createEmailToken } from "@/lib/token";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as any;

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(body.password ?? "");
  if (!email || password.length < 10) {
    return NextResponse.json(
      { ok: false, error: "Invalid email or password (min 10 chars)." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "Email already in use." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      role: "member",
      emailVerifiedAt: null,
      passwordChangedAt: new Date(),
    },
    select: { id: true },
  });

  const { token, tokenHash } = createEmailToken();

  await prisma.verificationToken.create({
    data: {
      email,
      tokenHash,
      type: "EMAIL_VERIFY",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify-email?email=${encodeURIComponent(
    email
  )}&token=${encodeURIComponent(token)}`;

  // ✅ For now: log link. Later: send via Resend/Postmark/SES.
  console.log("VERIFY EMAIL:", verifyUrl);

  return NextResponse.json({ ok: true, redirect: "/check-email" });
}
