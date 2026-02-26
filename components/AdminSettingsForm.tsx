"use client";

import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";

export default function AdminSettingsForm({ initial }: { initial: any }) {
  const [siteTitle, setSiteTitle] = useState(initial.siteTitle ?? "");
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? "");
  const [logoAlt, setLogoAlt] = useState(initial.logoAlt ?? "");
  const [logoTitle, setLogoTitle] = useState(initial.logoTitle ?? "");

  const [navLinks, setNavLinks] = useState(
    JSON.stringify(initial.navLinks ?? [], null, 2)
  );
  const [socialLinks, setSocialLinks] = useState(
    JSON.stringify(initial.socialLinks ?? {}, null, 2)
  );

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  async function uploadLogo() {
    if (!logoFile) {
      setStatus("Pick a logo file first.");
      return;
    }

    setUploadingLogo(true);
    setStatus(null);

    const presignRes = await fetch("/api/uploads/presign-logo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: logoFile.name,
        contentType: logoFile.type || "application/octet-stream",
      }),
    });

    if (!presignRes.ok) {
      const data = await presignRes.json().catch(() => null);
      setUploadingLogo(false);
      setStatus(data?.error ?? "Failed to presign logo upload");
      return;
    }

    const { uploadUrl, publicUrl } = await presignRes.json();

    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": logoFile.type || "application/octet-stream" },
      body: logoFile,
    });

    setUploadingLogo(false);

    if (!putRes.ok) {
      setStatus(`Logo upload failed (${putRes.status}). Check R2 CORS.`);
      return;
    }

    setLogoUrl(publicUrl);
    setStatus("✅ Logo uploaded. Now click Save settings.");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteTitle,
        logoUrl,
        logoAlt,
        logoTitle,
        navLinks,
        socialLinks,
      }),
    });

    setBusy(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setStatus(data?.error ?? "Save failed");
      return;
    }

    setStatus("✅ Saved");
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
              Header settings
            </h1>
            <p className="mt-1 text-sm muted">
              Logo + nav + socials for the sticky header.
            </p>
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={save}>
          {/* Title + Logo URL */}
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Site title" required>
              <input
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                className={field("mt-1")}
                required
              />
            </Field>

            <Field label="Logo URL">
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className={field("mt-1")}
                placeholder="Will be filled after upload"
              />
            </Field>
          </div>

          {/* Alt + Title */}
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Logo alt text">
              <input
                value={logoAlt}
                onChange={(e) => setLogoAlt(e.target.value)}
                className={field("mt-1")}
                placeholder="e.g. Cre8 Photography logo"
              />
            </Field>

            <Field label="Logo title (tooltip)">
              <input
                value={logoTitle}
                onChange={(e) => setLogoTitle(e.target.value)}
                className={field("mt-1")}
                placeholder="e.g. Home"
              />
            </Field>
          </div>

          {/* Upload */}
          <GlassCard variant="subtle" className="p-4">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-semibold">Upload logo to R2</div>
              <div className="text-xs muted">
                Pick a file, upload, then Save settings.
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                className={field("w-full")}
              />

              <button
                type="button"
                onClick={uploadLogo}
                disabled={uploadingLogo}
                className="rounded-2xl bg-[rgb(var(--fg))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--bg))] transition hover:opacity-90 disabled:opacity-60 active:scale-[0.99]"
              >
                {uploadingLogo ? "Uploading…" : "Upload logo"}
              </button>
            </div>
          </GlassCard>

          {/* JSON editors */}
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Navigation links (JSON)">
              <textarea
                value={navLinks}
                onChange={(e) => setNavLinks(e.target.value)}
                className={field("mt-1 h-56 font-mono")}
                spellCheck={false}
              />
            </Field>

            <Field
              label="Social links (JSON)"
              hint="Keys supported: instagram, tiktok, facebook, youtube, x, linkedin"
            >
              <textarea
                value={socialLinks}
                onChange={(e) => setSocialLinks(e.target.value)}
                className={field("mt-1 h-56 font-mono")}
                spellCheck={false}
              />
            </Field>
          </div>

          {/* Status */}
          {status && (
            <div className="rounded-2xl border border-[rgb(var(--glass-border))] bg-white/10 px-4 py-3 text-sm">
              {status}
            </div>
          )}

          {/* Save */}
          <button
            disabled={busy}
            className="rounded-2xl bg-linear-to-r from-zinc-900 to-zinc-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:brightness-110 disabled:opacity-60 active:scale-[0.99]"
          >
            {busy ? "Saving…" : "Save settings"}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}

/* ---------- small helpers ---------- */

function field(extra = "") {
  return [
    "w-full rounded-2xl border border-[rgb(var(--glass-border))] bg-white/10 px-3 py-2 text-sm outline-none",
    "backdrop-blur-xl transition focus:hover-surface-2",
    extra,
  ].join(" ");
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs muted">
        {label}{" "}
        {required ? <span className="text-[rgb(var(--muted))]">*</span> : null}
      </label>
      {children}
      {hint ? <div className="mt-2 text-xs muted">{hint}</div> : null}
    </div>
  );
}
