"use client";

import { useState } from "react";
import { MediaPicker, type PickedPhoto } from "@/components/media/MediaPicker";

export default function MediaPanel() {
  const [selected, setSelected] = useState<PickedPhoto | null>(null);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-5">
        <h1 className="text-2xl font-semibold">Media Library</h1>
        <p className="mt-1 text-sm text-white/60">
          Browse all images, filter by album, and upload into an album.
        </p>
      </div>

      <MediaPicker
        variant="panel"
        title="Library"
        endpoint="/api/media/photos"
        allowUpload
        onPick={(p) => setSelected(p)}
      />

      {selected ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
          Selected: {selected.title || selected.url}
        </div>
      ) : null}
    </div>
  );
}
