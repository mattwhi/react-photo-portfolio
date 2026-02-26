"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { SocialIcon } from "@/components/social-icons";
import { ThemeToggle } from "@/components/ThemeToggle";

type NavLink = { label: string; href: string };

function isAdminHref(href: string) {
  return href.startsWith("/admin");
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeaderClient({
  isAuthed,
  siteTitle,
  logoUrl,
  logoAlt,
  logoTitle,
  navLinks,
  socialLinks,
}: {
  isAuthed: boolean;
  siteTitle: string;
  logoUrl?: string | null;
  logoAlt?: string | null;
  logoTitle?: string | null;
  navLinks: NavLink[];
  socialLinks: Record<string, string>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const socials = useMemo(
    () =>
      Object.entries(socialLinks || {}).filter(
        ([, url]) => typeof url === "string" && url.trim().length > 0
      ),
    [socialLinks]
  );

  const visibleNav = useMemo(() => {
    const filtered = navLinks.filter((l) =>
      isAuthed ? true : !isAdminHref(l.href)
    );

    // Helpful fallback: if logged in and there is no admin link in settings, add one.
    if (isAuthed && !filtered.some((l) => isAdminHref(l.href))) {
      filtered.push({ label: "Admin", href: "/admin/galleries" });
    }
    return filtered;
  }, [navLinks, isAuthed]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={[
        "sticky top-0 z-50",
        "border-b transition-all",
        "backdrop-blur-xl",
        // Dark-first premium glass
        scrolled
          ? "border-white/10 bg-black/55 shadow-[0_18px_55px_rgba(0,0,0,0.45)]"
          : "border-white/10 bg-black/30",
      ].join(" ")}
    >
      {/* subtle neon edge (keeps it high-end, not loud) */}
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute inset-x-0 top-0 h-px",
          "bg-linear-to-r from-transparent via-white/25 to-transparent",
        ].join(" ")}
      />
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute inset-x-0 bottom-0 h-px",
          "bg-linear-to-r from-transparent via-fuchsia-400/20 to-transparent",
        ].join(" ")}
      />

      <div className="mx-auto flex max-w-400 items-center justify-between gap-4 px-5 py-4 md:px-8">
        {/* Brand (logo only) */}
        <a
          href="/"
          className="group flex items-center gap-3"
          title={logoTitle ?? siteTitle ?? undefined}
          aria-label={siteTitle}
        >
          {logoUrl ? (
            <span className="relative h-21 w-21 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              <Image
                src={logoUrl}
                alt={logoAlt ?? "Logo"}
                fill
                className="object-cover"
                sizes="200px"
                priority
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10"
              />
            </span>
          ) : (
            <span className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              <span className="h-2.5 w-2.5 rounded-full bg-white/80 shadow-[0_0_20px_rgba(255,255,255,0.35)]" />
            </span>
          )}

          {/* no visible brand text, but keep accessible title */}
          <span className="sr-only">{siteTitle}</span>

          {/* tiny “premium hint” sparkle */}
          <span
            aria-hidden
            className="hidden md:block h-1.5 w-1.5 rounded-full bg-fuchsia-300/70 shadow-[0_0_18px_rgba(217,70,239,0.45)] opacity-0 group-hover:opacity-100 transition"
          />
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center">
          <div className="rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
            <div className="flex items-center gap-1">
              {visibleNav.map((l) => {
                const active = isActivePath(pathname, l.href);
                return (
                  <a
                    key={`${l.label}-${l.href}`}
                    href={l.href}
                    className={[
                      "relative rounded-full px-4 py-2 text-sm font-medium transition",
                      active
                        ? "text-white bg-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.30)]"
                        : "text-white/70 hover:text-white hover:bg-white/8",
                    ].join(" ")}
                  >
                    {l.label}
                    {active ? (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-3 -bottom-0.5 h-px bg-linear-to-r from-transparent via-white/35 to-transparent"
                      />
                    ) : null}
                  </a>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Desktop right side */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Socials */}
          <div className="flex items-center gap-1">
            {socials.slice(0, 6).map(([key, url]) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noreferrer"
                className={[
                  "group rounded-full border border-white/10 bg-white/5 p-2.5",
                  "text-white/70 hover:text-white hover:bg-white/8",
                  "transition shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
                ].join(" ")}
                aria-label={key}
                title={key}
              >
                <span className="block transition group-hover:scale-[1.06]">
                  <SocialIcon name={key} />
                </span>
              </a>
            ))}
          </div>

          {/* Auth button */}
          {isAuthed ? (
            <form action="/api/auth/logout" method="post" className="ml-1">
              <button
                className={[
                  "rounded-full px-4 py-2 text-xs font-semibold",
                  "border border-white/10 bg-white/5 text-white/90",
                  "hover:bg-white/10 transition",
                  "shadow-[0_14px_40px_rgba(0,0,0,0.30)]",
                ].join(" ")}
              >
                Log out
              </button>
            </form>
          ) : (
            <a
              href="/admin/login"
              className={[
                "ml-1 rounded-full px-4 py-2 text-xs font-semibold",
                "border border-fuchsia-300/20 bg-linear-to-r from-fuchsia-500/25 to-cyan-400/15",
                "text-white hover:from-fuchsia-500/30 hover:to-cyan-400/20 transition",
                "shadow-[0_14px_45px_rgba(0,0,0,0.35)]",
              ].join(" ")}
            >
              Sign in
            </a>
          )}

          {/* Theme toggle */}
          <div className="ml-1 rounded-full border border-white/10 bg-white/5 p-1 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile button */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={[
            "md:hidden rounded-2xl px-3.5 py-2.5 text-sm",
            "border border-white/10 bg-white/5 text-white/80",
            "hover:bg-white/10 transition",
            "shadow-[0_12px_35px_rgba(0,0,0,0.35)]",
          ].join(" ")}
          aria-label="Open menu"
        >
          ☰
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div
            className={[
              "fixed right-3 top-3 z-50 w-[92%] max-w-sm",
              "rounded-3xl border border-white/10 bg-black/70 backdrop-blur-2xl",
              "p-4 shadow-[0_30px_120px_rgba(0,0,0,0.55)]",
            ].join(" ")}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white/90">
                {siteTitle}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 grid gap-2">
              {visibleNav.map((l) => {
                const active = isActivePath(pathname, l.href);
                return (
                  <a
                    key={`${l.label}-${l.href}-m`}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "rounded-2xl px-3 py-2 text-sm font-medium transition",
                      active
                        ? "bg-white/10 text-white border border-white/10"
                        : "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10",
                    ].join(" ")}
                  >
                    {l.label}
                  </a>
                );
              })}
            </div>

            {!!socials.length && (
              <div className="mt-4">
                <div className="text-xs text-white/55">Social</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {socials.map(([key, url]) => (
                    <a
                      key={`${key}-m`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10 transition"
                      aria-label={key}
                      title={key}
                    >
                      <SocialIcon name={key} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 grid gap-2">
              {isAuthed ? (
                <form action="/api/auth/logout" method="post">
                  <button className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition">
                    Log out
                  </button>
                </form>
              ) : (
                <a
                  href="/admin/login"
                  className="block w-full rounded-2xl border border-fuchsia-300/20 bg-linear-to-r from-fuchsia-500/25 to-cyan-400/15 px-4 py-3 text-center text-sm font-semibold text-white hover:from-fuchsia-500/30 hover:to-cyan-400/20 transition"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </a>
              )}

              <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
