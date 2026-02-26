// app/admin/users/page.tsx
import { prisma } from "@/lib/prisma";
import UsersTable from "@/components/admin/UsersTable";

export const runtime = "nodejs";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, createdAt: true },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm muted">
          View, create, update roles, and remove users.
        </p>
      </div>

      <UsersTable initialUsers={users} />
    </div>
  );
}
