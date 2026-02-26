"use client";

import * as React from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

export type LightboxPhoto = {
  id: string;
  url: string;
  title?: string | null;
  description?: string | null;
};

type ExifSummary = {
  camera?: string;
  lens?: string;
  focal?: string;
  aperture?: string;
  shutter?: string;
  iso?: string;
  taken?: string;
};

function formatShutter(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  // if already fraction-like (e.g. 0.005 -> 1/200)
  if (n < 1) return `1/${Math.round(1 / n)}s`;
  return `${n.toFixed(n < 10 ? 1 : 0)}s`;
}

function formatAperture(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return `ƒ/${n.toFixed(1)}`;
}

function formatFocal(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return `${Math.round(n)}mm`;
}

function formatISO(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return `ISO ${Math.round(n)}`;
}

function formatTaken(v: any) {
  try {
    const d = v instanceof Date ? v : new Date(v);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return undefined;
  }
}

async function readExif(url: string): Promise<ExifSummary | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;

    const buf = await res.arrayBuffer();
    const exifr: any = await import("exifr"); // lazy-load to keep bundle smaller
    const data: any = await exifr.parse(buf, {
      // keep it light (no GPS by default)
      pick: [
        "Make",
        "Model",
        "LensModel",
        "FocalLength",
        "FNumber",
        "ExposureTime",
        "ISO",
        "DateTimeOriginal",
      ],
    });

    if (!data) return null;

    const make = data.Make ? String(data.Make).trim() : "";
    const model = data.Model ? String(data.Model).trim() : "";
    const camera = [make, model].filter(Boolean).join(" ");

    const lens = data.LensModel ? String(data.LensModel).trim() : undefined;

    const focal = formatFocal(data.FocalLength);
    const aperture = formatAperture(data.FNumber);
    const shutter = formatShutter(data.ExposureTime);
    const iso = formatISO(data.ISO);
    const taken = formatTaken(data.DateTimeOriginal);

    return {
      camera: camera || undefined,
      lens,
      focal,
      aperture,
      shutter,
      iso,
      taken,
    };
  } catch {
    return null;
  }
}

export function LightboxModal({
  photos,
  initialIndex,
  onClose,
}: {
  photos: LightboxPhoto[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    startIndex: Math.max(0, Math.min(initialIndex, photos.length - 1)),
  });

  const dialogRef = React.useRef<HTMLDivElement>(null);

  const [selected, setSelected] = React.useState(
    Math.max(0, Math.min(initialIndex, photos.length - 1))
  );

  const exifCache = React.useRef<Map<string, ExifSummary | null>>(new Map());
  const [exif, setExif] = React.useState<ExifSummary | null>(null);
  const [exifState, setExifState] = React.useState<
    "idle" | "loading" | "unavailable"
  >("idle");

  const current = photos[selected];

  const scrollPrev = React.useCallback(
    () => emblaApi?.scrollPrev(),
    [emblaApi]
  );
  const scrollNext = React.useCallback(
    () => emblaApi?.scrollNext(),
    [emblaApi]
  );

  // lock scroll + focus
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // close on ESC + arrows
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollNext();
      }
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey as any);
  }, [onClose, scrollPrev, scrollNext]);

  // sync selected index
  React.useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap();
      setSelected(idx);
    };

    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // load EXIF for current image (cached)
  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!current?.url) return;

      if (exifCache.current.has(current.url)) {
        const cached = exifCache.current.get(current.url) ?? null;
        setExif(cached);
        setExifState(cached ? "idle" : "unavailable");
        return;
      }

      setExifState("loading");
      const data = await readExif(current.url);
      exifCache.current.set(current.url, data);

      if (!cancelled) {
        setExif(data);
        setExifState(data ? "idle" : "unavailable");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [current?.url]);

  if (!photos.length) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative z-101 w-full max-w-6xl outline-none"
      >
        <div className="glass overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3 p-3 md:p-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[rgb(var(--glass-border))] bg-white/10 px-3 py-1 text-xs font-semibold">
                {selected + 1} / {photos.length}
              </span>
              <span className="text-xs muted hidden sm:inline">
                ←/→ to navigate · Esc to close · swipe on mobile
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[rgb(var(--glass-border))] bg-white/10 px-3 py-2 text-xs font-semibold transition hover:hover-surface active:scale-[0.99]"
            >
              Close ✕
            </button>
          </div>

          {/* Carousel */}
          <div className="relative">
            <div ref={emblaRef} className="overflow-hidden">
              <div className="flex">
                {photos.map((p) => (
                  <div key={p.id} className="min-w-0 flex-[0_0_100%]">
                    <div className="relative h-[60vh] min-h-90 w-full md:h-[70vh]">
                      <Image
                        src={p.url}
                        alt={p.title ?? "Photo"}
                        fill
                        className="object-contain bg-black/10"
                        sizes="(max-width: 768px) 100vw, 1200px"
                        priority={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <button
                type="button"
                onClick={scrollPrev}
                className="pointer-events-auto rounded-full border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white backdrop-blur-2xl transition hover:bg-white/15 active:scale-[0.99]"
                aria-label="Previous"
              >
                ←
              </button>
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                type="button"
                onClick={scrollNext}
                className="pointer-events-auto rounded-full border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white backdrop-blur-2xl transition hover:bg-white/15 active:scale-[0.99]"
                aria-label="Next"
              >
                →
              </button>
            </div>

            {/* Bottom overlay (title + EXIF) */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 md:p-4">
              <div className="pointer-events-auto rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-2xl text-white shadow-[0_26px_70px_-45px_rgba(0,0,0,0.6)]">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div className="min-w-0">
                    {current?.title ? (
                      <div className="truncate text-sm font-semibold">
                        {current.title}
                      </div>
                    ) : (
                      <div className="text-sm font-semibold opacity-80">
                        Untitled
                      </div>
                    )}
                    {current?.description && (
                      <div className="mt-1 line-clamp-2 text-xs text-white/80">
                        {current.description}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/80">
                    {exifState === "loading" && (
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
                        Reading EXIF…
                      </span>
                    )}

                    {exifState === "unavailable" && (
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
                        EXIF unavailable
                      </span>
                    )}

                    {exif && (
                      <>
                        {exif.camera && <Pill>{exif.camera}</Pill>}
                        {exif.lens && <Pill>{exif.lens}</Pill>}
                        {(exif.focal ||
                          exif.aperture ||
                          exif.shutter ||
                          exif.iso) && (
                          <Pill>
                            {[exif.focal, exif.aperture, exif.shutter, exif.iso]
                              .filter(Boolean)
                              .join(" · ")}
                          </Pill>
                        )}
                        {exif.taken && <Pill>{exif.taken}</Pill>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* subtle bottom vignette */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-black/45 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
      {children}
    </span>
  );
}
