'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserRole } from './actions';
import { revalidatePath } from 'next/cache';

export type AnnouncementAudience = 'all' | 'logged_in' | 'pro_only';

export type Announcement = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  audience: AnnouncementAudience;
  published_at: string;
  created_at: string;
};

/**
 * Create a new announcement (super_admin only)
 */
export async function createAnnouncement(data: {
  title: string;
  body: string;
  link?: string | null;
  audience: AnnouncementAudience;
}) {
  const supabase = await createClient();
  
  // Verify user is super_admin
  const role = await getUserRole();
  if (role !== 'super_admin') {
    return {
      success: false,
      error: 'Unauthorized',
      data: null,
    };
  }

  const { data: announcement, error } = await supabase
    .from('site_announcements')
    .insert({
      title: data.title,
      body: data.body,
      link: data.link || null,
      audience: data.audience,
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }

  revalidatePath('/admin');
  
  return {
    success: true,
    error: null,
    data: announcement as Announcement,
  };
}

/**
 * Get last 20 announcements (super_admin only)
 */
export async function getAnnouncements() {
  const supabase = await createClient();
  
  // Verify user is super_admin
  const role = await getUserRole();
  if (role !== 'super_admin') {
    return {
      error: 'Unauthorized',
      data: null,
    };
  }

  const { data, error } = await supabase
    .from('site_announcements')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(20);

  if (error) {
    return {
      error: error.message,
      data: null,
    };
  }

  return {
    error: null,
    data: data as Announcement[],
  };
}

/**
 * Delete an announcement (super_admin only)
 */
export async function deleteAnnouncement(id: string) {
  const supabase = await createClient();
  
  // Verify user is super_admin
  const role = await getUserRole();
  if (role !== 'super_admin') {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  const { error } = await supabase
    .from('site_announcements')
    .delete()
    .eq('id', id);

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

