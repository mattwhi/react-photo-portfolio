import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  await requireAdmin();

  const form = await req.formData();

  const description = String(form.get("description") ?? "").trim() || null;
  const coverUrl = String(form.get("coverUrl") ?? "").trim() || null;

  const showInHero = form.get("showInHero") === "on";
  const heroOrderRaw = String(form.get("heroOrder") ?? "0");
  const heroOrder = Number.isFinite(Number(heroOrderRaw))
    ? parseInt(heroOrderRaw, 10)
    : 0;

  await prisma.gallery.update({
    where: { id: params.id },
    data: { description, coverUrl, showInHero, heroOrder },
  });

  return NextResponse.redirect(new URL("/admin/galleries", req.url));
}
