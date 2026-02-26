import { S3Client } from "@aws-sdk/client-s3";

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export const R2_BUCKET = must("R2_BUCKET");

export const r2 = new S3Client({
  region: "auto", // required by SDK, used by R2 as "auto" :contentReference[oaicite:8]{index=8}
  endpoint: `https://${must("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: must("R2_ACCESS_KEY_ID"),
    secretAccessKey: must("R2_SECRET_ACCESS_KEY"),
  },
});
