import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  await requireAdmin();

  const latest = await prisma.photo.findFirst({
    where: { galleryId: params.id },
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
    where: { id: params.id },
    data: { coverUrl: latest.url },
  });

  // Redirect back to wherever you clicked from
  const back = req.headers.get("referer") || "/admin/galleries";
  return NextResponse.redirect(back);
}
