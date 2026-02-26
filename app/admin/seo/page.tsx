import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SeoEntityType } from "@prisma/client";
import { SEO_PAGES } from "@/lib/seoPages";

export default async function AdminSeoIndex() {
  // --- Site pages (Home, Blog index, etc.) ---
  const pageSeo = await prisma.seoMeta.findMany({
    where: {
      entityType: SeoEntityType.PAGE,
      entityId: { in: SEO_PAGES.map((p) => p.id) },
    },
    select: { entityId: true, title: true, description: true, noindex: true },
  });

  const pageSeoMap = new Map(pageSeo.map((s) => [s.entityId, s]));

  // --- Galleries ---
  const galleries = await prisma.gallery.findMany({
    select: { id: true, title: true, slug: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const gallerySeo = await prisma.seoMeta.findMany({
    where: {
      entityType: SeoEntityType.GALLERY,
      entityId: { in: galleries.map((g) => g.id) },
    },
    select: { entityId: true, title: true, description: true, noindex: true },
  });

  const gallerySeoMap = new Map(gallerySeo.map((s) => [s.entityId, s]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">SEO Manager</h1>

      {/* SITE PAGES */}
      <div className="rounded-xl border p-4">
        <h2 className="font-semibold mb-3">Site pages</h2>

        <div className="space-y-2">
          {SEO_PAGES.map((p) => {
            const s = pageSeoMap.get(p.id);
            const status = s?.noindex
              ? "NOINDEX"
              : s?.title || s?.description
              ? "Custom SEO"
              : "Auto";

            return (
              <div key={p.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.label}</div>
                  <div className="text-sm opacity-70">
                    {p.path} • {status}
                  </div>
                </div>
                <Link className="underline" href={`/admin/seo/page/${p.id}`}>
                  Edit
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* GALLERIES */}
      <div className="rounded-xl border p-4">
        <h2 className="font-semibold mb-3">Galleries</h2>

        <div className="space-y-2">
          {galleries.map((g) => {
            const s = gallerySeoMap.get(g.id);
            const status = s?.noindex
              ? "NOINDEX"
              : s?.title || s?.description
              ? "Custom SEO"
              : "Auto";

            return (
              <div key={g.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{g.title}</div>
                  <div className="text-sm opacity-70">
                    /galleries/{g.slug} • {status}
                  </div>
                </div>
                <Link className="underline" href={`/admin/seo/gallery/${g.id}`}>
                  Edit
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
