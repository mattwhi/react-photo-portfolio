import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageBuilderClient } from "./pageBuilderClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminPageEditor({ params }: Props) {
  const { id } = await params;

  const page = await prisma.blogPage.findUnique({
    where: { id },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });

  if (!page) return notFound();

  return <PageBuilderClient page={page} />;
}
