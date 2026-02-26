import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: Ctx) {
  await requireAdmin();

  const { id } = await params;

  const latest = await prisma.photo.findFirst({
    where: { galleryId: id },
    orderBy: { createdAt: "desc" },
    select: { url: true },
  });

  if (!latest?.url) {
    return NextResponse.json(
      { error: "No photos in this gallery yet" },
      { status: 400 }
    );
  }

  await prisma.gallery.update({
    where: { id },
    data: { coverUrl: latest.url },
  });

  // Redirect back to wherever you clicked from
  const back = req.headers.get("referer") || "/admin/galleries";
  const url = new URL(back, req.url); // handles relative + absolute safely
  return NextResponse.redirect(url);
}
