// app/sitemap.ts
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/seo";
import { SeoEntityType, PageStatus } from "@prisma/client";

export const revalidate = 300;
export const runtime = "nodejs";

function abs(base: string, path: string) {
  return new URL(path, base).toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const s = await getSiteSettings();

  const baseUrl =
    (s as any)?.siteUrl ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  // --- GALLERIES ---
  const galleries = await prisma.gallery.findMany({
    select: {
      id: true,
      slug: true,
      createdAt: true,
      coverUrl: true,
      photos: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { url: true, createdAt: true },
      },
    },
  });

  const gallerySeo = await prisma.seoMeta.findMany({
    where: {
      entityType: SeoEntityType.GALLERY,
      entityId: { in: galleries.map((g) => g.id) },
    },
    select: { entityId: true, noindex: true },
  });

  const galleryNoindex = new Set(
    gallerySeo.filter((x) => x.noindex).map((x) => x.entityId)
  );

  // --- BLOG (PUBLISHED ONLY) ---
  const posts = await prisma.blogPage.findMany({
    where: { status: PageStatus.PUBLISHED },
    select: {
      id: true,
      slug: true,
      updatedAt: true,
      publishedAt: true,
      featureImage: true,
      heroImage: true,
    },
    orderBy: { publishedAt: "desc" },
  });

  const postSeo = await prisma.seoMeta.findMany({
    where: {
      entityType: SeoEntityType.POST,
      entityId: { in: posts.map((p) => p.id) },
    },
    select: { entityId: true, noindex: true },
  });

  const postNoindex = new Set(
    postSeo.filter((x) => x.noindex).map((x) => x.entityId)
  );

  const home: MetadataRoute.Sitemap[number] = {
    url: abs(baseUrl, "/"),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
  };

  const blogIndex: MetadataRoute.Sitemap[number] = {
    url: abs(baseUrl, "/blog"),
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  };

  const galleryItems: MetadataRoute.Sitemap = galleries
    .filter((g) => !galleryNoindex.has(g.id))
    .map((g): MetadataRoute.Sitemap[number] => {
      const lastModified = g.photos[0]?.createdAt ?? g.createdAt;
      const image = g.coverUrl ?? g.photos[0]?.url ?? undefined;

      return {
        url: abs(baseUrl, `/galleries/${g.slug}`),
        lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
        images: image ? [image] : undefined,
      };
    });

  const blogItems: MetadataRoute.Sitemap = posts
    .filter((p) => !postNoindex.has(p.id))
    .map((p): MetadataRoute.Sitemap[number] => {
      const lastModified = p.updatedAt ?? p.publishedAt ?? new Date();

      // If your featureImage/heroImage JSON contains { url: "..." }, this will pick it up.
      const featureUrl = (p.featureImage as any)?.url as string | undefined;
      const heroUrl = (p.heroImage as any)?.url as string | undefined;
      const image = featureUrl ?? heroUrl ?? undefined;

      return {
        url: abs(baseUrl, `/blog/${p.slug}`),
        lastModified,
        changeFrequency: "monthly",
        priority: 0.6,
        images: image ? [image] : undefined,
      };
    });

  return [home, blogIndex, ...galleryItems, ...blogItems];
}
