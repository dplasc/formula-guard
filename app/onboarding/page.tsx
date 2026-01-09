import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireEmailVerification } from '@/lib/auth/verify-email-guard';
import { createClient } from '@/lib/supabase/server';

export default async function OnboardingPage() {
  // Enforce email verification
  const user = await requireEmailVerification();
  if (!user) redirect('/auth');

  // Check if user already has formulas
  const supabase = await createClient();
  const { data: formulas, error: queryError } = await supabase
    .from('formulas')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  // If user has >= 1 formula, redirect to dashboard
  if (!queryError && formulas && formulas.length >= 1) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to FormulaGuard
        </h1>
        <p className="text-gray-600 mb-8">
          Create your first cosmetic formula to get started. Our formula builder will guide you through the process.
        </p>
        <Link
          href="/builder"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
        >
          Create Your First Formula
        </Link>
      </div>
    </div>
  );
}

