import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";

export const dynamic = "force-dynamic";

const R2_BASE = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Website";

type Props = {
  params: Promise<{ slug: string }>;
};

const urlFromKey = (key?: string) => {
  const clean = String(key || "").replace(/^\/+/, "");
  return R2_BASE && clean ? `${R2_BASE}/${clean}` : "";
};

const absUrl = (p: string) => {
  if (!SITE_URL) return "";
  const clean = p.startsWith("/") ? p : `/${p}`;
  return `${SITE_URL}${clean}`;
};

// ... keep all your helper functions as-is ...

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  const page = await prisma.blogPage.findUnique({
    where: { slug },
    select: {
      title: true,
      metaTitle: true,
      metaDescription: true,
      heroImage: true,
      featureImage: true,
      tags: true,
      category: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      status: true,
    },
  });

  if (!page || page.status !== "PUBLISHED") return {};

  const hero = (page as any).heroImage ?? null;
  const feature = (page as any).featureImage ?? null;

  const imageSrc =
    feature?.url ||
    urlFromKey(feature?.key) ||
    hero?.url ||
    urlFromKey(hero?.key) ||
    "";

  const url = absUrl(`/blog/${slug}`);
  const published = page.publishedAt ?? page.createdAt;
  const modified = page.updatedAt ?? published;

  const tags = Array.isArray(page.tags) ? (page.tags as string[]) : [];

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
    alternates: url ? { canonical: url } : undefined,
    keywords: tags.length ? tags : undefined,
    openGraph: {
      type: "article",
      title: page.metaTitle || page.title,
      description: page.metaDescription || undefined,
      url: url || undefined,
      images: imageSrc ? [{ url: imageSrc }] : undefined,
    },
    twitter: {
      card: imageSrc ? "summary_large_image" : "summary",
      title: page.metaTitle || page.title,
      description: page.metaDescription || undefined,
      images: imageSrc ? [imageSrc] : undefined,
    },
    other: {
      "article:published_time": published.toISOString(),
      "article:modified_time": modified.toISOString(),
      ...(page.category ? { "article:section": page.category } : {}),
      ...(tags.length ? { "article:tag": tags.join(",") } : {}),
    },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;

  const page = await prisma.blogPage.findUnique({
    where: { slug },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });

  if (!page || page.status !== "PUBLISHED") return notFound();

  // ...keep the rest of your component exactly the same...
}
