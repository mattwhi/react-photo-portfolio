import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";

const PUBLIC_BASE = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

function publicUrlFromKey(key: string) {
  const clean = String(key || "").replace(/^\/+/, "");
  return PUBLIC_BASE && clean ? `${PUBLIC_BASE}/${clean}` : "";
}

function safeName(name: string) {
  const cleaned = String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\-+|\-+$/g, "");

  return cleaned || "file";
}

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function POST(req: Request) {
  await requireAdmin();

  const body = (await req.json().catch(() => null)) as {
    filename?: string;
    contentType?: string;
    folder?: string;
  } | null;

  const filename = String(body?.filename || "").trim();
  const contentType = String(body?.contentType || "").trim();
  const folder = String(body?.folder || "").trim();

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "filename and contentType required" },
      { status: 400 }
    );
  }

  // Optional safety: only allow images
  if (!contentType.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image/* content types are allowed" },
      { status: 400 }
    );
  }

  let accountId: string,
    bucket: string,
    accessKeyId: string,
    secretAccessKey: string;
  try {
    accountId = getEnv("R2_ACCOUNT_ID");
    bucket = getEnv("R2_BUCKET");
    accessKeyId = getEnv("R2_ACCESS_KEY_ID");
    secretAccessKey = getEnv("R2_SECRET_ACCESS_KEY");
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Server misconfigured",
        message: process.env.NODE_ENV !== "production" ? e?.message : undefined,
      },
      { status: 500 }
    );
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  // Base prefix is always "media"
  const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
  const folderPrefix = cleanFolder ? `${cleanFolder}/` : "";
  const key = `media/${folderPrefix}${crypto.randomUUID()}-${safeName(
    filename
  )}`;

  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, cmd, { expiresIn: 60 });
  const publicUrl = publicUrlFromKey(key);

  return NextResponse.json({ key, uploadUrl, publicUrl });
}
