import PublicHeader from '@/components/marketing/PublicHeader';
import PublicFooter from '@/components/marketing/PublicFooter';
import { getSocialLinks } from '@/lib/siteSettings';

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const socialLinks = await getSocialLinks();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        {children}
      </main>
      {/* Footer */}
      <PublicFooter socialLinks={socialLinks} />
    </div>
  );
}

