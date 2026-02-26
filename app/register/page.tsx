// app/register/page.tsx
import RegisterClient from "./RegisterClient";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const nextUrl = sp.next ?? "/";

  return <RegisterClient nextUrl={nextUrl} />;
}
