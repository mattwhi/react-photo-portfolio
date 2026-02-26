"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/GlassCard";

type Gallery = { id: string; title: string; slug: string };

type Draft = {
  file: File;
  title: string;
  description: string;
  isCover: boolean;
  status: "queued" | "uploading" | "done" | "error";
  message?: string;
};

function nameToTitle(filename: string) {
  const base = filename.replace(/\.[^/.]+$/, "");
  return base.replace(/[-_]+/g, " ").trim();
}

export default function AdminUploadPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [galleryId, setGalleryId] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/galleries")
      .then((r) => r.json())
      .then((data) => {
        const list: Gallery[] = data.galleries ?? [];
        setGalleries(list);
        if (list.length > 0) setGalleryId(list[0].id);
      })
      .catch(() => setStatus("Failed to load galleries"));
  }, []);

  useEffect(() => {
    if (!files?.length) {
      setDrafts([]);
      return;
    }

    const list = Array.from(files).map((f, idx) => ({
      file: f,
      title: nameToTitle(f.name),
      description: "",
      isCover: idx === 0,
      status: "queued" as const,
      message: "",
    }));

    setDrafts(list);
  }, [files]);

  const fileCount = useMemo(() => drafts.length, [drafts]);
  const doneCount = useMemo(
    () => drafts.filter((d) => d.status === "done").length,
    [drafts]
  );

  function setCoverIndex(index: number) {
    setDrafts((prev) => prev.map((d, i) => ({ ...d, isCover: i === index })));
  }

  async function uploadOne(d: Draft) {
    const presignRes = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        galleryId,
        filename: d.file.name,
        contentType: d.file.type || "application/octet-stream",
      }),
    });

    if (!presignRes.ok) {
      const data = await presignRes.json().catch(() => null);
      throw new Error(data?.error ?? "Failed to presign");
    }

    const { uploadUrl, publicUrl } = (await presignRes.json()) as {
      uploadUrl: string;
      publicUrl: string;
    };

    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": d.file.type || "application/octet-stream" },
      body: d.file,
    });

    if (!putRes.ok) throw new Error(`R2 upload failed (${putRes.status})`);

    const metaRes = await fetch("/api/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        galleryId,
        url: publicUrl,
        title: d.title.trim() || null,
        description: d.description.trim() || null,
      }),
    });

    if (!metaRes.ok) {
      const data = await metaRes.json().catch(() => null);
      throw new Error(data?.error ?? "Failed to save photo metadata");
    }

    if (d.isCover) {
      const coverRes = await fetch(`/api/galleries/${galleryId}/cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverUrl: publicUrl }),
      });

      if (!coverRes.ok) {
        const data = await coverRes.json().catch(() => null);
        throw new Error(data?.error ?? "Cover update failed");
      }
    }
  }

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!galleryId) return setStatus("Pick a gallery first.");
    if (!drafts.length) return setStatus("Pick at least one image.");

    setBusy(true);
    setStatus(null);

    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];

      setDrafts((prev) =>
        prev.map((x) =>
          x.file === d.file
            ? {
                ...x,
                status: "uploading",
                message: `Uploading ${i + 1}/${drafts.length}…`,
              }
            : x
        )
      );

      try {
        await uploadOne(d);
        setDrafts((prev) =>
          prev.map((x) =>
            x.file === d.file
              ? { ...x, status: "done", message: "Uploaded" }
              : x
          )
        );
      } catch (err: any) {
        setDrafts((prev) =>
          prev.map((x) =>
            x.file === d.file
              ? {
                  ...x,
                  status: "error",
                  message: err?.message ?? "Upload failed",
                }
              : x
          )
        );
      }
    }

    setBusy(false);

    // note: we keep your original behaviour (no refactor of logic)
    const failed = drafts.filter((d) => d.status === "error").length;
    setStatus(
      failed
        ? `Finished with some errors. Uploaded ${doneCount}/${drafts.length}.`
        : `✅ Uploaded ${drafts.length}/${drafts.length}.`
    );

    const input = document.getElementById(
      "file-input"
    ) as HTMLInputElement | null;
    if (input) input.value = "";
    setFiles(null);
  }

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

      <GlassCard className="p-6 md:p-7">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Upload photos
            </h1>
            <p className="mt-1 text-sm muted">
              Per-photo titles/descriptions + one-click gallery cover.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Pill>{fileCount ? `${fileCount} selected` : "No files"}</Pill>
            <Pill>{doneCount ? `${doneCount} done` : "0 done"}</Pill>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onUpload}>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs muted">Gallery</label>
              <select
                value={galleryId}
                onChange={(e) => setGalleryId(e.target.value)}
                className={field("mt-1")}
              >
                {galleries.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs muted">Images</label>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(e.target.files)}
                className={field("mt-1")}
              />
              <div className="mt-1 text-xs muted">
                {fileCount
                  ? `${fileCount} file(s) selected`
                  : "Pick one or more images."}
              </div>
            </div>
          </div>

          {!!drafts.length && (
            <GlassCard variant="subtle" className="p-4">
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="text-xs font-medium muted">
                  Upload queue ({doneCount}/{drafts.length}) — choose cover +
                  edit titles
                </div>

                <div className="flex items-center gap-2">
                  <Pill tone="accent">
                    Cover: {drafts.findIndex((d) => d.isCover) + 1 || 0}
                  </Pill>
                </div>
              </div>

              <div className="space-y-3">
                {drafts.map((d, idx) => (
                  <GlassCard
                    key={`${d.file.name}-${d.file.size}-${idx}`}
                    variant="subtle"
                    className="p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {d.file.name}
                        </div>
                        <div className="mt-0.5 text-xs muted">
                          {d.message ?? ""}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCoverIndex(idx)}
                          className={
                            d.isCover
                              ? "rounded-full bg-[rgb(var(--fg))] px-3 py-1 text-xs font-semibold text-[rgb(var(--bg))] transition hover:opacity-90"
                              : "rounded-full border border-[rgb(var(--glass-border))] bg-white/10 px-3 py-1 text-xs font-semibold transition hover:hover-surface"
                          }
                        >
                          {d.isCover ? "Cover ✓" : "Set as cover"}
                        </button>

                        <StatusPill status={d.status} />
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-xs muted">Title</label>
                        <input
                          value={d.title}
                          onChange={(e) =>
                            setDrafts((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, title: e.target.value } : x
                              )
                            )
                          }
                          className={field("mt-1")}
                        />
                      </div>

                      <div>
                        <label className="text-xs muted">Description</label>
                        <input
                          value={d.description}
                          onChange={(e) =>
                            setDrafts((prev) =>
                              prev.map((x, i) =>
                                i === idx
                                  ? { ...x, description: e.target.value }
                                  : x
                              )
                            )
                          }
                          className={field("mt-1")}
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    {d.status === "error" && (
                      <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                        {/* in light mode, your tokens may make this too pale; adjust if needed */}
                        <span className="text-red-700 dark:text-red-200">
                          {d.message || "Upload failed"}
                        </span>
                      </div>
                    )}
                  </GlassCard>
                ))}
              </div>
            </GlassCard>
          )}

          {status && (
            <div className="rounded-2xl border border-[rgb(var(--glass-border))] bg-white/10 px-4 py-3 text-sm">
              {status}
            </div>
          )}

          <button
            disabled={busy || !galleries.length}
            className="rounded-2xl bg-linear-to-r from-zinc-900 to-zinc-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:brightness-110 disabled:opacity-60 active:scale-[0.99]"
          >
            {busy ? "Uploading…" : "Upload"}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}

/* ---------- tiny local helpers (token-driven, no dark: spam) ---------- */

function field(extra = "") {
  return [
    "w-full rounded-2xl border border-[rgb(var(--glass-border))] bg-white/10 px-3 py-2 text-sm outline-none",
    "backdrop-blur-xl transition focus:hover-surface-2",
    extra,
  ].join(" ");
}

function Pill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "accent";
}) {
  const cls =
    tone === "accent"
      ? "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-200"
      : "border-[rgb(var(--glass-border))] bg-white/10 text-[rgb(var(--fg))]";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${cls}`}
    >
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: Draft["status"] }) {
  const map: Record<Draft["status"], string> = {
    queued: "border-[rgb(var(--glass-border))] bg-white/10",
    uploading: "border-cyan-500/20 bg-cyan-500/10",
    done: "border-emerald-500/20 bg-emerald-500/10",
    error: "border-red-500/25 bg-red-500/10",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${map[status]}`}
    >
      {status}
    </span>
  );
}
