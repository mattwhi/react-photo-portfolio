import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminPagesIndex() {
  const pages = await prisma.blogPage.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Blog Pages</h1>
        <Link
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10"
          href="/admin/pages/new"
        >
          + Add new page
        </Link>
      </div>

      <div className="grid gap-3">
        {pages.map((p) => (
          <Link
            key={p.id}
            href={`/admin/pages/${p.id}`}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-medium">{p.title}</div>
                <div className="text-sm text-white/60">/blog/{p.slug}</div>
              </div>
              <div className="text-sm text-white/70">{p.status}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
