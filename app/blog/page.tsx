import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ImageJson = {
  url?: string;
  key?: string;
  alt?: string;
  title?: string;
} | null;

const R2_BASE = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
const urlFromKey = (key?: string) => {
  const clean = String(key || "").replace(/^\/+/, "");
  return R2_BASE && clean ? `${R2_BASE}/${clean}` : "";
};

function formatDateTime(dt: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(dt);
}

function firstNWords(text: string, n = 50) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= n) return words.join(" ");
  return `${words.slice(0, n).join(" ")}…`;
}

function readingTimeMinsFromText(text: string, wpm = 220) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wpm));
}

export default async function BlogIndex() {
  const pages = await prisma.blogPage.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      title: true,
      slug: true,
      metaDescription: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      featureImage: true, // ✅ add this
      heroImage: true, // ✅ add this (fallback)
      // These may not exist on your model yet — so we fetch nothing extra
      // and read them from (p as any) if they exist.
      // If they DO exist and you want strict typing, add them to select.
    },
  });

  return (
    <div className="mx-auto max-w-400 space-y-6">
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-3xl font-semibold m-5">Blog</h1>
        <div className="text-sm text-white/60">{pages.length} posts</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((p) => {
          const published = p.publishedAt ?? p.createdAt;
          const excerpt = firstNWords((p.metaDescription || "").trim(), 50);
          const readMins = readingTimeMinsFromText(excerpt || p.title);

          // Pull feature/hero images if you already have them (Json columns)
          const feature = p.featureImage as ImageJson | null;
          const hero = p.heroImage as ImageJson | null;

          const imgSrc =
            feature?.url ||
            urlFromKey(feature?.key) ||
            hero?.url ||
            urlFromKey(hero?.key) ||
            "";

          const alt = feature?.alt || hero?.alt || p.title;

          return (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              {/* Image */}
              {imgSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgSrc}
                  alt={alt}
                  className="h-44 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-44 w-full bg-linear-to-br from-white/10 to-white/5" />
              )}

              <div className="p-5 space-y-3">
                {/* Meta row */}
                <div className="text-xs text-white/60">
                  <time dateTime={published.toISOString()}>
                    {formatDateTime(published)}
                  </time>
                  {"  "}•{"  "}
                  {readMins} min read
                </div>

                {/* Title */}
                <h2 className="text-lg font-semibold text-white group-hover:underline underline-offset-4">
                  {p.title}
                </h2>

                {/* Excerpt */}
                {excerpt ? (
                  <p className="text-sm text-white/70 leading-relaxed">
                    {excerpt}
                  </p>
                ) : (
                  <p className="text-sm text-white/60 leading-relaxed">
                    Read the full post →
                  </p>
                )}

                <div className="text-sm text-white/70 group-hover:text-white">
                  Read more →
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
