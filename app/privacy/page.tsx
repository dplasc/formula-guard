import Link from "next/link";
import PublicHeader from "@/components/marketing/PublicHeader";
import SocialIcons from "@/components/SocialIcons";
import { getSocialLinks } from "@/lib/siteSettings";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description: "Privacy Policy for FormulaGuard - Natural Cosmetics Formulation Platform",
  path: "/privacy",
});

export default async function PrivacyPage() {
  const socialLinks = await getSocialLinks();
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-gray max-w-none space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Welcome to FormulaGuard. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our natural cosmetics formulation platform.
              </p>
            </section>

            {/* Data We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data We Collect</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We collect the following types of information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Account Information:</strong> Email address, password (hashed), and account preferences</li>
                <li><strong>Formulation Data:</strong> Ingredients, percentages, batch sizes, procedures, and notes you create</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our platform, including pages visited and features used</li>
                <li><strong>Technical Data:</strong> IP address, browser type, device information, and timestamps</li>
              </ul>
            </section>

            {/* How We Use Data */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Data</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We use your data for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>To provide and maintain our formulation platform services</li>
                <li>To authenticate your account and ensure security</li>
                <li>To store and manage your formulas and formulations</li>
                <li>To improve our platform functionality and user experience</li>
                <li>To communicate with you about your account and our services</li>
                <li>To comply with legal obligations and protect our rights</li>
              </ul>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies</h2>
              <p className="text-gray-700 leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience on our platform. Cookies are small data files stored on your device that help us remember your preferences and improve site functionality. You can control cookie settings through your browser preferences, though disabling cookies may limit some features of our platform.
              </p>
            </section>

            {/* Data Storage / Processors */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Storage / Processors</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Your data is stored and processed using the following services:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Supabase:</strong> We use Supabase (supabase.com) for database storage, authentication, and backend services. Supabase processes your data in accordance with their privacy policy and security standards.</li>
                <li>All data is encrypted in transit and at rest</li>
                <li>We implement industry-standard security measures to protect your information</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                By using FormulaGuard, you acknowledge that your data may be processed by Supabase and their infrastructure providers in accordance with applicable data protection laws.
              </p>
            </section>

            {/* Your Rights (GDPR) */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights (GDPR)</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                If you are located in the European Economic Area (EEA) or United Kingdom, you have the following rights under the General Data Protection Regulation (GDPR):
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Right to Access:</strong> You can request a copy of the personal data we hold about you</li>
                <li><strong>Right to Rectification:</strong> You can request correction of inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> You can request deletion of your personal data ("right to be forgotten")</li>
                <li><strong>Right to Restrict Processing:</strong> You can request that we limit how we use your data</li>
                <li><strong>Right to Data Portability:</strong> You can request a copy of your data in a machine-readable format</li>
                <li><strong>Right to Object:</strong> You can object to certain types of data processing</li>
                <li><strong>Right to Withdraw Consent:</strong> You can withdraw consent for data processing at any time</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise any of these rights, please contact us using the information provided in the Contact section below.
              </p>
            </section>

            {/* Data Controller */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Controller</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                The data controller for FormulaGuard is:
              </p>
              <div className="text-gray-700 leading-relaxed space-y-1">
                <p><strong>Business name:</strong> OGLAŠAVAJ SE, obrt za marketinške usluge</p>
                <p><strong>Owner:</strong> Darko Plašć</p>
                <p><strong>Address:</strong> Ivana Dončevića 7, 43000 Bjelovar, Croatia</p>
                <p><strong>OIB:</strong> 98808078966</p>
                <p><strong>Business registration number:</strong> 98191845</p>
                <p className="mt-3">
                  <strong>Contact email:</strong> <a href="mailto:info@formulaguard.com" className="text-teal-600 hover:text-teal-700 underline">info@formulaguard.com</a>
                </p>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at:
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                <strong>Email:</strong> <a href="mailto:info@formulaguard.com" className="text-teal-600 hover:text-teal-700 underline">info@formulaguard.com</a>
              </p>
            </section>

            {/* Disclaimer */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Disclaimer</h2>
              <p className="text-gray-700 leading-relaxed">
                FormulaGuard provides informational guidance and formulation tools for educational and research purposes only. The platform is not intended to replace professional cosmetic formulation expertise, regulatory compliance review, or safety testing. Users are responsible for ensuring their formulations comply with applicable regulations, safety standards, and industry best practices. We do not guarantee the accuracy, safety, or regulatory compliance of any formulations created using our platform.
              </p>
            </section>

            {/* Changes to this Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to this Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by posting the updated policy on this page and updating the "Last updated" date. Your continued use of FormulaGuard after such changes constitutes your acceptance of the updated Privacy Policy.
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


