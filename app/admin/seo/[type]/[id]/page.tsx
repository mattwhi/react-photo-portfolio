import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SeoEntityType } from "@prisma/client";
import SeoForm from "./seo-form";

type Props = {
  params: Promise<{ type: string; id: string }>;
};

export default async function AdminSeoEdit({ params }: Props) {
  const { type: rawType, id } = await params;

  const type = rawType.toUpperCase() as SeoEntityType;
  if (!Object.values(SeoEntityType).includes(type)) return notFound();

  // optional: show entity title in UI
  const entityTitle =
    type === SeoEntityType.GALLERY
      ? (
          await prisma.gallery.findUnique({
            where: { id },
            select: { title: true, slug: true },
          })
        )?.title ?? "Gallery"
      : "Item";

  const seo = await prisma.seoMeta.findUnique({
    where: { entityType_entityId: { entityType: type, entityId: id } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit SEO: {entityTitle}</h1>
      <SeoForm entityType={type} entityId={id} initial={seo} />
    </div>
  );
}
