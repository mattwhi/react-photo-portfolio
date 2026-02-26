import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";

export const dynamic = "force-dynamic";

const R2_BASE = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Website";

const urlFromKey = (key?: string) => {
  const clean = String(key || "").replace(/^\/+/, "");
  return R2_BASE && clean ? `${R2_BASE}/${clean}` : "";
};

const absUrl = (path: string) => {
  if (!SITE_URL) return "";
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
};

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCountFromSections(sections: any[]) {
  const chunks: string[] = [];
  for (const s of sections) {
    if (s.type === "H1") chunks.push(String(s.data?.text || ""));
    if (s.type === "RICH_TEXT")
      chunks.push(stripHtml(String(s.data?.html || "")));
    if (s.type === "TWO_COL_IMAGE_TEXT")
      chunks.push(stripHtml(String(s.data?.html || "")));
    if (s.type === "IMAGE") chunks.push(String(s.data?.caption || ""));
  }
  const text = chunks.join(" ").trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function readingTimeMinutes(words: number, wpm = 220) {
  return Math.max(1, Math.ceil((words || 1) / wpm));
}

function formatDateTime(dt: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(dt);
}

const iso = (dt: Date) => dt.toISOString();

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const page = await prisma.blogPage.findUnique({
    where: { slug: params.slug },
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

  const url = absUrl(`/blog/${params.slug}`);
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
      "article:published_time": iso(published),
      "article:modified_time": iso(modified),
      ...(page.category ? { "article:section": page.category } : {}),
      ...(tags.length ? { "article:tag": tags.join(",") } : {}),
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const page = await prisma.blogPage.findUnique({
    where: { slug: params.slug },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });

  if (!page || page.status !== "PUBLISHED") return notFound();

  const hero = (page as any).heroImage ?? null;
  const heroSrc: string = hero?.url || urlFromKey(hero?.key);

  const published = page.publishedAt ?? page.createdAt;
  const modified = page.updatedAt ?? published;

  const words = wordCountFromSections(page.sections as any[]);
  const readMins = readingTimeMinutes(words);

  const canonical = absUrl(`/blog/${page.slug}`);
  const tags = Array.isArray((page as any).tags)
    ? ((page as any).tags as string[])
    : [];
  const category = (page as any).category || "";
  const authorName = (page as any).authorName || "";

  const imageForSchema =
    heroSrc ||
    (page as any).featureImage?.url ||
    urlFromKey((page as any).featureImage?.key) ||
    "";

  // BlogPosting JSON-LD
  const blogPosting: any = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: page.title,
    description: page.metaDescription || undefined,
    datePublished: iso(published),
    dateModified: iso(modified),
    wordCount: words || undefined,
    timeRequired: `PT${readMins}M`,
    inLanguage: "en-GB",
    isAccessibleForFree: true,
    mainEntityOfPage: canonical
      ? { "@type": "WebPage", "@id": canonical }
      : undefined,
    image: imageForSchema ? [imageForSchema] : undefined,
    ...(authorName ? { author: { "@type": "Person", name: authorName } } : {}),
    ...(category ? { articleSection: category } : {}),
    ...(tags.length ? { keywords: tags.join(", ") } : {}),
    publisher: SITE_NAME
      ? { "@type": "Organization", name: SITE_NAME }
      : undefined,
  };
  Object.keys(blogPosting).forEach(
    (k) => blogPosting[k] === undefined && delete blogPosting[k]
  );

  // BreadcrumbList JSON-LD
  const breadcrumbs: any = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absUrl("/") },
      { "@type": "ListItem", position: 2, name: "Blog", item: absUrl("/blog") },
      {
        "@type": "ListItem",
        position: 3,
        name: page.title,
        item: canonical || undefined,
      },
    ].filter((x) => x.item),
  };

  return (
    <article className="mx-auto max-w-6xl space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPosting) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      {/* HERO */}
      {heroSrc ? (
        <header className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroSrc}
              alt={hero?.alt || ""}
              title={hero?.title || ""}
              className="h-85 w-full object-cover"
            />
          </div>
        </header>
      ) : null}

      {/* Visible “rich” meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/60">
        <div>
          <span className="text-white/70">Published:</span>{" "}
          <time dateTime={iso(published)}>{formatDateTime(published)}</time>
        </div>

        {iso(modified) !== iso(published) ? (
          <div>
            <span className="text-white/70">Updated:</span>{" "}
            <time dateTime={iso(modified)}>{formatDateTime(modified)}</time>
          </div>
        ) : null}

        {authorName ? (
          <div>
            <span className="text-white/70">Author:</span> {authorName}
          </div>
        ) : null}

        {category ? (
          <div>
            <span className="text-white/70">Category:</span> {category}
          </div>
        ) : null}

        <div>
          <span className="text-white/70">Read:</span> {readMins} min
        </div>

        <div>
          <span className="text-white/70">Words:</span> {words}
        </div>
      </div>

      {/* Tags */}
      {tags.length ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
            >
              #{t}
            </span>
          ))}
        </div>
      ) : null}

      {/* SECTIONS */}
      {page.sections.map((s) => {
        if (s.type === "H1") {
          return (
            <h1 key={s.id} className="text-4xl font-semibold">
              {(s.data as any)?.text}
            </h1>
          );
        }

        if (s.type === "RICH_TEXT") {
          const html = sanitizeHtml(((s.data as any)?.html ?? "") as string);
          return (
            <div
              key={s.id}
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        if (s.type === "TWO_COL_IMAGE_TEXT") {
          const d = s.data as any;
          const imageFirst = d?.align !== "imageRight";
          const html = sanitizeHtml(d?.html ?? "");
          const img = d?.image ?? {};
          const imgSrc = img.url || urlFromKey(img.key);

          const media = imgSrc ? (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc}
                alt={img.alt || ""}
                title={img.title || ""}
                className="h-auto w-full object-cover"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-white/60">
              No image set
            </div>
          );

          const text = (
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );

          return (
            <section
              key={s.id}
              className="grid gap-6 md:grid-cols-2 md:items-start"
            >
              {imageFirst ? (
                <>
                  {media}
                  {text}
                </>
              ) : (
                <>
                  {text}
                  {media}
                </>
              )}
            </section>
          );
        }

        if (s.type === "IMAGE") {
          const d = s.data as any;
          const src = d?.url || urlFromKey(d?.key);
          if (!src) return null;

          return (
            <figure key={s.id} className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={d.alt || ""}
                  title={d.title || ""}
                  className="h-auto w-full object-cover"
                />
              </div>
              {d.caption && (
                <figcaption className="text-sm text-white/60">
                  {d.caption}
                </figcaption>
              )}
            </figure>
          );
        }

        if (s.type === "DIVIDER") {
          const style = (s.data as any)?.style ?? "line";
          return style === "space" ? (
            <div key={s.id} className="h-6" />
          ) : (
            <hr key={s.id} className="border-white/10" />
          );
        }

        if (s.type === "SPACER") {
          const h = Number((s.data as any)?.height ?? 24);
          return (
            <div key={s.id} style={{ height: Number.isFinite(h) ? h : 24 }} />
          );
        }

        return null;
      })}
    </article>
  );
}
