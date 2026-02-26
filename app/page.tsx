// app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { SeoEntityType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getSiteSettings } from "@/lib/seo"; // use the one you fixed to find id "main"/fallback

import { GalleryCard } from "@/components/GalleryCard";
import { HeroCarousel } from "@/components/HeroCarousel";
import { GlassCard } from "@/components/GlassCard";
import { LatestBlogPosts } from "@/components/blog/LatestBlogPosts";

export const runtime = "nodejs";

const getHomeSeo = cache(async () => {
  return prisma.seoMeta.findUnique({
    where: {
      entityType_entityId: {
        entityType: SeoEntityType.PAGE,
        entityId: "home",
      },
    },
  });
});

export async function generateMetadata(): Promise<Metadata> {
  const [settings, seo] = await Promise.all([getSiteSettings(), getHomeSeo()]);

  const siteName =
    (settings as any)?.siteName ||
    (settings as any)?.siteTitle ||
    "Photo Portfolio";

  const baseUrl: string =
    (settings as any)?.siteUrl ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const title = seo?.title ?? (settings as any)?.siteTitle ?? siteName;
  const description =
    seo?.description ??
    (settings as any)?.defaultDescription ??
    "A minimal, modern photo portfolio built with React + Next.js.";

  const canonical = seo?.canonicalUrl
    ? new URL(seo.canonicalUrl, baseUrl).toString()
    : new URL("/", baseUrl).toString();

  const ogImage =
    seo?.ogImageUrl ?? (settings as any)?.defaultOgImageUrl ?? undefined;

  const globalNoindex = Boolean((settings as any)?.globalNoindex);
  const noindex = globalNoindex || Boolean(seo?.noindex);
  const nofollow = Boolean(seo?.nofollow);

  return {
    metadataBase: new URL(baseUrl),
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

export default async function HomePage() {
  const [session, settings, seo, heroGalleries, galleries] = await Promise.all([
    getSession(),
    getSiteSettings(),
    getHomeSeo(),
    prisma.gallery.findMany({
      where: { showInHero: true },
      orderBy: [{ heroOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        coverUrl: true,
        photos: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { url: true },
        },
      },
      take: 8,
    }),
    prisma.gallery.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        coverUrl: true,
        photos: {
          orderBy: { createdAt: "desc" },
          take: 6,
          select: { id: true, url: true, title: true, description: true },
        },
      },
    }),
  ]);

  const baseUrl: string =
    (settings as any)?.siteUrl ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  type HeroSlide = {
    slug: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
  };

  type HeroSlideWithImage = Omit<HeroSlide, "imageUrl"> & { imageUrl: string };

  const heroSlides: HeroSlideWithImage[] = heroGalleries
    .map<HeroSlide>((g) => ({
      slug: g.slug,
      title: g.title,
      description: g.description ?? null,
      imageUrl: g.coverUrl ?? g.photos[0]?.url ?? null,
    }))
    .filter(
      (s): s is HeroSlideWithImage =>
        typeof s.imageUrl === "string" && s.imageUrl.length > 0
    );

  // JSON-LD: use admin override if present, otherwise a sensible default
  const defaultJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name:
      (settings as any)?.siteTitle ||
      (settings as any)?.siteName ||
      "Photo Portfolio",
    url: new URL("/", baseUrl).toString(),
    hasPart: galleries.slice(0, 25).map((g) => ({
      "@type": "CollectionPage",
      name: g.title,
      url: new URL(`/galleries/${g.slug}`, baseUrl).toString(),
    })),
  };

  const jsonLdToRender = (seo?.jsonLd as any) ?? defaultJsonLd;

  return (
    <div className="relative space-y-8">
      {/* JSON-LD */}
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

      {/* HERO */}
      {!!heroSlides.length && (
        <div className="space-y-2">
          <HeroCarousel slides={heroSlides} />
        </div>
      )}

      {/* Signed-in admin CTA */}
      {session && (
        <GlassCard className="p-7 mt-5 mb-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Galleries
              </h1>
              <p className="mt-1 text-sm muted">
                Glassy, clean portfolio — galleries update automatically from
                admin uploads.
              </p>
            </div>

            <Link
              href="/admin/galleries"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-[rgb(var(--glass-border))] bg-white/10 px-4 py-2 text-xs font-semibold transition hover:hover-surface active:scale-[0.99]"
            >
              Manage portfolio <span aria-hidden>→</span>
            </Link>
          </div>
        </GlassCard>
      )}

      {/* Grid */}
      <section className="grid gap-6 md:grid-cols-2">
        {galleries.map((g) => (
          <GalleryCard
            key={g.id}
            slug={g.slug}
            title={g.title}
            description={g.description}
            coverUrl={g.coverUrl}
            previewPhotos={g.photos.map((p) => ({
              id: p.id,
              url: p.url,
              title: p.title,
              description: p.description,
            }))}
          />
        ))}
      </section>

      {!galleries.length && (
        <GlassCard variant="subtle" className="p-6">
          <p className="text-sm muted">No galleries yet.</p>
        </GlassCard>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <LatestBlogPosts showViewAll />
      </section>
    </div>
  );
}
