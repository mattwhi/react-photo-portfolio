"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function DeletePhotoButton({ photoId }: { photoId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this photo? This cannot be undone.")) return;

        startTransition(async () => {
          const res = await fetch(`/api/photos/${photoId}/delete`, {
            method: "POST",
          });
          if (!res.ok) {
            const txt = await res.text();
            alert(`Delete failed: ${txt.slice(0, 200)}`);
            return;
          }
          router.refresh();
        });
      }}
      className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-100 hover:bg-red-500/15 disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
