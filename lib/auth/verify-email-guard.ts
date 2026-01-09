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

/**
 * Get authenticated user and verification status without redirecting.
 * Returns null if not authenticated, otherwise returns user info with isVerified flag.
 */
export async function getAuthenticatedUser(): Promise<{ id: string; email: string; isVerified: boolean } | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // If not authenticated, return null
  if (error || !user) {
    return null;
  }

  // Return user with verification status
  return {
    id: user.id,
    email: user.email || '',
    isVerified: !!(user.email_confirmed_at || (user as any).confirmed_at),
  };
}

/**
 * Check if current user is verified. Throws error if not authenticated.
 * Use this in server actions/API routes to enforce verification for write operations.
 */
export async function requireVerifiedUser(): Promise<{ id: string; email: string }> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }
  
  if (!user.isVerified) {
    throw new Error('EMAIL_NOT_VERIFIED');
  }
  
  return {
    id: user.id,
    email: user.email,
  };
}

