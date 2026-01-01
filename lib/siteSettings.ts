'use server';

import { createClient } from '@/lib/supabase/server';

export interface SocialLinks {
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
}

/**
 * Get social media links from site_settings (public access)
 */
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


