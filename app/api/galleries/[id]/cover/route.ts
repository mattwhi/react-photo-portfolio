import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  await requireAdmin();

  const contentType = req.headers.get("content-type") || "";
  let coverUrl: string | null = null;

  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as {
      coverUrl?: string;
    } | null;
    coverUrl = body?.coverUrl?.trim() || null;
  } else {
    const form = await req.formData();
    coverUrl = String(form.get("coverUrl") ?? "").trim() || null;
  }

  if (!coverUrl) {
    return NextResponse.json({ error: "Missing coverUrl" }, { status: 400 });
  }

  await prisma.gallery.update({
    where: { id: params.id },
    data: { coverUrl },
  });

  return NextResponse.json({ ok: true });
}
