"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type HeroSlide = {
  slug: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
};

const INTERVAL_MS = 6500;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selected, setSelected] = useState(0);

  const canShow = useMemo(() => (slides?.length ?? 0) > 0, [slides]);

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
      // reset timer immediately (select handler will also sync)
      startRef.current = now;
      elapsedRef.current = 0;
      setProgress(0);
    }

    rafRef.current = requestAnimationFrame(tick);
  };

  const startLoop = () => {
    stopLoop();
    // continue from current elapsed (useful after pause)
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
    const shouldPause = isHoverRef.current || isFocusRef.current;
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

    // start autoplay/progress
    applyPauseState();

    return () => {
      stopLoop();
      emblaApi.off("select", onSelect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emblaApi]);

  if (!canShow) return null;

  return (
    <section
      className="glass overflow-hidden outline-none mb-5"
      tabIndex={0}
      aria-label="Featured galleries carousel"
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
        // wait for focus to settle, then check if focus is still within this section
        requestAnimationFrame(() => {
          const within = e.currentTarget.contains(document.activeElement);
          isFocusRef.current = within;
          applyPauseState();
        });
      }}
      onKeyDown={(e) => {
        if (!emblaApi) return;

        // don’t hijack keys when typing in inputs etc.
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName?.toLowerCase();
        if (
          tag === "input" ||
          tag === "textarea" ||
          (t as any)?.isContentEditable
        )
          return;

        if (e.key === "ArrowLeft") {
          e.preventDefault();
          scrollPrev();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          scrollNext();
        }
      }}
    >
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((s, idx) => (
            <div key={s.slug} className="min-w-0 flex-[0_0_100%]">
              <div className="relative h-104 w-full md:h-128">
                {s.imageUrl ? (
                  <Image
                    src={s.imageUrl}
                    alt={s.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 1100px"
                    priority={idx === 0}
                  />
                ) : (
                  <div className="h-full w-full bg-linear-to-br from-white/80 via-white/30 to-white/10" />
                )}

                {/* cinematic overlay */}
                <div className="absolute inset-0 bg-linear-to-br from-black/65 via-black/25 to-transparent" />
                <div className="pointer-events-none absolute inset-0 mask-[radial-gradient(800px_circle_at_60%_40%,black,transparent_70%)] bg-black/35" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                  <div className="max-w-2xl rounded-3xl border border-white/15 bg-white/10 p-5 text-white backdrop-blur-2xl shadow-[0_26px_70px_-45px_rgba(0,0,0,0.6)]">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/80">
                      <span className="h-2 w-2 rounded-full bg-linear-to-r from-fuchsia-400 to-cyan-300" />
                      Featured gallery
                    </div>

                    <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                      {s.title}
                    </h1>

                    {s.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-white/80">
                        {s.description}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/g/${s.slug}`}
                        className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-black transition hover:bg-white active:scale-[0.99]"
                      >
                        View gallery →
                      </Link>

                      <Link
                        href="/"
                        className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:bg-white/15 active:scale-[0.99]"
                      >
                        Browse all
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Prev / Next */}
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

                {/* Dots (glass rail) */}
                <div className="absolute bottom-4 right-4">
                  <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-2xl">
                    {slides.map((_, i) => (
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
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Progress bar (subtle, synced, pauses on hover/focus) */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/10">
                  <div
                    ref={progressFillRef}
                    className="h-full origin-left scale-x-0 bg-linear-to-r from-fuchsia-400/80 to-cyan-300/80"
                    style={{ transform: "scaleX(0)" }}
                  />
                </div>

                {/* Subtle bottom highlight */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/40 to-transparent" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
