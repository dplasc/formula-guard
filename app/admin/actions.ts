'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export type UserRole = 'user' | 'admin' | 'super_admin';

/**
 * Normalize role string (trim whitespace)
 */
function normalizeRole(role: string | null): string | null {
  return role ? role.trim() : null;
}

/**
 * Get the current user's role from profiles table
 * Tries user_id first, then falls back to id for schema compatibility
 */
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // Try user_id first (schema variant 1)
  const { data: p1 } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (p1?.role) {
    const normalized = normalizeRole(p1.role);
    return normalized as UserRole | null;
  }

  // Fallback to id (schema variant 2)
  const { data: p2 } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return normalizeRole(p2?.role ?? null) as UserRole | null;
}

/**
 * Check if current user is super_admin, redirect if not
 */
export async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // If not authenticated, redirect to auth
  if (authError || !user) {
    redirect('/auth');
  }

  // Check role
  const role = await getUserRole();
  if (role !== 'super_admin') {
    redirect('/dashboard');
  }
}

/**
 * Get admin statistics
 */
export async function getAdminStats() {
  const supabase = await createClient();
  
  // Verify user is super_admin
  const role = await getUserRole();
  if (role !== 'super_admin') {
    return {
      error: 'Unauthorized',
      totalUsers: 0,
      totalFormulas: 0,
      newUsersLast30Days: 0,
    };
  }

  // Count total users (from profiles table)
  const { count: totalUsers, error: usersError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Count total formulas
  const { count: totalFormulas, error: formulasError } = await supabase
    .from('formulas')
    .select('*', { count: 'exact', head: true });

  // Count new users in last 30 days (from profiles)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { count: newUsersLast30Days, error: newUsersError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (usersError || formulasError || newUsersError) {
    return {
      error: 'Failed to fetch statistics',
      totalUsers: 0,
      totalFormulas: 0,
      newUsersLast30Days: 0,
    };
  }

  return {
    error: null,
    totalUsers: totalUsers || 0,
    totalFormulas: totalFormulas || 0,
    newUsersLast30Days: newUsersLast30Days || 0,
  };
}

/**
 * Get all site settings
 */
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

/**
 * Update site settings (upsert by key)
 */
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

