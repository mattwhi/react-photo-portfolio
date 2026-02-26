"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";

export default function AdminLoginForm({ nextUrl }: { nextUrl?: string }) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, next: nextUrl }),
    });

    setLoading(false);

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.error ?? "Login failed");
      return;
    }

    // Prefer API-provided redirect (supports RBAC decisions)
    const redirectTo =
      typeof data?.redirect === "string" && data.redirect.length > 0
        ? data.redirect
        : "/admin/galleries";

    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <div className="relative mx-auto max-w-md">
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 -left-28 h-80 w-80 rounded-full bg-fuchsia-400/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 right-0 h-96 w-96 rounded-full bg-cyan-400/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl"
      />

      <GlassCard className="p-7">
        <h1 className="text-xl font-semibold tracking-tight">Admin login</h1>
        <p className="mt-1 text-sm muted">
          Use the seeded admin credentials from your{" "}
          <code className="rounded-md border border-[rgb(var(--glass-border))] bg-white/10 px-1.5 py-0.5 font-mono text-xs">
            .env
          </code>
          .
        </p>

        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="text-xs muted">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className={field("mt-1")}
              placeholder="admin@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="text-xs muted">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className={field("mt-1")}
              placeholder="••••••••"
              autoComplete="current-password"
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
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="pt-1 text-xs muted">
            Tip: if you changed the seeded password, update it in your
            environment variables.
          </div>
          <a className="underline text-xs muted" href="/forgot-password">
            Forgot password?
          </a>
        </form>
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
