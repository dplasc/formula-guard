/**
 * Standalone Supabase admin client for CLI scripts
 * Uses service role key for administrative operations
 * This client does NOT require cookies() or headers() from Next.js
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase admin client using service role key
 * This bypasses RLS and should only be used in server-side scripts
 * 
 * Required environment variables:
 * - SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 * - SUPABASE_SERVICE_ROLE_KEY
 * 
 * @returns Supabase client instance
 * @throws Error if required environment variables are missing
 */
export function createAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Please set it in your .env file or environment.'
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
      'This is required for CLI scripts. Please set it in your .env file or environment.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}



