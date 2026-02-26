import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/GlassCard";

export default async function AdminGalleriesPage() {
  const galleries = await prisma.gallery.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { photos: true } } },
  });

  const totalPhotos = galleries.reduce(
    (acc, g) => acc + (g._count?.photos ?? 0),
    0
  );

  return (
    <div className="relative space-y-6">
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 -left-28 h-80 w-80 rounded-full bg-fuchsia-400/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-cyan-400/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl"
      />

      {/* Header + Create */}
      <GlassCard className="p-6 md:p-7 mb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Galleries
            </h1>
            <p className="mt-1 text-sm text-zinc-700/70 dark:text-white/60">
              Create new galleries (Landscape, Street, Portrait…) — homepage
              updates automatically.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge>{galleries.length} galleries</Badge>
            <Badge>{totalPhotos} photos</Badge>
          </div>
        </div>

        <form
          action="/api/galleries"
          method="post"
          className="mt-6 grid gap-3 md:grid-cols-3"
        >
          <Input
            name="title"
            placeholder="Gallery title (e.g. Street)"
            required
          />
          <Input
            name="description"
            placeholder="Short description (optional)"
            className="md:col-span-2"
          />
          <button className="md:col-span-3 md:w-fit rounded-2xl bg-linear-to-r from-fuchsia-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110 active:scale-[0.99]">
            Create gallery
          </button>
        </form>
      </GlassCard>

      {/* List */}
      <div className="grid gap-4">
        {galleries.map((g) => {
          const showInHero = Boolean((g as any).showInHero);
          const heroOrder = ((g as any).heroOrder ?? 0) as number;

          return (
            <GlassCard key={g.id} className="p-5">
              <div className="flex flex-col gap-4">
                {/* Top row */}
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
                        {g.title}
                      </div>

                      <Badge size="sm">/g/{g.slug}</Badge>
                      <Badge size="sm">{g._count.photos} photos</Badge>

                      {g.coverUrl ? (
                        <Badge size="sm" tone="good">
                          Cover set
                        </Badge>
                      ) : (
                        <Badge size="sm" tone="muted">
                          No cover
                        </Badge>
                      )}

                      {showInHero && (
                        <Badge size="sm" tone="accent">
                          Hero • {heroOrder}
                        </Badge>
                      )}
                    </div>

                    {g.description && (
                      <p className="mt-2 text-sm text-zinc-700/70 dark:text-white/60">
                        {g.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={`/g/${g.slug}`} className={pill()}>
                      View
                    </a>
                    <a href={`/admin/galleries/${g.id}`} className={pill()}>
                      Manage photos
                    </a>

                    <form
                      action={`/api/galleries/${g.id}/delete`}
                      method="post"
                    >
                      <button className="rounded-full bg-red-500/90 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-500 active:scale-[0.99]">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>

                {/* Quick edit */}
                <details className="group rounded-3xl border border-black/5 bg-white/55 open:bg-white/65 dark:border-white/10 dark:bg-white/5 dark:open:bg-white/6">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-900/80 dark:text-white/70">
                    <span>Quick edit</span>
                    <span className="text-xs text-zinc-500/80 transition group-open:rotate-180 dark:text-white/40">
                      ▼
                    </span>
                  </summary>

                  <div className="px-4 pb-4">
                    <form
                      action={`/api/galleries/${g.id}/update`}
                      method="post"
                      className="grid gap-3 md:grid-cols-6"
                    >
                      <Input
                        name="description"
                        defaultValue={g.description ?? ""}
                        placeholder="Description"
                        className="md:col-span-3"
                      />

                      <Input
                        name="coverUrl"
                        defaultValue={g.coverUrl ?? ""}
                        placeholder="Cover URL (R2 public URL)"
                        className="md:col-span-3"
                      />

                      <label className="md:col-span-3 flex items-center gap-3 rounded-2xl border border-black/5 bg-white/60 px-4 py-2.5 text-sm text-zinc-900/70 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                        <input
                          name="showInHero"
                          type="checkbox"
                          defaultChecked={showInHero}
                          className="h-5 w-9 appearance-none rounded-full bg-black/10 outline-none ring-1 ring-black/10 transition after:content-[''] after:block after:h-4 after:w-4 after:translate-x-0.5 after:rounded-full after:bg-white after:shadow after:transition checked:bg-linear-to-r checked:from-fuchsia-500 checked:to-cyan-400 checked:after:translate-x-4 dark:bg-white/15 dark:ring-white/10"
                        />
                        Show in homepage hero
                      </label>

                      <Input
                        name="heroOrder"
                        type="number"
                        defaultValue={heroOrder}
                        placeholder="Hero order"
                        className="md:col-span-1"
                      />

                      {/* No nested form: submit to a different endpoint */}
                      <button
                        type="submit"
                        formAction={`/api/galleries/${g.id}/cover-latest`}
                        formMethod="post"
                        className="md:col-span-2 rounded-2xl border border-black/5 bg-white/70 px-4 py-2.5 text-sm font-semibold text-zinc-900/80 transition hover:bg-white active:scale-[0.99] dark:border-white/10 dark:bg-white/6 dark:text-white/80 dark:hover:bg-white/10"
                      >
                        Use latest as cover
                      </button>

                      <button className="md:col-span-6 rounded-2xl bg-linear-to-r from-zinc-900 to-zinc-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:brightness-110 active:scale-[0.99] dark:from-white dark:to-white/80 dark:text-zinc-900">
                        Save changes
                      </button>
                    </form>
                  </div>
                </details>
              </div>
            </GlassCard>
          );
        })}

        {!galleries.length && (
          <GlassCard className="p-6 text-sm text-zinc-700/70 dark:text-white/60">
            No galleries yet.
          </GlassCard>
        )}
      </div>
    </div>
  );
}

/* ---------- tiny local helpers (no extra deps) ---------- */

function pill() {
  return "rounded-full border border-black/5 bg-white/70 px-4 py-2 text-xs font-semibold text-zinc-900/80 transition hover:bg-white dark:border-white/10 dark:bg-white/6 dark:text-white/80 dark:hover:bg-white/10";
}

function Badge({
  children,
  size = "md",
  tone = "default",
}: {
  children: React.ReactNode;
  size?: "sm" | "md";
  tone?: "default" | "muted" | "good" | "accent";
}) {
  const base =
    "inline-flex items-center rounded-full border font-medium backdrop-blur-xl";
  const sizes = {
    sm: "px-2.5 py-1 text-[11px]",
    md: "px-3 py-1 text-xs",
  }[size];

  const tones = {
    default:
      "border-black/5 bg-white/60 text-zinc-900/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70",
    muted:
      "border-black/5 bg-white/50 text-zinc-900/60 dark:border-white/10 dark:bg-white/4 dark:text-white/55",
    good: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200",
    accent:
      "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-700 dark:border-fuchsia-400/20 dark:bg-fuchsia-400/10 dark:text-fuchsia-200",
  }[tone];

  return <span className={`${base} ${sizes} ${tones}`}>{children}</span>;
}

function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "rounded-2xl border border-black/10 bg-white/75 px-4 py-2.5 text-sm text-zinc-900",
        "placeholder:text-zinc-500/70 outline-none backdrop-blur-xl transition",
        "focus:border-black/20 focus:bg-white",
        "dark:border-white/15 dark:bg-white/8 dark:text-white dark:placeholder:text-white/40 dark:focus:bg-white/12",
        className,
      ].join(" ")}
    />
  );
}
