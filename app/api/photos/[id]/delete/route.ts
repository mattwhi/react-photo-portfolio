import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "node:fs";
import path from "node:path";
import { requireAdmin, AuthError } from "@/lib/requireAdmin";

export const runtime = "nodejs";

type Ctx = {
  params: Promise<{ id: string }>;
};

function filePathFromUrl(url: string) {
  if (!url.startsWith("/uploads/")) return null;
  if (url.includes("..")) return null;
  const clean = url.replace(/^\/+/, "");
  return path.join(process.cwd(), "public", clean);
}

export async function POST(req: Request, { params }: Ctx) {
  // auth guard (recommended)
  try {
    await requireAdmin();
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  const { id } = await params;

  try {
    const photo = await prisma.photo.findUnique({
      where: { id },
      select: { id: true, url: true },
    });

    if (!photo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // delete file if it’s a local /uploads/ path
    const fp = filePathFromUrl(photo.url);
    if (fp) {
      try {
        await fs.unlink(fp);
      } catch {
        // ignore missing file
      }
    }

    await prisma.photo.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Delete failed",
        message: process.env.NODE_ENV !== "production" ? e?.message : undefined,
      },
      { status: 500 }
    );
  }
}
