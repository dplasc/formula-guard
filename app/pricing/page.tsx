import Link from "next/link";
import PublicHeader from "@/components/marketing/PublicHeader";
import SocialIcons from "@/components/SocialIcons";
import { getSocialLinks } from "@/lib/siteSettings";
import { buildMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import BillingPortalButton from "@/components/BillingPortalButton";
import PricingViewLogger from "@/components/PricingViewLogger";
import CheckoutButton from "@/components/CheckoutButton";

export const metadata = buildMetadata({
  title: "Pricing",
  description: "FormulaGuard pricing plans - Natural Cosmetics Formulation Platform",
  path: "/pricing",
});

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const socialLinks = await getSocialLinks();
  const stripeCheckoutUrl = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL;
  const hasCheckout = !!stripeCheckoutUrl;
  
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

          <div className="prose prose-gray max-w-none space-y-8">
            {/* Intro */}
            <section>
              <p className="text-gray-700 leading-relaxed">
                Plans are coming soon.
              </p>
            </section>

            {/* Plans Comparison */}
            <section>
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Free Plan</h2>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Build formulas with ingredient calculator</li>
                    <li>Compliance checks (EU, IFRA)</li>
                    <li>Print/PDF export</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Pro Plan</h2>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Everything in Free</li>
                    <li>Save/Load formulas</li>
                    <li>Dashboard management</li>
                  </ul>
                  <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                    After purchase, Pro access will be enabled automatically (coming soon).
                  </p>
                </div>
              </div>
            </section>

            {/* Upgrade CTA or Manage Billing */}
            <section>
              <div className="flex flex-col items-center gap-3">
                {isPaidUser ? (
                  <BillingPortalButton />
                ) : hasCheckout ? (
                  <CheckoutButton checkoutUrl={stripeCheckoutUrl!} />
                ) : (
                  <>
                    <button
                      disabled
                      className="px-6 py-3 bg-gray-400 text-white rounded-md cursor-not-allowed font-medium"
                    >
                      Upgrade to Pro
                    </button>
                    <p className="text-sm text-gray-600">
                      Checkout is not available yet.
                    </p>
                  </>
                )}
              </div>
            </section>

            {/* Disclaimer */}
            <section>
              <p className="text-sm text-gray-600 leading-relaxed">
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

