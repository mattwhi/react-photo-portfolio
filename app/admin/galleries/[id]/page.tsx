import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";
import { GalleryMediaTools } from "./GalleryMediaTools";
import { DeletePhotoButton } from "@/components/media/DeletePhotoButton";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminGalleryDetail({ params }: Props) {
  const { id } = await params;

  const gallery = await prisma.gallery.findUnique({
    where: { id },
    include: { photos: { orderBy: { createdAt: "desc" } } },
  });

  if (!gallery) return notFound();

  const photoCount = gallery.photos.length;

  return (
    <div className="relative space-y-6">
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-fuchsia-400/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl"
      />

      <GlassCard className="p-6 mb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-white">
              {gallery.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                /g/{gallery.slug}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                {photoCount} photo{photoCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`/g/${gallery.slug}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
            >
              View live →
            </a>

            <form
              action={`/api/galleries/${gallery.id}/cover-latest`}
              method="post"
            >
              <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10">
                Use latest as cover
              </button>
            </form>

            <a
              href="/admin/galleries"
              className="rounded-full bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/15"
            >
              ← Back
            </a>
          </div>
        </div>

        {/* Cover preview */}
        {gallery.coverUrl ? (
          <div className="mt-6">
            <div className="mb-2 text-xs text-white/60">Current cover</div>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gallery.coverUrl}
                className="h-52 w-full object-cover"
                alt="Cover"
              />
            </div>
          </div>
        ) : null}

        {/* Upload area */}

        <GalleryMediaTools galleryId={gallery.id} />
      </GlassCard>

      {/* Photos grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {gallery.photos.map((p) => (
          <div
            key={p.id}
            className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
          >
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                className="h-56 w-full object-cover"
                alt={p.title ?? "Photo"}
              />

              {/* Top actions overlay */}
              <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
                <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/80 backdrop-blur">
                  {p.title || "Untitled"}
                </span>

                <form
                  action={`/api/galleries/${gallery.id}/cover`}
                  method="post"
                >
                  <input type="hidden" name="coverUrl" value={p.url} />
                  <button className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/80 hover:bg-black/50 backdrop-blur">
                    Set cover
                  </button>
                </form>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Collapsible editor (no JS needed) */}
              <details className="group">
                <summary className="cursor-pointer list-none rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10">
                  <span className="mr-2 inline-block transition group-open:rotate-90">
                    ›
                  </span>
                  Edit details
                </summary>

                <div className="mt-3">
                  <form
                    action={`/api/photos/${p.id}/update`}
                    method="post"
                    className="space-y-2"
                  >
                    <input
                      name="title"
                      defaultValue={p.title ?? ""}
                      placeholder="Title"
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80 outline-none focus:border-white/20"
                    />
                    <input
                      name="description"
                      defaultValue={p.description ?? ""}
                      placeholder="Description"
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80 outline-none focus:border-white/20"
                    />
                    <button className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15">
                      Save
                    </button>
                    <DeletePhotoButton photoId={p.id} />
                  </form>
                </div>
              </details>

              <div className="flex items-center justify-between text-xs text-white/50">
                <span className="truncate">{p.url}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {gallery.photos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center text-white/70">
          No photos yet — use “Add photos” above to upload into this gallery.
        </div>
      ) : null}
    </div>
  );
}
