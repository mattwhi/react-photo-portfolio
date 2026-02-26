import { getSiteSettings } from "@/lib/siteSettings";
import AdminSettingsForm from "@/components/AdminSettingsForm";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  return <AdminSettingsForm initial={settings as any} />;
}
