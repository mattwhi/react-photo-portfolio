"use client";

import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    setDone(true);
  }

  return (
    <div className="relative mx-auto max-w-md">
      <GlassCard className="p-7">
        <h1 className="text-xl font-semibold tracking-tight">
          Forgot password
        </h1>
        <p className="mt-1 text-sm muted">
          Enter your email and we’ll send a reset link (if the account exists).
        </p>

        {done ? (
          <div className="mt-6 rounded-2xl border border-[rgb(var(--glass-border))] bg-white/10 p-4 text-sm">
            If that email exists, a reset link has been sent.
          </div>
        ) : (
          <form className="mt-6 space-y-3" onSubmit={onSubmit}>
            <div>
              <label className="text-xs muted">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className={field("mt-1")}
                autoComplete="email"
                required
              />
            </div>

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-linear-to-r from-zinc-900 to-zinc-700 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:brightness-110 disabled:opacity-60 active:scale-[0.99] mt-5"
            >
              {loading ? "Sending…" : "Send reset link"}
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
