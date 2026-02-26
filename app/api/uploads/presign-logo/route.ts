import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireAdmin } from "@/lib/requireAdmin";
import { r2, R2_BUCKET } from "@/lib/r2";
import crypto from "node:crypto";

export const runtime = "nodejs";

function extFromName(name: string) {
  const parts = name.split(".");
  const ext = parts.length > 1 ? parts.pop() : "png";
  return String(ext || "png").toLowerCase();
}

export async function POST(req: Request) {
  await requireAdmin();

  const body = (await req.json().catch(() => null)) as {
    filename?: string;
    contentType?: string;
  } | null;

  const filename = body?.filename ?? "logo.png";
  const contentType = body?.contentType ?? "image/png";

  const key = `brand/logo_${Date.now()}_${crypto.randomUUID()}.${extFromName(
    filename
  )}`;

  const cmd = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
    CacheControl: "public, max-age=3600",
  });

  const uploadUrl = await getSignedUrl(r2, cmd, { expiresIn: 60 * 10 });

  const publicBase = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (!publicBase)
    return NextResponse.json(
      { error: "R2_PUBLIC_BASE_URL not set" },
      { status: 500 }
    );

  const publicUrl = `${publicBase}/${key}`;

  return NextResponse.json({ key, uploadUrl, publicUrl });
}
