import Link from "next/link";
import PublicHeader from "@/components/marketing/PublicHeader";
import SocialIcons from "@/components/SocialIcons";
import { getSocialLinks } from "@/lib/siteSettings";
import { buildMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import PricingViewLogger from "@/components/PricingViewLogger";
import PricingSection from "@/components/pricing/PricingSection";

export const metadata = buildMetadata({
  title: "Pricing",
  description: "FormulaGuard pricing plans - Natural Cosmetics Formulation Platform",
  path: "/pricing",
});

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const socialLinks = await getSocialLinks();
  
  // Check if user is authenticated and paid
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isPaidUser = user?.app_metadata?.plan === 'pro';
  
  return (
    <div className="min-h-screen bg-gray-50">
      <PricingViewLogger />
      <PublicHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Pricing</h1>

          <div className="prose prose-gray max-w-none">
            {/* Pricing Section with Plan Selector and Comparison */}
            <PricingSection isPaidUser={isPaidUser} />

            {/* Disclaimer */}
            <section className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 leading-relaxed text-center">
                Features and availability may vary. This information is provided for informational purposes only.
              </p>
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

