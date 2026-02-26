"use client";

import { useSearchParams } from "next/navigation";

export default function ResetPasswordClient() {
  const sp = useSearchParams();
  const email = sp.get("email") || "";
  const token = sp.get("token") || "";

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
      <h1 className="text-xl font-semibold">Reset password</h1>

      {/* Your form here */}
      <div className="text-sm text-white/60">
        {/* Debug/visibility if you want */}
        {email ? <div>Email: {email}</div> : null}
        {token ? <div>Token present</div> : null}
      </div>
    </div>
  );
}
