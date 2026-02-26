import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Returns Gallery[] in the shape MediaPicker expects:
 * [
 *   { id, title, photos: [{ id, key, url, alt, title }] }
 * ]
 */
export async function GET(req: Request) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();
  const galleryId = (searchParams.get("galleryId") || "").trim();

  const galleries = await prisma.gallery.findMany({
    where: galleryId ? { id: galleryId } : undefined,
    orderBy: { createdAt: "desc" }, // if you don't have createdAt, use: { id: "desc" }
    take: 200,
    select: {
      id: true,
      title: true,
      slug: true,
      photos: {
        // keep it lean - only what the picker needs
        select: { id: true, url: true, title: true },
        orderBy: { createdAt: "desc" }, // if no createdAt on Photo, use: { id: "desc" }
        take: 500,
      },
    },
  });

  const result = galleries.map((g) => {
    const photos = (g.photos || [])
      .map((p) => ({
        id: p.id,
        key: "", // use "" unless you actually have a storage key field in Prisma
        url: p.url || "",
        alt: "", // safe default
        title: p.title || "",
      }))
      .filter((p) => p.url)
      .filter((p) => {
        if (!q) return true;
        const hay = `${p.title} ${p.url}`.toLowerCase();
        return hay.includes(q);
      });

    return {
      id: g.id,
      title: g.title ?? g.slug ?? "Album",
      photos,
    };
  });

  return NextResponse.json(result);
}
