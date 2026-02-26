"use client";

import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type CarouselPhoto = {
  id: string;
  url: string;
  title?: string | null;
  description?: string | null;
};

const INTERVAL_MS = 6500;

export function PhotoCarousel({
  photos,
  height = 420,
}: {
  photos: CarouselPhoto[];
  height?: number;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selected, setSelected] = useState(0);
  const [interactive, setInteractive] = useState(false);

  const canShow = useMemo(() => (photos?.length ?? 0) > 0, [photos]);
  const hasMany = (photos?.length ?? 0) > 1;

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const isPausedRef = useRef(false);
  const isHoverRef = useRef(false);
  const isFocusRef = useRef(false);

  const setProgress = (p: number) => {
    const el = progressFillRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(1, p));
    el.style.transform = `scaleX(${clamped})`;
  };

  const stopLoop = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const tick = (now: number) => {
    if (!emblaApi) return;
    if (isPausedRef.current) return;

    const elapsed = now - startRef.current;
    elapsedRef.current = elapsed;

    setProgress(elapsed / INTERVAL_MS);

    if (elapsed >= INTERVAL_MS) {
      emblaApi.scrollNext();
      startRef.current = now;
      elapsedRef.current = 0;
      setProgress(0);
    }

    rafRef.current = requestAnimationFrame(tick);
  };

  const startLoop = () => {
    stopLoop();
    startRef.current = performance.now() - elapsedRef.current;
    rafRef.current = requestAnimationFrame(tick);
  };

  const resetTimer = () => {
    elapsedRef.current = 0;
    startRef.current = performance.now();
    setProgress(0);
    if (!isPausedRef.current) startLoop();
  };

  const applyPauseState = () => {
    const shouldPause = isHoverRef.current || isFocusRef.current || !hasMany;

    setInteractive(shouldPause && hasMany);

    if (shouldPause) {
      isPausedRef.current = true;
      stopLoop();
      return;
    }

    isPausedRef.current = false;
    startLoop();
  };

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
    resetTimer();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
    resetTimer();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelected(emblaApi.selectedScrollSnap());
      resetTimer();
    };

    emblaApi.on("select", onSelect);
    onSelect();

    applyPauseState();

    return () => {
      stopLoop();
      emblaApi.off("select", onSelect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emblaApi, hasMany]);

  if (!canShow) {
    return (
      <div className="glass rounded-3xl p-6 text-sm muted">No photos yet.</div>
    );
  }

  return (
    <div
      ref={(el) => {
        sectionRef.current = el;
      }}
      className="relative outline-none"
      tabIndex={hasMany ? 0 : -1}
      aria-label="Photo carousel"
      onPointerEnter={() => {
        isHoverRef.current = true;
        applyPauseState();
      }}
      onPointerLeave={() => {
        isHoverRef.current = false;
        applyPauseState();
      }}
      onFocusCapture={() => {
        isFocusRef.current = true;
        applyPauseState();
      }}
      onBlurCapture={(e) => {
        requestAnimationFrame(() => {
          const within = e.currentTarget.contains(document.activeElement);
          isFocusRef.current = within;
          applyPauseState();
        });
      }}
      onKeyDown={(e) => {
        if (!emblaApi || !hasMany) return;

        const t = e.target as HTMLElement | null;
        const tag = t?.tagName?.toLowerCase();
        if (
          tag === "input" ||
          tag === "textarea" ||
          (t as any)?.isContentEditable
        )
          return;

        if (e.key === "Escape") {
          e.preventDefault();
          sectionRef.current?.blur?.();
          return;
        }

        if (e.key === "ArrowLeft") {
          e.preventDefault();
          scrollPrev();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          scrollNext();
        }
      }}
    >
      <div ref={emblaRef} className="overflow-hidden rounded-3xl mb-5 mt-5">
        <div className="flex">
          {photos.map((p, idx) => (
            <div key={p.id} className="min-w-0 flex-[0_0_100%]">
              <div
                className="relative w-full overflow-hidden"
                style={{ height }}
              >
                <Image
                  src={p.url}
                  alt={p.title ?? "Photo"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 960px"
                  priority={idx === 0}
                />

                {/* cinematic overlay */}
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />

                {(p.title || p.description) && (
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    {p.title && (
                      <div className="text-sm font-semibold">{p.title}</div>
                    )}
                    {p.description && (
                      <div className="mt-1 line-clamp-2 text-xs text-white/80">
                        {p.description}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls (only if > 1 photo) */}
      {hasMany && (
        <>
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

          {/* Dots rail */}
          <div className="absolute bottom-4 right-4">
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-2xl">
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    emblaApi?.scrollTo(i);
                    resetTimer();
                  }}
                  className={[
                    "h-2.5 w-2.5 rounded-full border border-white/60 transition",
                    i === selected
                      ? "bg-white"
                      : "bg-white/20 hover:bg-white/40",
                  ].join(" ")}
                  aria-label={`Go to photo ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Progress bar: invisible until hover/focus */}
          <div
            className={[
              "pointer-events-none absolute inset-x-0 bottom-0 h-1 transition-opacity",
              interactive ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            <div className="h-full bg-white/10" />
            <div
              ref={progressFillRef}
              className={[
                "absolute inset-y-0 left-0 origin-left scale-x-0",
                "bg-linear-to-r from-fuchsia-400/85 to-cyan-300/85",
                interactive ? "shadow-[0_0_18px_rgba(236,72,153,0.35)]" : "",
              ].join(" ")}
              style={{ width: "100%", transform: "scaleX(0)" }}
            />
          </div>
        </>
      )}
    </div>
  );
}
