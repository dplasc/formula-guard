import { createBrowserClient } from '@supabase/ssr';

// Singleton klijent za frontend - koristi @supabase/ssr
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );