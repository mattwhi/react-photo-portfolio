import type { Metadata } from "next";
import { SeoEntityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

export const getSiteSettings = cache(async () => {
  // Prefer your seeded id
  const byMain = await prisma.siteSettings.findUnique({
    where: { id: "main" },
  });
  if (byMain) return byMain;

  // Fallback to "site" (if you ever used that)
  const bySite = await prisma.siteSettings.findUnique({
    where: { id: "site" },
  });
  if (bySite) return bySite;

  // Final fallback: first row (covers any custom id)
  const first = await prisma.siteSettings.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (first) return first;

  throw new Error("SiteSettings missing. Seed it first.");
});

export const getSeoMeta = cache(
  async (entityType: SeoEntityType, entityId: string) => {
    return prisma.seoMeta.findUnique({
      where: { entityType_entityId: { entityType, entityId } },
    });
  }
);

export function absoluteUrl(base: string, pathOrUrl: string) {
  try {
    // if already absolute
    return new URL(pathOrUrl).toString();
  } catch {
    return new URL(pathOrUrl, base).toString();
  }
}

export function buildMetadata(opts: {
  baseUrl: string;
  siteName: string;
  titleTemplate?: string;
  defaultDescription?: string | null;
  defaultOgImageUrl?: string | null;
  pathname: string; // e.g. `/galleries/${slug}`
  contentTitle?: string | null;
  contentDescription?: string | null;
  seo?: {
    title?: string | null;
    description?: string | null;
    canonicalUrl?: string | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogImageUrl?: string | null;
    twitterCard?: string | null;
    noindex?: boolean;
    nofollow?: boolean;
  } | null;
  globalNoindex?: boolean;
}): Metadata {
  const {
    baseUrl,
    siteName,
    pathname,
    contentTitle,
    contentDescription,
    defaultDescription,
    defaultOgImageUrl,
    seo,
    globalNoindex,
  } = opts;

  const title = seo?.title ?? contentTitle ?? siteName;
  const description =
    seo?.description ?? contentDescription ?? defaultDescription ?? undefined;

  const canonical = seo?.canonicalUrl
    ? absoluteUrl(baseUrl, seo.canonicalUrl)
    : absoluteUrl(baseUrl, pathname);

  const ogTitle = seo?.ogTitle ?? title;
  const ogDescription = seo?.ogDescription ?? description;
  const ogImage = seo?.ogImageUrl
    ? absoluteUrl(baseUrl, seo.ogImageUrl)
    : defaultOgImageUrl
    ? absoluteUrl(baseUrl, defaultOgImageUrl)
    : undefined;

  const noindex = Boolean(globalNoindex) || Boolean(seo?.noindex);
  const nofollow = Boolean(seo?.nofollow);

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: { canonical },
    robots: { index: !noindex, follow: !nofollow },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      siteName,
      type: "website",
      images: ogImage ? [{ url: ogImage, alt: ogTitle }] : undefined,
    },
    twitter: {
      card: (seo?.twitterCard as any) ?? "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
