"use client";

import * as React from "react";
import { LightboxModal, type LightboxPhoto } from "@/components/LightboxModal";

export function GalleryLightboxGrid({ photos }: { photos: LightboxPhoto[] }) {
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setIndex(i);
              setOpen(true);
            }}
            className="glass overflow-hidden text-left transition hover:glass-press"
            aria-haspopup="dialog"
          >
            <div className="relative">
              <img
                src={p.url}
                alt={p.title ?? "Photo"}
                className="h-56 w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/35 via-black/0 to-transparent" />
            </div>

            {p.title || p.description ? (
              <div className="p-4">
                {p.title && (
                  <div className="text-sm font-semibold">{p.title}</div>
                )}
                {p.description && (
                  <div className="mt-1 text-xs muted line-clamp-2">
                    {p.description}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4">
                <div className="text-xs muted">Open</div>
              </div>
            )}
          </button>
        ))}
      </div>

      {open && (
        <LightboxModal
          photos={photos}
          initialIndex={index}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
