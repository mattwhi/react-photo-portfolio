import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  await prisma.gallery.delete({ where: { id: params.id } });
  return NextResponse.redirect(
    new URL("/admin/galleries", "http://localhost:3000")
  );
}
