import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

function safeFilename(name: string) {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const stamp = Date.now().toString(36);
  return `${stamp}_${base}`;
}

export async function POST(req: Request) {
  const form = await req.formData();
  const galleryId = String(form.get("galleryId") ?? "");
  const description = String(form.get("description") ?? "").trim() || null;

  if (!galleryId) {
    return NextResponse.json({ error: "Missing galleryId" }, { status: 400 });
  }

  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  if (!gallery) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }

  const files = form.getAll("files");
  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "uploads", gallery.slug);
  await fs.mkdir(dir, { recursive: true });

  const created = [];

  for (const f of files) {
    if (!(f instanceof File)) continue;
    if (!f.type.startsWith("image/")) continue;

    const arrayBuffer = await f.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filename = safeFilename(f.name || "upload.jpg");
    const filepath = path.join(dir, filename);

    await fs.writeFile(filepath, buffer);

    const url = `/uploads/${gallery.slug}/${filename}`;

    const photo = await prisma.photo.create({
      data: {
        galleryId,
        url,
        description,
        title: null,
      },
    });

    created.push(photo.id);
  }

  return NextResponse.json({ ok: true, createdCount: created.length });
}
