// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/siteSettings";
import SiteHeader from "@/components/SiteHeader";
import { Providers } from "./providers";
import { GoogleAnalytics } from "@next/third-parties/google";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const siteTitle =
    (settings as any)?.siteTitle ||
    (settings as any)?.siteName ||
    "Photo Portfolio";

  const siteName = (settings as any)?.siteName || siteTitle;

  const siteUrl =
    (settings as any)?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || undefined;

  const titleTemplate = (settings as any)?.titleTemplate || `%s | ${siteName}`;

  const description =
    (settings as any)?.defaultDescription ||
    "A minimal, modern photo portfolio built with React + Next.js.";

  const ogImage = (settings as any)?.defaultOgImageUrl || undefined;

  const globalNoindex = Boolean((settings as any)?.globalNoindex);

  return {
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    title: {
      default: siteTitle,
      template: titleTemplate,
    },
    description,
    robots: {
      index: !globalNoindex,
      follow: !globalNoindex,
    },
    alternates: {
      canonical: siteUrl ? new URL(siteUrl).toString() : undefined,
    },
    openGraph: {
      title: siteTitle,
      description,
      siteName,
      url: siteUrl,
      type: "website",
      images: ogImage ? [{ url: ogImage, alt: siteTitle }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description,
      images: ogImage ? [ogImage] : undefined,
      site: (settings as any)?.twitterHandle || undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="min-h-dvh bg-[rgb(var(--bg))] text-[rgb(var(--fg))] antialiased">
        <Providers>
          <div className="relative min-h-dvh">
            {/* Ambient page glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-fuchsia-400/15 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 right-0 h-80 w-80 rounded-full bg-cyan-400/12 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl"
            />

            {/* HEADER */}
            <SiteHeader />

            {/* MAIN */}
            <main className="relative mx-auto max-w-400 px-4 py-10">
              {children}
            </main>

            {/* FOOTER */}
            <footer className="relative mx-auto max-w-400 px-4 pb-10 pt-6 text-xs text-zinc-700/70 dark:text-white/55">
              <div className="rounded-2xl border border-black/5 bg-white/60 px-4 py-3 backdrop-blur-2xl shadow-[0_14px_40px_-30px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-white/6">
                © {new Date().getFullYear()} — Cre8 Photography
              </div>
            </footer>
          </div>
        </Providers>

        {/* Analytics (placed inside body) */}
        <GoogleAnalytics gaId="G-T1S746TDTW" />
      </body>
    </html>
  );
}
