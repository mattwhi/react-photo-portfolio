// app/login/page.tsx
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{
    next?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const sp = searchParams ? await searchParams : {};
  const next = sp.next ?? "/";
  const error = sp.error ?? "";

  return <LoginClient nextUrl={next} error={error} />;
}
