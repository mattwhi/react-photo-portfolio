import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: Ctx) {
  await requireAdmin();

  const { id } = await params;

  await prisma.gallery.delete({ where: { id } });

  // Redirect back to admin galleries (use request URL as base)
  return NextResponse.redirect(
    new URL("/admin/galleries", process.env.NEXT_PUBLIC_APP_URL)
  );
}
