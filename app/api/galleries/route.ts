import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";

export async function GET() {
  await requireAdmin();
  const galleries = await prisma.gallery.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, slug: true },
  });
  return NextResponse.json({ galleries });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim() || null;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const slug = toSlug(title);

  const exists = await prisma.gallery.findUnique({ where: { slug } });
  if (exists) {
    return NextResponse.json(
      { error: "A gallery with this title/slug already exists" },
      { status: 409 }
    );
  }

  await prisma.gallery.create({ data: { title, description, slug } });

  return NextResponse.redirect(new URL("/admin/galleries", req.url));
}
