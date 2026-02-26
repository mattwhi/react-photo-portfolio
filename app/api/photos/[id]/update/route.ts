import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  await requireAdmin();

  const form = await req.formData();
  const title = String(form.get("title") ?? "").trim() || null;
  const description = String(form.get("description") ?? "").trim() || null;

  await prisma.photo.update({
    where: { id: params.id },
    data: { title, description },
  });

  return NextResponse.redirect(
    new URL(req.headers.get("referer") ?? "/admin/galleries", req.url)
  );
}
