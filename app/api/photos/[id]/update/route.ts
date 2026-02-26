import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: Ctx) {
  await requireAdmin();

  const { id } = await params;

  const form = await req.formData();
  const title = String(form.get("title") ?? "").trim() || null;
  const description = String(form.get("description") ?? "").trim() || null;

  await prisma.photo.update({
    where: { id },
    data: { title, description },
  });

  const back = req.headers.get("referer") ?? "/admin/galleries";
  return NextResponse.redirect(new URL(back, req.url));
}
