import { redirect } from 'next/navigation';
import { requireEmailVerification } from '@/lib/auth/verify-email-guard';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce email verification for dashboard
  const user = await requireEmailVerification();

  // If not authenticated, redirect to auth
  if (!user) {
    redirect('/auth');
  }

  // Check if user has any formulas
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('formulas')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  // On query error, allow access (fail open to avoid blocking users)
  // If no formulas exist, redirect to onboarding
  if (!error && (!data || data.length === 0)) {
    redirect('/onboarding');
  }

  return <>{children}</>;
}


