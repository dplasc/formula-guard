import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase browser client that uses cookie-based authentication.
 * This ensures the session is accessible to both client and server components.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

