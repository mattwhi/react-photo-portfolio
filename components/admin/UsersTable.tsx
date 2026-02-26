"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";

type UserRow = {
  id: string;
  email: string;
  role: string;
  createdAt: string | Date;
};

export default function UsersTable({
  initialUsers,
}: {
  initialUsers: UserRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [q, setQ] = useState("");
  const [users, setUsers] = useState<UserRow[]>(
    initialUsers.map((u) => ({ ...u, createdAt: new Date(u.createdAt) }))
  );

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return users;
    return users.filter((u) => u.email.toLowerCase().includes(qq));
  }, [q, users]);

  // Create user form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"member" | "admin">("member");
  const [msg, setMsg] = useState<string | null>(null);

  async function api(url: string, init: RequestInit) {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || "Request failed");
    return data;
  }

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function onCreate() {
    setMsg(null);
    const email = newEmail.trim().toLowerCase();
    if (!email) return setMsg("Email is required.");

    try {
      const data = await api("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email,
          password: newPassword || undefined,
          role: newRole,
        }),
      });

      // API returns user; if password auto-generated, show it once
      if (data?.tempPassword) {
        setMsg(`User created. Temporary password: ${data.tempPassword}`);
      } else {
        setMsg("User created.");
      }

      setNewEmail("");
      setNewPassword("");
      setNewRole("member");

      // refresh list (server) + optimistic add locally
      refresh();
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  async function onChangeRole(id: string, role: "member" | "admin") {
    setMsg(null);
    try {
      await api(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
      refresh();
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this user?")) return;
    setMsg(null);
    try {
      await api(`/api/admin/users/${id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      refresh();
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-6 mb-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold">Create user</div>
            <div className="text-xs muted">
              Create a user and optionally set role.
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <input
              className={field()}
              placeholder="email@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <input
              className={field()}
              placeholder="password (leave blank = auto)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="text"
            />
            <select
              className={field()}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
            >
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
            <button
              disabled={pending}
              onClick={() => startTransition(onCreate)}
              className="rounded-2xl bg-[rgb(var(--fg))] px-4 py-2 text-xs font-semibold text-[rgb(var(--bg))] transition hover:opacity-90 disabled:opacity-60 active:scale-[0.99]"
            >
              Create
            </button>
          </div>
        </div>

        {msg && (
          <div className="mt-3 rounded-2xl border border-[rgb(var(--glass-border))] bg-white/10 px-3 py-2 text-sm">
            {msg}
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-semibold">Registered users</div>
          <input
            className={field()}
            placeholder="Search email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs muted">
              <tr>
                <th className="py-2 text-left">Email</th>
                <th className="py-2 text-left">Role</th>
                <th className="py-2 text-left">Created</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-white/10">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{u.email}</div>
                    <div className="text-xs muted">{u.id}</div>
                  </td>

                  <td className="py-3 pr-4">
                    <select
                      className={field()}
                      value={u.role}
                      onChange={(e) =>
                        onChangeRole(u.id, e.target.value as any)
                      }
                      disabled={pending}
                    >
                      <option value="member">member</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>

                  <td className="py-3 pr-4 text-xs muted">
                    {new Date(u.createdAt).toLocaleString()}
                  </td>

                  <td className="py-3 text-right">
                    <button
                      disabled={pending}
                      onClick={() => startTransition(() => onDelete(u.id))}
                      className="rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:opacity-90 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {!filtered.length && (
                <tr>
                  <td className="py-6 text-sm muted" colSpan={4}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

function field() {
  return [
    "rounded-2xl border border-[rgb(var(--glass-border))] bg-white/10 px-3 py-2 text-sm outline-none",
    "backdrop-blur-xl transition focus:hover-surface-2",
  ].join(" ");
}
