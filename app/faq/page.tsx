import FAQContent from '@/components/FAQContent';
import { getSocialLinks } from '@/lib/siteSettings';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: "FAQ",
  description: "Frequently asked questions about FormulaGuard - Natural cosmetics formulation platform",
  path: "/faq",
});

export default async function FAQPage() {
  const socialLinks = await getSocialLinks();
  return <FAQContent socialLinks={socialLinks} />;
}
