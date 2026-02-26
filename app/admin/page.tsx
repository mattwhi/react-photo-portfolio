// app/admin/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { GlassCard } from "@/components/GlassCard";

export const runtime = "nodejs";

export default async function AdminDashboardPage() {
  const [users, galleries, photos, posts, recentUsers, recentPhotos] =
    await Promise.all([
      prisma.user.count(),
      prisma.gallery.count(),
      prisma.photo.count(),
      prisma.blogPage.count(), // or filter published if you want
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, email: true, role: true, createdAt: true },
      }),
      prisma.photo.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          url: true,
          title: true,
          createdAt: true,
          gallery: { select: { slug: true, title: true } },
        },
      }),
    ]);

  const Stat = ({
    label,
    value,
    href,
  }: {
    label: string;
    value: number;
    href: string;
  }) => (
    <Link href={href} className="block">
      <GlassCard className="p-5 hover:hover-surface transition">
        <div className="text-xs muted">{label}</div>
        <div className="mt-2 text-3xl font-semibold tracking-tight">
          {value}
        </div>
        <div className="mt-2 text-xs muted">View →</div>
      </GlassCard>
    </Link>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Admin overview
        </h1>
        <p className="mt-1 text-sm muted">
          Quick snapshot of what’s happening on the site.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-5">
        <Stat label="Users" value={users} href="/admin/users" />
        <Stat label="Galleries" value={galleries} href="/admin/galleries" />
        <Stat label="Photos" value={photos} href="/admin/galleries" />
        <Stat label="Blog pages" value={posts} href="/admin/pages" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent users</h2>
            <Link className="text-xs underline" href="/admin/users">
              Manage
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {recentUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{u.email}</div>
                  <div className="text-xs muted">
                    {u.role} • {u.createdAt.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {!recentUsers.length && (
              <div className="text-sm muted">No users yet.</div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent uploads</h2>
            <Link className="text-xs underline" href="/admin/galleries">
              View galleries
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {recentPhotos.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {p.title || "Untitled photo"}
                  </div>
                  <div className="text-xs muted">
                    {p.gallery.title} • {p.createdAt.toLocaleString()}
                  </div>
                </div>
                <Link
                  className="text-xs underline"
                  href={`/g/${p.gallery.slug}`}
                >
                  View
                </Link>
              </div>
            ))}
            {!recentPhotos.length && (
              <div className="text-sm muted">No uploads yet.</div>
            )}
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
