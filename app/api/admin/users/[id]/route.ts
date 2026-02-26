import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/requireAdmin";

export const runtime = "nodejs";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  const { id } = await params;

  const body = (await req.json().catch(() => ({}))) as any;
  const role = body.role === "admin" ? "admin" : "member";

  // Prevent removing the last admin
  if (role !== "admin") {
    const admins = await prisma.user.count({ where: { role: "admin" } });
    const target = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (target?.role === "admin" && admins <= 1) {
      return NextResponse.json(
        { error: "Cannot downgrade the last admin." },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, user: updated });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  let session: any;
  try {
    session = await requireAdmin();
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  const { id } = await params;

  // Don't allow deleting yourself
  if (session?.sub === id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    );
  }

  // Don't allow deleting the last admin
  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (target.role === "admin") {
    const admins = await prisma.user.count({ where: { role: "admin" } });
    if (admins <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last admin." },
        { status: 400 }
      );
    }
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
