import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageBuilderClient } from "./pageBuilderClient";

export default async function AdminPageEditor({
  params,
}: {
  params: { id: string };
}) {
  const page = await prisma.blogPage.findUnique({
    where: { id: params.id },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });

  if (!page) return notFound();

  return <PageBuilderClient page={page} />;
}
