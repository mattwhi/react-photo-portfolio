import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const gallery = await prisma.gallery.findUnique({
    where: { slug: params.slug },
    select: { title: true, description: true },
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 64,
          background: "black",
          color: "white",
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700 }}>
          {gallery?.title ?? "Gallery"}
        </div>
        <div style={{ fontSize: 28, opacity: 0.85, marginTop: 16 }}>
          {gallery?.description ?? ""}
        </div>
      </div>
    ),
    size
  );
}
