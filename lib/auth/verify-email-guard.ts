import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Server-side guard to enforce email verification.
 * Redirects unverified users to /verify-email.
 * Returns user if verified, null if not authenticated.
 */
export async function requireEmailVerification(): Promise<{ id: string; email: string } | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // If not authenticated, return null (caller can handle redirect to /auth)
  if (error || !user) {
    return null;
  }

  // If authenticated but email not confirmed, redirect to verify-email
  if (!user.email_confirmed_at) {
    redirect('/verify-email');
  }

  // User is authenticated and verified
  return {
    id: user.id,
    email: user.email || '',
  };
}

