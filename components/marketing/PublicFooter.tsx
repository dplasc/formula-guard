import Link from 'next/link';
import SocialIcons from '@/components/SocialIcons';
import type { SocialLinks } from '@/lib/siteSettings';

interface PublicFooterProps {
  socialLinks: SocialLinks;
}

export default function PublicFooter({ socialLinks }: PublicFooterProps) {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} FormulaGuard. All rights reserved.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <SocialIcons socialLinks={socialLinks} />
            <nav className="flex flex-wrap gap-6">
              <Link href="/terms" className="text-sm text-gray-600 hover:text-teal-600 transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-sm text-gray-600 hover:text-teal-600 transition-colors">
                Privacy
              </Link>
              <Link href="/legal" className="text-sm text-gray-600 hover:text-teal-600 transition-colors">
                Legal
              </Link>
              <Link href="/contact" className="text-sm text-gray-600 hover:text-teal-600 transition-colors">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}


