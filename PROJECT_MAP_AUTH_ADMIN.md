# Project Map: Auth + Admin + Site Settings

## 1. Logged-in App Header

### File: `components/Header.tsx`
**What it does:** Client-side header component rendered on dashboard and logged-in pages. Shows navigation links, user menu, and announcement bell.
**Key lines:**
```16:64:components/Header.tsx
export default function Header({ hasUnsavedChanges = false }: HeaderProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ... mobile menu logic ...

  const navigationLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ];
```

**Used in:**
- `app/dashboard/page.tsx` (line 5, 12): `<Header />`
- `components/BuilderClient.tsx` (line 6): `<Header />`

**Role/User Info:**
- Uses `useAuth()` hook (line 16) which returns `{ user, loading }`
- `user` object from Supabase auth (has `email`, `id`, etc.)
- **NO role information available** in Header component or useAuth hook
- UserMenu component (line 116) only shows email, no role

---

### File: `hooks/useAuth.ts`
**What it does:** Client-side hook that provides current user via Supabase browser client.
**Key lines:**
```6:29:hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return { user, loading };
}
```

**Note:** Returns only `user` and `loading`. Does NOT fetch or return role from profiles table.

---

### File: `components/UserMenu.tsx`
**What it does:** Dropdown menu showing user email and sign-out button.
**Key lines:**
```8:49:components/UserMenu.tsx
export default function UserMenu() {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  // ... fetches user via supabase.auth.getUser() ...

  // Shows user.email only, no role info
```

**Note:** Does NOT display or fetch role information.

---

## 2. Admin Routing/Guard

### File: `app/admin/page.tsx`
**What it does:** Server-side admin page that checks authentication and super_admin role, then renders admin UI.
**Key lines:**
```7:32:app/admin/page.tsx
export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  
  // Get user via cookie-aware server client
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // If no user -> redirect to auth
  if (authError || !user) {
    redirect("/auth?mode=login&next=/admin");
  }

  // Fetch role via public.profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Normalize role
  const role = profile?.role ?? null;
  const normalizedRole = (role ?? "").trim();

  // If not super_admin -> redirect to dashboard
  if (normalizedRole !== "super_admin") {
    redirect("/dashboard");
  }
```

**Redirect paths:**
- Not logged in: `/auth?mode=login&next=/admin`
- Not super_admin: `/dashboard`

**⚠️ CONTRADICTION FOUND:**
- Line 22 uses `.eq("id", user.id)` but profiles table uses `user_id` as primary key (see migration)
- This will cause queries to fail or return null

---

### File: `app/admin/layout.tsx`
**What it does:** Layout wrapper that enforces email verification before admin pages load.
**Key lines:**
```3:12:app/admin/layout.tsx
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce email verification for admin
  await requireEmailVerification();

  return <>{children}</>;
}
```

---

### File: `app/admin/actions.ts`
**What it does:** Server actions for admin operations including `getUserRole()` and `requireSuperAdmin()`.
**Key lines:**
```12:32:app/admin/actions.ts
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    // If profile doesn't exist, return default 'user'
    return 'user';
  }

  return profile.role as UserRole;
}
```

**⚠️ CONTRADICTION FOUND:**
- Line 23 uses `.eq('id', user.id)` but profiles table column is `user_id`
- Same issue in `requireSuperAdmin()` function (line 47 calls getUserRole which has the bug)

---

## 3. Supabase Clients

### File: `lib/supabase/server.ts`
**What it does:** Creates server-side Supabase client using @supabase/ssr with Next.js cookies().
**Key lines:**
```1:33:lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            // In Server Actions, this is expected behavior.
          }
        },
      },
    }
  );
}

// Alias for consistency with naming conventions
export const createSupabaseServerClient = createClient;
```

**Confirmed:** Uses `@supabase/ssr` and `next/headers` cookies ✅

---

### File: `lib/supabase/client.ts`
**What it does:** Creates browser-side Supabase client using @supabase/ssr.
**Key lines:**
```1:12:lib/supabase/client.ts
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
```

**Confirmed:** Uses `@supabase/ssr` createBrowserClient ✅

---

## 4. Site Settings

### Table Name
**Confirmed:** `site_settings` (lowercase, with underscore)
- Migration: `supabase/migrations/20250111_create_admin_tables.sql` (line 29)
- Code references: `app/admin/actions.ts` (lines 122, 166), `lib/siteSettings.ts` (line 19)

---

### File: `lib/siteSettings.ts`
**What it does:** Public server action to read social links from site_settings (no auth required for reads).
**Key lines:**
```15:39:lib/siteSettings.ts
export async function getSocialLinks(): Promise<SocialLinks> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'social')
    .single();

  if (error || !data?.value) {
    return { facebook: '', instagram: '', tiktok: '', youtube: '' };
  }

  try {
    const parsed = JSON.parse(data.value);
    return {
      facebook: parsed.facebook || '',
      instagram: parsed.instagram || '',
      tiktok: parsed.tiktok || '',
      youtube: parsed.youtube || '',
    };
  } catch (e) {
    return { facebook: '', instagram: '', tiktok: '', youtube: '' };
  }
}
```

