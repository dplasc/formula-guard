'use server';

import { createClient } from '@/lib/supabase/server';
import { requireVerifiedUser } from '@/lib/auth/verify-email-guard';

export type UserAnnouncement = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  published_at: string;
  is_read: boolean;
};

/**
 * Get unread announcement count for current user
 */
export async function getUnreadAnnouncementCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  // Get all announcements visible to logged-in users
  const { data: announcements, error: announcementsError } = await supabase
    .from('site_announcements')
    .select('id')
    .in('audience', ['all', 'logged_in'])
    .order('published_at', { ascending: false });

  if (announcementsError || !announcements || announcements.length === 0) {
    return 0;
  }

  // Get read announcements for this user
  const { data: reads, error: readsError } = await supabase
    .from('announcement_reads')
    .select('announcement_id')
    .eq('user_id', user.id);

  if (readsError) {
    return 0;
  }

  const readIds = new Set(reads?.map((r) => r.announcement_id) || []);
  const unreadCount = announcements.filter((a) => !readIds.has(a.id)).length;

  return unreadCount;
}

/**
 * Get announcements for current user (with read status)
 */
export async function getUserAnnouncements(): Promise<{
  error: string | null;
  data: UserAnnouncement[] | null;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: 'Not authenticated',
      data: null,
    };
  }

  // Get all announcements visible to logged-in users
  const { data: announcements, error: announcementsError } = await supabase
    .from('site_announcements')
    .select('id, title, body, link, published_at')
    .in('audience', ['all', 'logged_in'])
    .order('published_at', { ascending: false });

  if (announcementsError) {
    return {
      error: announcementsError.message,
      data: null,
    };
  }

  // Get read announcements for this user
  const { data: reads, error: readsError } = await supabase
    .from('announcement_reads')
    .select('announcement_id')
    .eq('user_id', user.id);

  if (readsError) {
    return {
      error: readsError.message,
      data: null,
    };
  }

  const readIds = new Set(reads?.map((r) => r.announcement_id) || []);

  const userAnnouncements: UserAnnouncement[] = (announcements || []).map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    link: a.link,
    published_at: a.published_at,
    is_read: readIds.has(a.id),
  }));

  return {
    error: null,
    data: userAnnouncements,
  };
}

/**
 * Mark all announcements as read for current user
 */
export async function markAllAnnouncementsAsRead(): Promise<{
  success: boolean;
  error: string | null;
}> {
  // Enforce email verification for write operations
  let user;
  try {
    user = await requireVerifiedUser();
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED') {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }
    if (error.message === 'EMAIL_NOT_VERIFIED') {
      return {
        success: false,
        error: 'EMAIL_NOT_VERIFIED',
      };
    }
    return {
      success: false,
      error: error.message || 'Authentication error',
    };
  }

  const supabase = await createClient();

  // Get all unread announcements
  const { data: announcements, error: announcementsError } = await supabase
    .from('site_announcements')
    .select('id')
    .in('audience', ['all', 'logged_in']);

  if (announcementsError || !announcements || announcements.length === 0) {
    return {
      success: true,
      error: null,
    };
  }

  // Get already read announcements
  const { data: reads } = await supabase
    .from('announcement_reads')
    .select('announcement_id')
    .eq('user_id', user.id);

  const readIds = new Set(reads?.map((r) => r.announcement_id) || []);
  const unreadAnnouncements = announcements.filter((a) => !readIds.has(a.id));

  if (unreadAnnouncements.length === 0) {
    return {
      success: true,
      error: null,
    };
  }

  // Insert reads for unread announcements
  const readsToInsert = unreadAnnouncements.map((a) => ({
    announcement_id: a.id,
    user_id: user.id,
  }));

  const { error: insertError } = await supabase
    .from('announcement_reads')
    .insert(readsToInsert);

  if (insertError) {
    return {
      success: false,
      error: insertError.message,
    };
  }

  return {
    success: true,
    error: null,
  };
}


