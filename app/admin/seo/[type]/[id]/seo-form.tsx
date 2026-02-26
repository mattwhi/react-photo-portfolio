"use client";

import { useState } from "react";
import { SeoEntityType } from "@prisma/client";
import { saveSeoMetaAction } from "./server-actions";

export default function SeoForm({
  entityType,
  entityId,
  initial,
}: {
  entityType: SeoEntityType;
  entityId: string;
  initial: any;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    canonicalUrl: initial?.canonicalUrl ?? "",
    ogTitle: initial?.ogTitle ?? "",
    ogDescription: initial?.ogDescription ?? "",
    ogImageUrl: initial?.ogImageUrl ?? "",
    twitterCard: initial?.twitterCard ?? "summary_large_image",
    noindex: Boolean(initial?.noindex ?? false),
    nofollow: Boolean(initial?.nofollow ?? false),
    jsonLd: initial?.jsonLd ? JSON.stringify(initial.jsonLd, null, 2) : "",
  });

  return (
    <form
      action={async () => {
        await saveSeoMetaAction(entityType, entityId, form);
      }}
      className="space-y-4 rounded-xl border p-4"
    >
      <div className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm opacity-70">Title</span>
          <input
            className="border rounded px-3 py-2"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm opacity-70">Description</span>
          <textarea
            className="border rounded px-3 py-2"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm opacity-70">Canonical (optional)</span>
          <input
            className="border rounded px-3 py-2"
            value={form.canonicalUrl}
            onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.noindex}
              onChange={(e) => setForm({ ...form, noindex: e.target.checked })}
            />
            <span>Noindex</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.nofollow}
              onChange={(e) => setForm({ ...form, nofollow: e.target.checked })}
            />
            <span>Nofollow</span>
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-sm opacity-70">JSON-LD (optional, JSON)</span>
          <textarea
            className="border rounded px-3 py-2 font-mono text-sm"
            rows={8}
            value={form.jsonLd}
            onChange={(e) => setForm({ ...form, jsonLd: e.target.value })}
          />
        </label>
      </div>

      <button className="rounded bg-black text-white px-4 py-2" type="submit">
        Save + Revalidate
      </button>
    </form>
  );
}
