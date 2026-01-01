import LandingPage from '@/components/marketing/LandingPage';
import { getSocialLinks } from '@/lib/siteSettings';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: "Home",
  description: "FormulaGuard - Natural cosmetics formulation platform with safety guardrails and compliance checks",
  path: "/home",
});

export default async function HomePage() {
  const socialLinks = await getSocialLinks();
  return <LandingPage socialLinks={socialLinks} />;
}

