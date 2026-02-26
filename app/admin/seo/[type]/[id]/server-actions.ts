"use server";

import { prisma } from "@/lib/prisma";
import { SeoEntityType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { SEO_PAGES } from "@/lib/seoPages";

export async function saveSeoMetaAction(
  entityType: SeoEntityType,
  entityId: string,
  form: any
) {
  let jsonLd: any = null;
  if (form.jsonLd?.trim()) jsonLd = JSON.parse(form.jsonLd);

  await prisma.seoMeta.upsert({
    where: { entityType_entityId: { entityType, entityId } },
    update: {
      title: form.title || null,
      description: form.description || null,
      canonicalUrl: form.canonicalUrl || null,
      ogTitle: form.ogTitle || null,
      ogDescription: form.ogDescription || null,
      ogImageUrl: form.ogImageUrl || null,
      twitterCard: form.twitterCard || null,
      noindex: Boolean(form.noindex),
      nofollow: Boolean(form.nofollow),
      jsonLd,
    },
    create: {
      entityType,
      entityId,
      title: form.title || null,
      description: form.description || null,
      canonicalUrl: form.canonicalUrl || null,
      ogTitle: form.ogTitle || null,
      ogDescription: form.ogDescription || null,
      ogImageUrl: form.ogImageUrl || null,
      twitterCard: form.twitterCard || null,
      noindex: Boolean(form.noindex),
      nofollow: Boolean(form.nofollow),
      jsonLd,
    },
  });

  // Always refresh sitemap
  revalidatePath("/sitemap.xml");

  if (entityType === "GALLERY") {
    const g = await prisma.gallery.findUnique({
      where: { id: entityId },
      select: { slug: true },
    });
    if (g?.slug) revalidatePath(`/galleries/${g.slug}`);
    return;
  }

  if (entityType === "PAGE") {
    const page = SEO_PAGES.find((p) => p.id === entityId);
    if (page) revalidatePath(page.path);
    return;
  }
}
