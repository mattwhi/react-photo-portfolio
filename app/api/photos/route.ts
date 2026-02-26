import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(req: Request) {
  await requireAdmin();

  const body = (await req.json().catch(() => null)) as {
    galleryId?: string;
    url?: string;
    description?: string;
    title?: string;
  } | null;

  const galleryId = (body?.galleryId ?? "").trim();
  const url = (body?.url ?? "").trim();
  const description = body?.description?.trim() || null;
  const title = body?.title?.trim() || null;

  if (!galleryId || !url) {
    return NextResponse.json(
      { error: "Missing galleryId or url" },
      { status: 400 }
    );
  }

  // Fetch gallery once so we know if it already has a cover
  const gallery = await prisma.gallery.findUnique({
    where: { id: galleryId },
    select: { id: true, coverUrl: true },
  });

  if (!gallery) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const photo = await tx.photo.create({
      data: { galleryId: gallery.id, url, description, title },
      select: {
        id: true,
        galleryId: true,
        url: true,
        title: true,
        description: true,
        createdAt: true,
      },
    });

    // Auto-cover only if not set already
    if (!gallery.coverUrl) {
      await tx.gallery.update({
        where: { id: gallery.id },
        data: { coverUrl: url },
      });
    }

    return photo;
  });

  return NextResponse.json({ ok: true, photo: result });
}
