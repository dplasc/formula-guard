import DemoBuilder from '@/components/demo/DemoBuilder';
import PublicHeader from '@/components/marketing/PublicHeader';
import PublicFooter from '@/components/marketing/PublicFooter';
import { getSocialLinks } from '@/lib/siteSettings';

export default async function DemoPage() {
  const socialLinks = await getSocialLinks();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <DemoBuilder />
      </main>
      <PublicFooter socialLinks={socialLinks} />
    </div>
  );
}

