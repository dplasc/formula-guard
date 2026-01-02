import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteSettings, getUserRole } from "./actions";
import SiteSettingsForm from "./SiteSettingsForm";
import AnnouncementsSection from "./AnnouncementsSection";
import PlanManagement from "./PlanManagement";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  
  // Get user via cookie-aware server client
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // If no user -> redirect to auth
  if (authError || !user) {
    redirect("/auth?mode=login&next=/admin");
  }

  // Get role using robust lookup (handles both user_id and id schemas)
  const role = await getUserRole();

  // If not super_admin -> redirect to dashboard
  if (role !== "super_admin") {
    redirect("/dashboard");
  }

  // Fetch site settings
  const settingsResult = await getSiteSettings();
  const siteSettings = settingsResult.settings ?? {};

  // Render admin UI
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">Admin</h1>
      <p className="mt-2 text-gray-600">
        Signed in as <span className="font-medium">{user.email}</span> ({role})
      </p>

      <div className="mt-8 space-y-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Site Settings</h2>
          <SiteSettingsForm initialSettings={siteSettings} />
        </div>

        <PlanManagement />

        <AnnouncementsSection />
      </div>
    </div>
  );
}

