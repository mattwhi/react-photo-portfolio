// app/galleries/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { SeoEntityType } from "@prisma/client";

import { PhotoCarousel } from "@/components/PhotoCarousel";
import { GlassCard } from "@/components/GlassCard";
import { GalleryLightboxGrid } from "@/components/GalleryLightboxGrid";
import { getSiteSettings } from "@/lib/siteSettings";

export const revalidate = 60; // ISR: refresh occasionally (optional)

type Props = {
  params: Promise<{ slug: string }>;
};

const getGalleryBySlug = cache(async (slug: string) => {
  return prisma.gallery.findUnique({
    where: { slug },
    include: { photos: { orderBy: { createdAt: "desc" } } },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const settings = await getSiteSettings();
  const gallery = await getGalleryBySlug(slug);
  if (!gallery) return {};

  const seo = await prisma.seoMeta.findUnique({
    where: {
      entityType_entityId: {
        entityType: SeoEntityType.GALLERY,
        entityId: gallery.id,
      },
    },
  });

  const siteName =
    (settings as any)?.siteName ||
    (settings as any)?.siteTitle ||
    "Photo Portfolio";

  const baseUrl =
    (settings as any)?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || undefined;

  const title = seo?.title ?? gallery.title;
  const description =
    seo?.description ??
    gallery.description ??
    (settings as any)?.defaultDescription ??
    "A modern photography gallery.";

  const canonical = seo?.canonicalUrl
    ? baseUrl
      ? new URL(seo.canonicalUrl, baseUrl).toString()
      : seo.canonicalUrl
    : baseUrl
    ? new URL(`/galleries/${gallery.slug}`, baseUrl).toString()
    : `/galleries/${gallery.slug}`;

  const ogImage =
    seo?.ogImageUrl ??
    gallery.coverUrl ??
    gallery.photos[0]?.url ??
    (settings as any)?.defaultOgImageUrl ??
    undefined;

  const globalNoindex = Boolean((settings as any)?.globalNoindex);
  const noindex = globalNoindex || Boolean(seo?.noindex);
  const nofollow = Boolean(seo?.nofollow);

  return {
    metadataBase: baseUrl ? new URL(baseUrl) : undefined,
    title: {
      default: title,
      template: (settings as any)?.titleTemplate || `%s | ${siteName}`,
    },
    description,
    alternates: { canonical },
    robots: { index: !noindex, follow: !nofollow },
    openGraph: {
      title: seo?.ogTitle ?? title,
      description: seo?.ogDescription ?? description,
      url: canonical,
      siteName,
      type: "website",
      images: ogImage
        ? [{ url: ogImage, alt: seo?.ogTitle ?? title }]
        : undefined,
    },
    twitter: {
      card: (seo?.twitterCard as any) ?? "summary_large_image",
      title: seo?.ogTitle ?? title,
      description: seo?.ogDescription ?? description,
      images: ogImage ? [ogImage] : undefined,
      site: (settings as any)?.twitterHandle || undefined,
    },
  };
}

export default async function GalleryPage({ params }: Props) {
  const { slug } = await params;

  const gallery = await getGalleryBySlug(slug);
  if (!gallery) return notFound();

  const settings = await getSiteSettings();

  // Pull optional JSON-LD override (if you’re using it)
  const seo = await prisma.seoMeta.findUnique({
    where: {
      entityType_entityId: {
        entityType: SeoEntityType.GALLERY,
        entityId: gallery.id,
      },
    },
    select: { jsonLd: true },
  });

  const baseUrl =
    (settings as any)?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "";

  const photos = gallery.photos.map((p) => ({
    id: p.id,
    url: p.url,
    title: p.title,
    description: p.description,
    width: p.width ?? undefined,
    height: p.height ?? undefined,
  }));

  const defaultJsonLd = baseUrl
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: gallery.title,
        description: gallery.description ?? undefined,
        url: `${baseUrl.replace(/\/$/, "")}/galleries/${gallery.slug}`,
        hasPart: gallery.photos.slice(0, 25).map((p) => ({
          "@type": "ImageObject",
          contentUrl: p.url,
          name: p.title ?? undefined,
          description: p.description ?? undefined,
          width: p.width ?? undefined,
          height: p.height ?? undefined,
        })),
      }
    : null;

  const jsonLdToRender = (seo?.jsonLd as any) ?? defaultJsonLd;

  return (
    <div className="relative space-y-6">
      {/* JSON-LD (either admin override or default) */}
      {jsonLdToRender ? (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdToRender) }}
        />
      ) : null}

      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 -left-28 h-80 w-80 rounded-full bg-fuchsia-400/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl"
      />

      <GlassCard className="p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {gallery.title}
            </h1>
            {gallery.description && (
              <p className="mt-1 text-sm muted">{gallery.description}</p>
            )}
          </div>

          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[rgb(var(--glass-border))] bg-white/10 px-4 py-2 text-xs font-semibold transition hover:hover-surface active:scale-[0.99]"
          >
            <span aria-hidden>←</span> Back to galleries
          </Link>
        </div>
      </GlassCard>

      <PhotoCarousel photos={photos} height={520} />
      <GalleryLightboxGrid photos={photos} />
    </div>
  );
}
