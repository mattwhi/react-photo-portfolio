import Link from "next/link";
import { prisma } from "@/lib/prisma";

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

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function formatDateTime(dt: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(dt);
}

function buildExcerpt(metaDescription: string | null, sections: any[] | null) {
  if (metaDescription?.trim()) return firstNWords(metaDescription.trim(), 50);

  const chunks: string[] = [];
  for (const s of sections || []) {
    if (s.type === "H1") chunks.push(String(s.data?.text || ""));
    if (s.type === "RICH_TEXT")
      chunks.push(stripHtml(String(s.data?.html || "")));
    if (s.type === "TWO_COL_IMAGE_TEXT")
      chunks.push(stripHtml(String(s.data?.html || "")));
    if (chunks.join(" ").split(/\s+/).filter(Boolean).length >= 60) break;
  }

  const text = chunks.join(" ").trim();
  return firstNWords(text || "Read the latest post.", 50);
}

export async function LatestBlogPosts({
  title = "Latest from the blog",
  showViewAll = true,
}: {
  title?: string;
  showViewAll?: boolean;
}) {
  const posts = await prisma.blogPage.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 3,
    select: {
      id: true,
      title: true,
      slug: true,
      metaDescription: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      featureImage: true,
      heroImage: true,
      // only a little content for excerpt fallback (cheap)
      sections: {
        orderBy: { sortOrder: "asc" },
        take: 3,
        select: { type: true, data: true },
      },
    },
  });

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-xl font-semibold text-white m-5">{title}</h2>

        {showViewAll ? (
          <Link
            href="/blog"
            className="text-sm text-white/70 hover:text-white underline underline-offset-4"
          >
            View all
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((p) => {
          const published = p.publishedAt ?? p.createdAt;
          const feature = (p.featureImage as unknown as ImageJson) ?? null;
          const hero = (p.heroImage as unknown as ImageJson) ?? null;

          const imgSrc =
            feature?.url ||
            urlFromKey(feature?.key) ||
            hero?.url ||
            urlFromKey(hero?.key) ||
            "";

          const excerpt = buildExcerpt(p.metaDescription, p.sections as any[]);
          const readMins = readingTimeMinsFromText(excerpt);

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
                  alt={feature?.alt || hero?.alt || p.title}
                  className="h-44 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-44 w-full bg-linear-to-br from-white/10 to-white/5" />
              )}

              <div className="p-5 space-y-3">
                <div className="space-y-1">
                  <div className="text-sm text-white/60">
                    {formatDateTime(published)} • {readMins} min read
                  </div>
                  <h3 className="text-lg font-semibold text-white group-hover:underline underline-offset-4">
                    {p.title}
                  </h3>
                </div>

                <p className="text-sm text-white/70 leading-relaxed">
                  {excerpt}
                </p>

                <div className="text-sm text-white/70 group-hover:text-white">
                  Read more →
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
