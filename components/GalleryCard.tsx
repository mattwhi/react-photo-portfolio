import Link from "next/link";
import Image from "next/image";
import { GlassCard } from "@/components/GlassCard";
import { PhotoCarousel, type CarouselPhoto } from "@/components/PhotoCarousel";

export function GalleryCard({
  slug,
  title,
  description,
  coverUrl,
  previewPhotos,
}: {
  slug: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  previewPhotos: CarouselPhoto[];
}) {
  const hasCarousel = previewPhotos?.length > 0;
  const hasCoverFallback = !hasCarousel && !!coverUrl;

  return (
    <GlassCard className="overflow-hidden" interactive>
      {/* Header */}
      <div className="relative p-5">
        {/* soft divider sheen */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/25"
        />

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm muted line-clamp-2">{description}</p>
            )}
          </div>

          <Link
            href={`/g/${slug}`}
            className="shrink-0 rounded-full border border-[rgb(var(--glass-border))] bg-white/10 px-4 py-2 text-xs font-semibold transition hover:hover-surface active:scale-[0.99]"
          >
            View gallery →
          </Link>
        </div>
      </div>

      {/* Media */}
      <div className="px-5 pb-5">
        {hasCarousel ? (
          <PhotoCarousel photos={previewPhotos} height={320} />
        ) : hasCoverFallback ? (
          <div className="relative h-64 overflow-hidden rounded-3xl">
            <Image
              src={coverUrl as string}
              alt={`${title} cover`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 520px"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/25 to-transparent" />
          </div>
        ) : (
          <div className="glass-subtle flex h-64 items-center justify-center rounded-3xl border border-[rgb(var(--glass-border))] bg-white/10">
            <p className="text-sm muted">No photos yet.</p>
          </div>
        )}

        {/* Footer pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[rgb(var(--glass-border))] bg-white/10 px-3 py-1 text-xs font-medium">
            /g/{slug}
          </span>

          {hasCarousel ? (
            <span className="rounded-full border border-[rgb(var(--glass-border))] bg-white/10 px-3 py-1 text-xs font-medium muted">
              {previewPhotos.length} preview
            </span>
          ) : (
            <span className="rounded-full border border-[rgb(var(--glass-border))] bg-white/10 px-3 py-1 text-xs font-medium muted">
              Coming soon
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
