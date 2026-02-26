"use client";

export default function LoginClient({
  nextUrl,
  error,
}: {
  nextUrl: string;
  error?: string;
}) {
  return (
    <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
      <h1 className="text-xl font-semibold">Login</h1>

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm">
          {error}
        </div>
      ) : null}

      {/* Your login form here */}
      <input type="hidden" name="next" value={nextUrl} />
    </div>
  );
}