**Social links key:** `'social'` (line 21)
**Format:** JSON string stored in `value` column with keys: `facebook`, `instagram`, `tiktok`, `youtube`

---

### File: `app/admin/actions.ts`
**Read function:**
```109:142:app/admin/actions.ts
export async function getSiteSettings() {
  const supabase = await createClient();
  
  // Verify user is super_admin
  const role = await getUserRole();
  if (role !== 'super_admin') {
    return {
      error: 'Unauthorized',
      settings: null,
    };
  }

  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value');

  if (error) {
    return {
      error: error.message,
      settings: null,
    };
  }

  // Convert array to object for easier access
  const settings: Record<string, string> = {};
  data?.forEach((item) => {
    settings[item.key] = item.value || '';
  });

  return {
    error: null,
    settings,
  };
}
```

**Write function:**
```147:182:app/admin/actions.ts
export async function updateSiteSettings(settings: Record<string, string>) {
  const supabase = await createClient();
  
  // Verify user is super_admin
  const role = await getUserRole();
  if (role !== 'super_admin') {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  // Upsert each setting
  const updates = Object.entries(settings).map(([key, value]) => ({
    key,
    value: value || null,
  }));

  const { error } = await supabase
    .from('site_settings')
    .upsert(updates, { onConflict: 'key' });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath('/admin');
  
  return {
    success: true,
    error: null,
  };
}
```

**Used by:**
- `app/admin/page.tsx` (line 35): Calls `getSiteSettings()`
- `app/admin/SiteSettingsForm.tsx` (line 4, 83): Calls `updateSiteSettings()`

---

### File: `app/admin/SiteSettingsForm.tsx`
**What it does:** Client-side form component for editing site settings. Parses and saves social links as JSON.
**Key lines:**
```11:39:app/admin/SiteSettingsForm.tsx
export default function SiteSettingsForm({ initialSettings }: SiteSettingsFormProps) {
  // Parse social media links from JSON
  let parsedSocial = { facebook: '', instagram: '', tiktok: '', youtube: '' };
  if (initialSettings.social) {
    try {
      const parsed = JSON.parse(initialSettings.social);
      parsedSocial = {
        facebook: parsed.facebook || '',
        instagram: parsed.instagram || '',
        tiktok: parsed.tiktok || '',
        youtube: parsed.youtube || '',
      };
    } catch (e) {
      // Invalid JSON, use defaults
    }
  }

  // ... form state ...

  // Stringify social media links as JSON (line 81)
  const settingsToSave = {
    ...settings,
    social: JSON.stringify(social),
  };
```

**Note:** Form also saves other keys like `instagram_url`, `facebook_url`, `tiktok_url`, `linkedin_url`, `contact_email` separately (not in JSON).

---

## 5. RLS (Row Level Security)

### File: `supabase/migrations/20250111_create_admin_tables.sql`
**What it does:** Creates site_settings table and RLS policies.

**Table structure:**
```28:33:supabase/migrations/20250111_create_admin_tables.sql
-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**RLS Policies:**
```35:74:supabase/migrations/20250111_create_admin_tables.sql
-- Enable Row Level Security on site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can SELECT (public readable)
CREATE POLICY "Anyone can view site settings"
  ON site_settings
  FOR SELECT
  USING (true);

-- RLS Policy: Only super_admin can INSERT/UPDATE/DELETE
-- We'll use a function to check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policy: Only super_admin can INSERT
CREATE POLICY "Only super_admin can insert site settings"
  ON site_settings
  FOR INSERT
  WITH CHECK (is_super_admin());

-- RLS Policy: Only super_admin can UPDATE
CREATE POLICY "Only super_admin can update site settings"
  ON site_settings
  FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- RLS Policy: Only super_admin can DELETE
CREATE POLICY "Only super_admin can delete site settings"
  ON site_settings
  FOR DELETE
  USING (is_super_admin());
```

**RLS Analysis:**
- ✅ SELECT: Public (anyone can read) - This works for `getSocialLinks()` in `lib/siteSettings.ts`
- ⚠️ INSERT/UPDATE: Uses `is_super_admin()` function which queries `profiles.user_id`
- **Potential issue:** If the app code uses `.eq('id', user.id)` instead of `.eq('user_id', user.id)`, the queries might fail, but the RLS function uses the correct column name (`user_id`)

**Migrations folder:** `supabase/migrations/` (5 migration files total)
- `20250111_create_admin_tables.sql` contains site_settings table and RLS

---

## Summary of Contradictions

1. **CRITICAL: profiles table column mismatch**
   - **Database:** `profiles` table uses `user_id` as primary key (migration line 3)
   - **Code:** `app/admin/page.tsx` (line 22) and `app/admin/actions.ts` (line 23) use `.eq('id', user.id)`
   - **Impact:** Queries will fail or return null, breaking role checks and admin access
   - **Fix needed:** Change `.eq('id', user.id)` to `.eq('user_id', user.id)` in both files

2. **No role info in Header/UserMenu**
   - Header and UserMenu components do not fetch or display user role
   - useAuth hook only returns user object, not role
   - If admin link needs to be shown conditionally, role would need to be added

