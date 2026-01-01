import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LandingPage from '@/components/marketing/LandingPage';
import { getSocialLinks } from '@/lib/siteSettings';

export default async function Home() {
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
