"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MediaPicker, type PickedPhoto } from "@/components/media/MediaPicker";

export function GalleryMediaTools({ galleryId }: { galleryId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [pickerOpen, setPickerOpen] = useState(false);

  // upload state
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState<string>("");

  function uploadWithProgress(files: FileList) {
    setErr("");
    setProgress(0);
    setUploading(true);

    const fd = new FormData();
    fd.set("galleryId", galleryId);
    if (desc.trim()) fd.set("description", desc.trim());

    // IMPORTANT: your API expects "files"
    Array.from(files).forEach((f) => fd.append("files", f));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/photos/upload");

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const pct = Math.round((e.loaded / e.total) * 100);
      setProgress(pct);
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        setProgress(100);
        setDesc("");
        router.refresh();
      } else {
        setErr(
          `Upload failed (${xhr.status}): ${
            xhr.responseText?.slice?.(0, 200) ?? ""
          }`
        );
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setErr("Upload failed (network error).");
    };

    xhr.send(fd);
  }

  async function copyFromLibrary(photo: PickedPhoto) {
    setPickerOpen(false);

    startTransition(async () => {
      const res = await fetch(`/api/galleries/${galleryId}/add-existing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: photo.id }),
      });

      if (!res.ok) {
        const txt = await res.text();
        setErr(`Copy failed (${res.status}): ${txt.slice(0, 200)}`);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Add photos</div>
          <div className="text-xs text-white/60">
            Upload new images to this gallery, or copy existing ones from the
            library.
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            disabled={pending}
          >
            Pick from Media Library
          </button>

          <label className="cursor-pointer rounded-2xl border border-white/10 bg-linear-to-br from-fuchsia-500/25 to-cyan-400/15 px-4 py-2 text-sm font-semibold text-white hover:from-fuchsia-500/30 hover:to-cyan-400/20">
            {uploading ? "Uploading…" : "Upload photos"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                if (e.target.files?.length) uploadWithProgress(e.target.files);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="block text-xs text-white/60">
            Description (optional)
          </label>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Applied to all uploaded photos"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80 outline-none focus:border-white/20"
          />
        </div>

        <div className="flex items-end">
          <div className="w-full">
            <div className="mb-2 flex items-center justify-between text-xs text-white/60">
              <span>Upload progress</span>
              <span>
                {uploading ? `${progress}%` : progress ? `${progress}%` : "—"}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-black/30">
              <div
                className="h-full bg-white/50 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {err ? (
        <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">
          {err}
        </div>
      ) : null}

      {/* Library picker uses your existing library feed (all photos + filter by album) */}
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={copyFromLibrary}
        title="Media Library"
        endpoint="/api/media/photos"
        allowUpload={false}
      />
    </div>
  );
}
