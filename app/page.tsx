import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LandingPage from '@/components/marketing/LandingPage';
import { getSocialLinks } from '@/lib/siteSettings';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const code = params.code;
  const type = params.type;

  // Handle Supabase password recovery codes that land on root
  // Redirect to /recover with the query string preserved
  // Check for code AND type=recovery (or code alone if type is missing, as recovery codes on root are the issue)
  if (code && (type === 'recovery' || type === undefined)) {
    // Preserve all query params for Supabase to process
    const queryString = new URLSearchParams();
    if (typeof code === 'string') queryString.set('code', code);
    if (type === 'recovery') queryString.set('type', 'recovery');
    // Preserve any other params
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'code' && key !== 'type' && typeof value === 'string') {
        queryString.set(key, value);
      }
    });
    redirect(`/recover?${queryString.toString()}`);
  }

  // Check if user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If authenticated, redirect to builder
  if (user) {
    redirect('/builder');
  }

  // Fetch social links
  const socialLinks = await getSocialLinks();

  // Otherwise, show landing page
  return <LandingPage socialLinks={socialLinks} />;
}
