import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "node:fs";
import { requireAdmin, AuthError } from "@/lib/requireAdmin";
import path from "node:path";

export const runtime = "nodejs";

function safeFilename(name: string) {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const stamp = Date.now().toString(36);
  return `${stamp}_${base}`;
}

function filePathFromUrl(url: string) {
  if (!url.startsWith("/uploads/")) return null;
  if (url.includes("..")) return null; // extra hardening
  const clean = url.replace(/^\/+/, "");
  return path.join(process.cwd(), "public", clean);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json(
      {
        error: "Unauthorized",
        message:
          process.env.NODE_ENV !== "production" && e instanceof Error
            ? e.message
            : undefined,
      },
      { status }
    );
  }

  try {
    const body = (await req.json().catch(() => null)) as {
      photoId?: string;
    } | null;
    const photoId = body?.photoId ? String(body.photoId) : "";

    if (!photoId) {
      return NextResponse.json({ error: "Missing photoId" }, { status: 400 });
    }

    const targetGallery = await prisma.gallery.findUnique({
      where: { id: params.id },
      select: { id: true, slug: true },
    });
    if (!targetGallery) {
      return NextResponse.json(
        { error: "Target gallery not found" },
        { status: 404 }
      );
    }

    const source = await prisma.photo.findUnique({
      where: { id: photoId },
      select: {
        id: true,
        url: true,
        title: true,
        description: true,
        r2Key: true,
      },
    });
    if (!source) {
      return NextResponse.json(
        { error: "Source photo not found" },
        { status: 404 }
      );
    }

    let newUrl = source.url;
    let newR2Key = source.r2Key ?? null;

    const srcPath = filePathFromUrl(source.url);
    if (srcPath) {
      // ensure file exists
      try {
        await fs.access(srcPath);
      } catch {
        return NextResponse.json(
          { error: "Source file missing on disk" },
          { status: 404 }
        );
      }

      const destDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        targetGallery.slug
      );
      await fs.mkdir(destDir, { recursive: true });

      const filename = safeFilename(path.basename(srcPath));
      const destPath = path.join(destDir, filename);

      await fs.copyFile(srcPath, destPath);

      newUrl = `/uploads/${targetGallery.slug}/${filename}`;
      newR2Key = null;
    }

    const created = await prisma.photo.create({
      data: {
        galleryId: targetGallery.id,
        url: newUrl,
        title: source.title ?? null,
        description: source.description ?? null,
        r2Key: newR2Key,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: created.id, url: newUrl });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Copy failed",
        message: process.env.NODE_ENV !== "production" ? e?.message : undefined,
      },
      { status: 500 }
    );
  }
}
