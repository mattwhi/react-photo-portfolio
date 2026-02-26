import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { requireAdmin, AuthError } from "@/lib/requireAdmin";

export const runtime = "nodejs";

function randomPassword(len = 14) {
  return crypto.randomBytes(32).toString("base64url").slice(0, len);
}

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, createdAt: true },
    take: 500,
  });

  return NextResponse.json({ ok: true, users });
}

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireAdmin();
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  const body = (await req.json().catch(() => ({}))) as any;
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const role = body.role === "admin" ? "admin" : "member";

  if (!email)
    return NextResponse.json({ error: "Email required" }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists)
    return NextResponse.json(
      { error: "Email already exists" },
      { status: 409 }
    );

  const tempPassword = String(body.password ?? "") || randomPassword();
  if (tempPassword.length < 10) {
    return NextResponse.json(
      { error: "Password must be at least 10 chars" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      role,
      // if you have these fields, keep them; if not, remove:
      emailVerifiedAt: new Date(),
      passwordChangedAt: new Date(),
    } as any,
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({
    ok: true,
    user,
    // show password once (admin created it)
    tempPassword: body.password ? undefined : tempPassword,
  });
}
