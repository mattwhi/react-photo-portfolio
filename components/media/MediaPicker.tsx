"use client";

import { useEffect, useMemo, useState } from "react";

export type PickedPhoto = {
  id: string;
  key: string;
  url: string;
  alt?: string;
  title?: string;
};

type Gallery = { id: string; title: string; photos: PickedPhoto[] };
type Variant = "modal" | "panel";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  if (!ct.includes("application/json")) {
    throw new Error(
      `Expected JSON, got "${ct}". First 200: ${text.slice(0, 200)}`
    );
  }
  return JSON.parse(text) as T;
}

export function MediaPicker({
  open = false,
  onClose = () => {},
  onPick,
  title = "Media Library",
  endpoint = "/api/media/photos",
  allowUpload = true,
  variant = "modal",
}: {
  open?: boolean;
  onClose?: () => void;
  onPick: (photo: PickedPhoto) => void;
  title?: string;
  endpoint?: string;
  allowUpload?: boolean;
  variant?: Variant;
}) {
  const [q, setQ] = useState("");
  const [galleryId, setGalleryId] = useState<string>(""); // "" = all
  const [data, setData] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string>("");

  const isOpen = variant === "panel" ? true : open;

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const url = `${endpoint}?q=${encodeURIComponent(
        q
      )}&galleryId=${encodeURIComponent(galleryId)}`;
      const json = await fetchJson<Gallery[]>(url);
      setData(json);
    } catch (e: any) {
      setErr(e?.message || "Failed to load images");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, q, galleryId, endpoint]);

  const galleries = data;

  const allPhotos = useMemo(() => {
    const g = galleryId
      ? galleries.filter((x) => x.id === galleryId)
      : galleries;
    return g.flatMap((x) => x.photos);
  }, [galleries, galleryId]);

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    // ✅ IMPORTANT: upload must go to a specific album
    if (!galleryId) {
      setErr(
        "Select an Album before uploading (you’re currently viewing All Albums)."
      );
      return;
    }

    setUploading(true);
    setErr("");

    try {
      const fd = new FormData();
      fd.set("galleryId", galleryId);

      // API expects: form.getAll("files")
      for (const file of Array.from(files)) {
        fd.append("files", file);
      }

      const res = await fetch("/api/photos/upload", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Upload failed (${res.status}): ${txt.slice(0, 250)}`);
      }

      await load();
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const content = (
    <div
      className={
        variant === "panel"
          ? "rounded-2xl border border-white/10 bg-white/5 p-4"
          : ""
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-lg font-semibold">{title}</div>

        <div className="flex items-center gap-2">
          {allowUpload && (
            <label className="cursor-pointer rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15">
              {uploading ? "Uploading…" : "Upload"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  uploadFiles(e.target.files);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          )}

          {variant === "modal" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 hover:bg-white/10"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
        />

        <select
          value={galleryId}
          onChange={(e) => setGalleryId(e.target.value)}
          className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
        >
          <option value="">All albums</option>
          {galleries.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>

        <div className="flex items-center text-sm text-white/60">
          {loading ? "Loading…" : `${allPhotos.length} images`}
        </div>
      </div>

      {err ? (
        <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">
          {err}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {allPhotos.map((p) => (
          <button
            type="button"
            key={p.id}
            onClick={() => onPick(p)}
            className="overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={p.alt || ""}
              className="h-32 w-full object-cover"
            />
            <div className="p-2 text-xs text-white/70 truncate">
              {p.title || "Untitled"}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  if (variant === "panel") return content;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-4">
      <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-[#0b0f17] p-4 shadow-2xl">
        {content}
      </div>
    </div>
  );
}
