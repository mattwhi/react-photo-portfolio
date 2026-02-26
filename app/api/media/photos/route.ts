import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Returns Gallery[] in the shape MediaPicker expects:
 * [
 *   { id, title, photos: [{ id, key, url, alt, title }] }
 * ]
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();
  const galleryId = (searchParams.get("galleryId") || "").trim();

  const galleries = await prisma.gallery.findMany({
    orderBy: { createdAt: "desc" as any }, // change to { id: "desc" } if no createdAt
    include: {
      photos: true,
    },
    take: 200,
  });

  const result = galleries
    .filter((g: any) => (!galleryId ? true : g.id === galleryId))
    .map((g: any) => {
      const photos = (g.photos || [])
        .map((p: any) => {
          const url = p.url || "";
          const title = p.title || "";
          const key = p.r2Key || ""; // if you have it
          return {
            id: p.id,
            key,
            url,
            alt: "", // your Photo model doesn't have alt (safe empty)
            title,
          };
        })
        .filter((p: any) => p.url)
        .filter((p: any) => {
          if (!q) return true;
          const hay = `${p.title} ${p.key} ${p.url}`.toLowerCase();
          return hay.includes(q);
        })
        .slice(0, 500);

      return {
        id: g.id,
        title: g.title ?? g.slug ?? "Album",
        photos,
      };
    });

  return NextResponse.json(result);
}
