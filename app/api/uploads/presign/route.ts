import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";

const PUBLIC_BASE = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

function publicUrlFromKey(key: string) {
  const clean = String(key || "").replace(/^\/+/, "");
  return PUBLIC_BASE && clean ? `${PUBLIC_BASE}/${clean}` : "";
}

function safeName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: Request) {
  const { filename, contentType, folder } = await req.json();

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "filename and contentType required" },
      { status: 400 }
    );
  }

  const accountId = process.env.R2_ACCOUNT_ID!;
  const bucket = process.env.R2_BUCKET!;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const cleanFolder = String(folder || "media").replace(/^\/+|\/+$/g, "");
  const key = `media/${cleanFolder}/${crypto.randomUUID()}-${safeName(
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
