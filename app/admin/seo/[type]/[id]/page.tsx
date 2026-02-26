import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SeoEntityType } from "@prisma/client";
import SeoForm from "./seo-form";

export default async function AdminSeoEdit({
  params,
}: {
  params: { type: string; id: string };
}) {
  const type = params.type.toUpperCase() as SeoEntityType;

  if (!Object.values(SeoEntityType).includes(type)) return notFound();

  // optional: show entity title in UI
  const entityTitle =
    type === SeoEntityType.GALLERY
      ? (
          await prisma.gallery.findUnique({
            where: { id: params.id },
            select: { title: true, slug: true },
          })
        )?.title
      : "Item";

  const seo = await prisma.seoMeta.findUnique({
    where: { entityType_entityId: { entityType: type, entityId: params.id } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit SEO: {entityTitle}</h1>
      <SeoForm entityType={type} entityId={params.id} initial={seo} />
    </div>
  );
}
