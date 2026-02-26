import { getSiteSettings } from "@/lib/siteSettings";
import { SiteHeaderClient } from "@/components/SiteHeaderClient";
import { getSession } from "@/lib/session";

export default async function SiteHeader() {
  const settings: any = await getSiteSettings();
  const session = await getSession();

  const navLinks = Array.isArray(settings.navLinks) ? settings.navLinks : [];
  const socialLinks = (settings.socialLinks ?? {}) as Record<string, string>;

  return (
    <SiteHeaderClient
      isAuthed={!!session}
      siteTitle={settings.siteTitle ?? "Photo Portfolio"}
      logoUrl={settings.logoUrl ?? null}
      logoAlt={settings.logoAlt ?? null}
      logoTitle={settings.logoTitle ?? null}
      navLinks={navLinks}
      socialLinks={socialLinks}
    />
  );
}
