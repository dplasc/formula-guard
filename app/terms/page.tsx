import Link from "next/link";
import PublicHeader from "@/components/marketing/PublicHeader";
import SocialIcons from "@/components/SocialIcons";
import { getSocialLinks } from "@/lib/siteSettings";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms of Service",
  description: "Terms of Service for FormulaGuard - Natural Cosmetics Formulation Platform",
  path: "/terms",
});

export default async function TermsPage() {
  const socialLinks = await getSocialLinks();
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-gray max-w-none space-y-8">
            {/* Acceptance of Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using FormulaGuard ("the Service"), you accept and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not use the Service. These Terms constitute a legally binding agreement between you and FormulaGuard.
              </p>
            </section>

            {/* Nature of the Service */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Nature of the Service</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                FormulaGuard is a software platform that provides informational guidance and formulation tools for natural cosmetics. It is important to understand that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>The Service provides <strong>informational guidance only</strong> and does not constitute professional advice, certification, or regulatory approval</li>
                <li>FormulaGuard is not a regulatory body, testing laboratory, or certification authority</li>
                <li>The Service does not guarantee the safety, efficacy, or regulatory compliance of any formulations</li>
                <li>All suggestions, calculations, and recommendations are provided for educational and research purposes</li>
                <li>You are solely responsible for verifying all information and ensuring compliance with applicable laws and regulations</li>
              </ul>
            </section>

            {/* User Responsibilities */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Responsibilities</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                As a user of FormulaGuard, you are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Testing:</strong> Conducting appropriate safety testing, stability testing, and quality control measures for any formulations you create</li>
                <li><strong>Compliance:</strong> Ensuring all formulations comply with applicable local, national, and international regulations, including but not limited to cosmetic regulations (e.g., EU Cosmetics Regulation, FDA regulations, etc.)</li>
                <li><strong>Final Decisions:</strong> Making all final decisions regarding the use, production, and distribution of any formulations</li>
                <li><strong>Professional Consultation:</strong> Consulting with qualified professionals (formulators, chemists, regulatory experts, legal advisors) as needed</li>
                <li><strong>Accurate Information:</strong> Providing accurate information when using the Service and not misrepresenting your qualifications or intended use</li>
                <li><strong>Account Security:</strong> Maintaining the confidentiality of your account credentials and not sharing your account with others</li>
              </ul>
            </section>

            {/* Prohibited Use */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Prohibited Use</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                You agree not to use the Service for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Any illegal activity or in violation of any applicable laws or regulations</li>
                <li>Creating formulations intended to cause harm, injury, or damage</li>
                <li>Misrepresenting the Service's capabilities or your relationship with FormulaGuard</li>
                <li>Attempting to reverse engineer, decompile, or extract the source code of the Service</li>
                <li>Interfering with or disrupting the Service, servers, or networks connected to the Service</li>
                <li>Abusing, harassing, or threatening other users or FormulaGuard staff</li>
                <li>Uploading malicious code, viruses, or harmful content</li>
                <li>Using automated systems (bots, scrapers) to access the Service without authorization</li>
                <li>Violating intellectual property rights of FormulaGuard or third parties</li>
              </ul>
            </section>

            {/* Accounts & Security */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Accounts & Security</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                To use certain features of the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Not create multiple accounts to circumvent Service limitations or restrictions</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                FormulaGuard reserves the right to suspend or terminate accounts that violate these Terms or engage in fraudulent or harmful activities.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                The Service, including its software, design, content, and functionality, is owned by FormulaGuard and protected by intellectual property laws. You acknowledge that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>FormulaGuard retains all rights, title, and interest in the Service</li>
                <li>You are granted a limited, non-exclusive, non-transferable license to use the Service in accordance with these Terms</li>
                <li>You retain ownership of formulations and content you create using the Service</li>
                <li>You grant FormulaGuard a license to store, process, and display your content as necessary to provide the Service</li>
                <li>You may not copy, modify, distribute, or create derivative works based on the Service without written permission</li>
              </ul>
            </section>

            {/* No Warranty */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">No Warranty</h2>
              <p className="text-gray-700 leading-relaxed">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. FORMULAGUARD DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ACCURACY. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE FROM VIRUSES OR OTHER HARMFUL COMPONENTS. YOU USE THE SERVICE AT YOUR OWN RISK.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, FORMULAGUARD SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, revenue, data, or business opportunities</li>
                <li>Damages arising from your use or inability to use the Service</li>
                <li>Damages resulting from formulations created using the Service, including but not limited to product liability, regulatory violations, or safety issues</li>
                <li>Any errors, omissions, or inaccuracies in the Service's content or calculations</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                In no event shall FormulaGuard's total liability exceed the amount you paid to use the Service in the twelve (12) months preceding the claim, or $100 USD, whichever is greater. Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Termination</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Either party may terminate this agreement at any time:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>By You:</strong> You may stop using the Service and delete your account at any time</li>
                <li><strong>By FormulaGuard:</strong> We may suspend or terminate your access to the Service immediately, without notice, if you violate these Terms, engage in fraudulent activity, or for any other reason we deem necessary</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Upon termination, your right to use the Service will cease immediately. Sections of these Terms that by their nature should survive termination (including but not limited to Intellectual Property, No Warranty, Limitation of Liability, and Governing Law) shall survive termination.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                FormulaGuard reserves the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page and updating the "Last updated" date. Your continued use of the Service after such changes constitutes your acceptance of the modified Terms. If you do not agree to the modified Terms, you must stop using the Service and may delete your account.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions or concerns about these Terms of Service, please contact us at:
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                <strong>Email:</strong> <a href="mailto:info@formulaguard.com" className="text-teal-600 hover:text-teal-700 underline">info@formulaguard.com</a>
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of Croatia and the European Union, without regard to its conflict of law provisions. Any disputes arising from or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts of Croatia.
              </p>
            </section>

            {/* Contact / Service Provider */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact / Service Provider</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                FormulaGuard is operated by:
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


