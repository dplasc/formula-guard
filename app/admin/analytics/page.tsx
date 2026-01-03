import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRole } from "../actions";

export default async function AnalyticsPage() {
  const supabase = await createSupabaseServerClient();
  
  // Get user via cookie-aware server client
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // If no user -> redirect to auth
  if (authError || !user) {
    redirect("/auth?mode=login&next=/admin/analytics");
  }

  // Get role using robust lookup (handles both user_id and id schemas)
  const role = await getUserRole();

  // If not super_admin -> redirect to dashboard
  if (role !== "super_admin") {
    redirect("/dashboard");
  }

  // Use admin client for read-only queries (bypasses RLS)
  const adminClient = createAdminClient();

  // Calculate date thresholds
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch all metrics
  const [
    { count: totalUsers },
    { count: newUsers7Days },
    { count: newUsers30Days },
    { count: totalFormulas },
    { count: newFormulas7Days },
    { count: newFormulas30Days },
  ] = await Promise.all([
    adminClient.from('profiles').select('*', { count: 'exact', head: true }),
    adminClient.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
    adminClient.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
    adminClient.from('formulas').select('*', { count: 'exact', head: true }),
    adminClient.from('formulas').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
    adminClient.from('formulas').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
  ]);

  const metrics = [
    { label: 'Total users', value: totalUsers || 0 },
    { label: 'New users (last 7 days)', value: newUsers7Days || 0 },
    { label: 'New users (last 30 days)', value: newUsers30Days || 0 },
    { label: 'Total formulas', value: totalFormulas || 0 },
    { label: 'New formulas (last 7 days)', value: newFormulas7Days || 0 },
    { label: 'New formulas (last 30 days)', value: newFormulas30Days || 0 },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">Founder Analytics</h1>
      <p className="mt-2 text-gray-600">
        Core usage metrics
      </p>

      <div className="mt-8">
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Metric</th>
              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Value</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-200 px-4 py-3 text-gray-700">{metric.label}</td>
                <td className="border border-gray-200 px-4 py-3 font-medium text-gray-900">{metric.value.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

