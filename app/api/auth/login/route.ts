import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signSession } from "@/lib/security";

export const runtime = "nodejs";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}

async function readBody(
  req: NextRequest
): Promise<{ email?: string; password?: string; next?: string }> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await req.json().catch(() => ({}))) as any;
  }
  const fd = await req.formData();
  return {
    email: String(fd.get("email") ?? ""),
    password: String(fd.get("password") ?? ""),
    next: fd.get("next") ? String(fd.get("next")) : undefined,
  };
}

export async function POST(req: NextRequest) {
  const body = await readBody(req);

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const next = typeof body.next === "string" ? body.next : undefined;

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Missing email or password" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const token = await signSession({ sub: user.id, role: user.role });
  if (user.role !== "admin" && !user.emailVerifiedAt) {
    return NextResponse.json(
      { ok: false, error: "Please verify your email before logging in." },
      { status: 403 }
    );
  }

  // Default destinations
  const redirect = next || (user.role === "admin" ? "/admin" : "/");

  const res = NextResponse.json({ ok: true, redirect });
  res.cookies.set("pp_session", token, cookieOptions());
  return res;
}
