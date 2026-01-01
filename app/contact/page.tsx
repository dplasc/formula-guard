import Link from "next/link";
import PublicHeader from "@/components/marketing/PublicHeader";
import SocialIcons from "@/components/SocialIcons";
import { getSocialLinks } from "@/lib/siteSettings";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact",
  description: "Contact FormulaGuard - Natural Cosmetics Formulation Platform",
  path: "/contact",
});

export default async function ContactPage() {
  const socialLinks = await getSocialLinks();
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Contact</h1>

          <div className="prose prose-gray max-w-none space-y-8">
            {/* Intro */}
            <section>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about FormulaGuard, need support, or want to get in touch regarding the service, you can contact us using the details below.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                <strong>Email:</strong> <a href="mailto:info@formulaguard.com" className="text-teal-600 hover:text-teal-700 underline">info@formulaguard.com</a>
              </p>
            </section>

            {/* Support Note */}
            <section>
              <p className="text-sm text-gray-600 leading-relaxed">
                For support requests, please include as much detail as possible (account email, issue description, screenshots if applicable).
              </p>
            </section>

            {/* Response Time */}
            <section>
              <p className="text-gray-700 leading-relaxed">
                We aim to respond to all inquiries within 1–2 business days.
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

