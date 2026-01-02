import Link from "next/link";
import PublicHeader from "@/components/marketing/PublicHeader";
import SocialIcons from "@/components/SocialIcons";
import { getSocialLinks } from "@/lib/siteSettings";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Upgrade Canceled",
  description: "FormulaGuard Pro upgrade canceled",
  path: "/upgrade/cancel",
});

export default async function UpgradeCancelPage() {
  const socialLinks = await getSocialLinks();
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Upgrade canceled</h1>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <p className="text-gray-700 leading-relaxed text-lg">
                No worries — you can upgrade anytime.
              </p>
            </section>

            <section>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium text-center"
              >
                View plans
              </Link>
            </section>
          </div>

          {/* Footer Links */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <div className="flex flex-col items-center gap-4">
              <SocialIcons socialLinks={socialLinks} />
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link href="/terms" className="text-teal-600 hover:text-teal-700 underline">
                  Terms of Service
                </Link>
                <Link href="/privacy" className="text-teal-600 hover:text-teal-700 underline">
                  Privacy Policy
                </Link>
                <Link href="/legal" className="text-teal-600 hover:text-teal-700 underline">
                  Legal
                </Link>
                <Link href="/contact" className="text-teal-600 hover:text-teal-700 underline">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

