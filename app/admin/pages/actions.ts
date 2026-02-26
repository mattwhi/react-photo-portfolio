"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function revalidatePublicByPageId(pageId: string) {
  const page = await prisma.blogPage.findUnique({
    where: { id: pageId },
    select: { slug: true },
  });

  if (!page?.slug) return;

  revalidatePath(`/blog/${page.slug}`);
  revalidatePath(`/blog/preview/${page.slug}`);
  revalidatePath(`/blog`);
}

type PageStatus = "DRAFT" | "PUBLISHED";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function ensureUniqueSlug(base: string, excludeId?: string) {
  let slug = base || "page";
  let i = 0;

  while (true) {
    const existing = await prisma.blogPage.findFirst({
      where: excludeId ? { slug, NOT: { id: excludeId } } : { slug },
      select: { id: true },
    });

    if (!existing) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
}

function safeJsonParse<T>(value: FormDataEntryValue | null): T | null {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

function clampNumber(n: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 30); // guardrail
}

/**
 * BLOG PAGE CRUD
 */
export async function createBlogPageAction(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();

  const metaTitleRaw = String(formData.get("metaTitle") || "").trim();
  const metaDescriptionRaw = String(
    formData.get("metaDescription") || ""
  ).trim();

  const metaTitle = metaTitleRaw.slice(0, 255);
  const metaDescription = metaDescriptionRaw.slice(0, 2000);

  const base = slugify(rawSlug || title);
  const slug = await ensureUniqueSlug(base);

  const authorName = String(formData.get("authorName") || "")
    .trim()
    .slice(0, 120);
  const category = String(formData.get("category") || "")
    .trim()
    .slice(0, 120);
  const tagsCsv = String(formData.get("tags") || "").trim();
  const tags = parseTags(tagsCsv);

  const page = await prisma.blogPage.create({
    data: {
      title,
      slug,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      status: "DRAFT",
      authorName: authorName || null,
      category: category || null,
      tags: tags.length ? tags : [], // Changed null to an empty array
    },
    select: { id: true },
  });

  revalidatePath("/admin/pages");
  return { id: page.id };
}

export async function updateBlogPageAction(formData: FormData) {
  const id = String(formData.get("id"));
  const title = String(formData.get("title") || "").trim();
  const slugInput = slugify(String(formData.get("slug") || "").trim());

  const metaTitleRaw = String(formData.get("metaTitle") || "").trim();
  const metaDescriptionRaw = String(
    formData.get("metaDescription") || ""
  ).trim();

  const metaTitle = metaTitleRaw.slice(0, 255);
  const metaDescription = metaDescriptionRaw.slice(0, 2000);

  const status = String(formData.get("status") || "DRAFT") as PageStatus;

  // Optional fields (only if your model has these Json columns)
  const heroImage = safeJsonParse<any>(formData.get("heroImageJson"));
  const featureImage = safeJsonParse<any>(formData.get("featureImageJson"));

  const finalSlug = await ensureUniqueSlug(slugInput, id);

  const authorName = String(formData.get("authorName") || "")
    .trim()
    .slice(0, 120);
  const category = String(formData.get("category") || "")
    .trim()
    .slice(0, 120);
  const tagsCsv = String(formData.get("tags") || "").trim();
  const tags = parseTags(tagsCsv);

  await prisma.blogPage.update({
    where: { id },
    data: {
      title,
      slug: finalSlug,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      // if these columns don't exist in your schema yet, remove the next 2 lines
      heroImage: heroImage ?? undefined,
      featureImage: featureImage ?? undefined,
      authorName: authorName || null,
      category: category || null,
      tags: tags.length ? tags : null,
    } as any,
  });

  revalidatePath(`/admin/pages/${id}`);
  revalidatePath(`/blog/${finalSlug}`);
  revalidatePath(`/blog/preview/${finalSlug}`);
  revalidatePath(`/blog`);
}

/**
 * SECTIONS
 */
export async function addSectionAction(pageId: string, type: string) {
  const max = await prisma.blogSection.aggregate({
    where: { pageId },
    _max: { sortOrder: true },
  });

  const nextOrder = (max._max.sortOrder ?? 0) + 1;

  const defaultsByType: Record<string, any> = {
    H1: { text: "Your H1 title" },
    RICH_TEXT: { html: "<p>Write your content…</p>" },

    TWO_COL_IMAGE_TEXT: {
      align: "imageLeft",
      image: { photoId: "", key: "", url: "", alt: "", title: "" },
      html: "<p>Write your content…</p>",
    },

    IMAGE: { photoId: "", key: "", url: "", alt: "", title: "", caption: "" },

    DIVIDER: { style: "line" }, // line | space
    SPACER: { height: 24 }, // only works if SectionType includes SPACER
  };

  const section = await prisma.blogSection.create({
    data: {
      pageId,
      type: type as any,
      sortOrder: nextOrder,
      data: defaultsByType[type] ?? {},
    },
    select: { id: true },
  });

  revalidatePath(`/admin/pages/${pageId}`);
  await revalidatePublicByPageId(pageId);

  return { id: section.id };
}

export async function updateSectionAction(formData: FormData) {
  const id = String(formData.get("id"));
  const pageId = String(formData.get("pageId"));
  const type = String(formData.get("type"));

  let data: any = {};

  if (type === "H1") {
    data = { text: String(formData.get("text") || "") };
  }

  if (type === "RICH_TEXT") {
    data = { html: String(formData.get("html") || "") };
  }

  if (type === "TWO_COL_IMAGE_TEXT") {
    data = {
      align: String(formData.get("align") || "imageLeft"),
      image: {
        photoId: String(formData.get("imagePhotoId") || ""),
        key: String(formData.get("imageKey") || ""),
        url: String(formData.get("imageUrl") || ""),
        alt: String(formData.get("imageAlt") || ""),
        title: String(formData.get("imageTitle") || ""),
      },
      html: String(formData.get("html") || ""),
    };
  }

  if (type === "IMAGE") {
    data = {
      photoId: String(formData.get("photoId") || ""),
      key: String(formData.get("key") || ""),
      url: String(formData.get("url") || ""),
      alt: String(formData.get("alt") || ""),
      title: String(formData.get("title") || ""),
      caption: String(formData.get("caption") || ""),
    };
  }

  if (type === "DIVIDER") {
    data = { style: String(formData.get("style") || "line") };
  }

  if (type === "SPACER") {
    const height = clampNumber(Number(formData.get("height")), 0, 500, 24);
    data = { height };
  }

  await prisma.blogSection.update({
    where: { id },
    data: { data },
  });

  revalidatePath(`/admin/pages/${pageId}`);
  await revalidatePublicByPageId(pageId);
}

export async function deleteSectionAction(sectionId: string, pageId: string) {
  await prisma.blogSection.delete({ where: { id: sectionId } });
  revalidatePath(`/admin/pages/${pageId}`);
  await revalidatePublicByPageId(pageId);
}

/**
 * Arrow-button reordering (↑↓)
 * ✅ This is the export your TS error is complaining about.
 */
export async function moveSectionAction(
  sectionId: string,
  pageId: string,
  direction: "up" | "down"
) {
  const current = await prisma.blogSection.findUnique({
    where: { id: sectionId },
    select: { id: true, sortOrder: true, pageId: true },
  });

  if (!current || current.pageId !== pageId) return;

  const neighbor = await prisma.blogSection.findFirst({
    where: {
      pageId,
      sortOrder:
        direction === "up"
          ? { lt: current.sortOrder }
          : { gt: current.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    select: { id: true, sortOrder: true },
  });

  if (!neighbor) return;

  await prisma.$transaction([
    prisma.blogSection.update({
      where: { id: current.id },
      data: { sortOrder: neighbor.sortOrder },
    }),
    prisma.blogSection.update({
      where: { id: neighbor.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);

  revalidatePath(`/admin/pages/${pageId}`);
  await revalidatePublicByPageId(pageId);
}

/**
 * Drag & Drop reorder (if you add dnd-kit later)
 */
export async function reorderSectionsAction(
  pageId: string,
  orderedIds: string[]
) {
  await prisma.$transaction(
    orderedIds.map((id, idx) =>
      prisma.blogSection.update({ where: { id }, data: { sortOrder: idx + 1 } })
    )
  );
  revalidatePath(`/admin/pages/${pageId}`);
  await revalidatePublicByPageId(pageId);
}
