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

  const galleryId = body?.galleryId ?? "";
  const url = body?.url ?? "";
  const description = body?.description?.trim() || null;
  const title = body?.title?.trim() || null;

  if (!galleryId || !url) {
    return NextResponse.json(
      { error: "Missing galleryId or url" },
      { status: 400 }
    );
  }

  // ✅ fetch gallery once so we know if it already has a cover
  const gallery = await prisma.gallery.findUnique({
    where: { id: galleryId },
    select: { coverUrl: true },
  });

  if (!gallery) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }

  const photo = await prisma.photo.create({
    data: { galleryId, url, description, title },
  });

  // ✅ auto-cover only if not set already
  if (!gallery.coverUrl) {
    await prisma.gallery.update({
      where: { id: galleryId },
      data: { coverUrl: url },
    });
  }

  return NextResponse.json({ ok: true, photo });
}
