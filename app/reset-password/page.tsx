"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";

export default function ResetPasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const email = sp.get("email") || "";
  const token = sp.get("token") || "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(data?.error ?? "Reset failed");
      return;
    }

    router.replace(data?.redirect || "/login");
    router.refresh();
  }

  const missing = !email || !token;

  return (
    <div className="relative mx-auto max-w-md">
      <GlassCard className="p-7">
        <h1 className="text-xl font-semibold tracking-tight">Reset password</h1>

        {missing ? (
          <p className="mt-2 text-sm muted">
            This reset link is missing information.
          </p>
        ) : (
          <form className="mt-6 space-y-3" onSubmit={onSubmit}>
            <div>
              <label className="text-xs muted">New password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className={field("mt-1")}
                autoComplete="new-password"
                minLength={10}
                required
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm">
                <span className="text-red-700 dark:text-red-200">{error}</span>
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-linear-to-r from-zinc-900 to-zinc-700 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:brightness-110 disabled:opacity-60 active:scale-[0.99]"
            >
              {loading ? "Resetting…" : "Reset password"}
            </button>
          </form>
        )}
      </GlassCard>
    </div>
  );
}

function field(extra = "") {
  return [
    "w-full rounded-2xl border border-[rgb(var(--glass-border))] bg-white/10 px-3 py-2 text-sm outline-none",
    "backdrop-blur-xl transition focus:hover-surface-2",
    extra,
  ].join(" ");
}
