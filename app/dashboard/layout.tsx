import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/verify-email-guard';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get authenticated user and verification status
  const user = await getAuthenticatedUser();

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
  // If no formulas exist AND user is verified, redirect to onboarding
  // If user is not verified, let them see dashboard in read-only mode
  if (!error && (!data || data.length === 0) && user.isVerified) {
    redirect('/onboarding');
  }

  return (
    <>
      {!user.isVerified && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">Email not verified</h3>
              <p className="text-sm text-yellow-700">Verify your email to create, save, or export formulas.</p>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}


