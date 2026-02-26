// app/admin/layout.tsx
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionStrict } from "@/lib/securityStrict";

export const runtime = "nodejs";

async function getAdminPath() {
  const h = await headers();
  return h.get("x-admin-path") || "/admin/galleries";
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentPath = await getAdminPath();

  // ✅ IMPORTANT: don't guard the login page (prevents redirect loop)
  if (currentPath.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  const token = (await cookies()).get("pp_session")?.value;

  // Middleware should already redirect if missing, but keep as a backstop
  if (!token) {
    redirect(`/admin/login?next=${encodeURIComponent(currentPath)}`);
  }

  try {
    const session = await verifySessionStrict(token);

    if (session.role !== "admin") {
      redirect("/");
    }
  } catch {
    redirect(`/admin/login?next=${encodeURIComponent(currentPath)}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="glass h-fit p-4">
        <div className="text-sm font-semibold tracking-tight">Admin</div>

        <nav className="mt-3 flex flex-col gap-1 text-sm">
          <Link
            className="rounded-2xl px-3 py-2 transition hover:backdrop-blur-xl hover:hover-surface"
            href="/admin"
          >
            Overview
          </Link>
          <Link
            className="rounded-2xl px-3 py-2 transition hover:backdrop-blur-xl hover:hover-surface"
            href="/admin/users"
          >
            Users
          </Link>
          <Link
            className="rounded-2xl px-3 py-2 transition hover:backdrop-blur-xl hover:hover-surface"
            href="/admin/galleries"
          >
            Galleries
          </Link>
          <Link
            className="rounded-2xl px-3 py-2 transition hover:backdrop-blur-xl hover:hover-surface"
            href="/admin/media"
          >
            Media Library
          </Link>
          <Link
            className="rounded-2xl px-3 py-2 transition hover:backdrop-blur-xl hover:hover-surface"
            href="/admin/upload"
          >
            Upload
          </Link>
          <Link
            className="rounded-2xl px-3 py-2 transition hover:backdrop-blur-xl hover:hover-surface"
            href="/admin/pages"
          >
            Posts
          </Link>
          <Link
            className="rounded-2xl px-3 py-2 transition hover:backdrop-blur-xl hover:hover-surface"
            href="/"
          >
            View site
          </Link>
          <Link
            className="rounded-2xl px-3 py-2 transition hover:backdrop-blur-xl hover:hover-surface"
            href="/admin/settings"
          >
            Settings
          </Link>
          <Link
            className="rounded-2xl px-3 py-2 transition hover:backdrop-blur-xl hover:hover-surface"
            href="/admin/seo"
          >
            SEO
          </Link>
        </nav>

        <div className="mt-4 rounded-2xl border border-[rgb(var(--glass-border))] bg-white/10 p-2">
          <form action="/api/auth/logout" method="post">
            <button className="w-full rounded-2xl bg-[rgb(var(--fg))] px-3 py-2 text-xs font-semibold text-[rgb(var(--bg))] transition hover:opacity-90 active:scale-[0.99]">
              Log out
            </button>
          </form>

          <p className="mt-2 px-1 text-[11px] muted">
            You&apos;re in the admin area.
          </p>
        </div>
      </aside>

      <section>{children}</section>
    </div>
  );
}
