import PublicHeader from "@/components/marketing/PublicHeader";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Legal",
  description: "Legal Notice and Service Provider Information for FormulaGuard",
  path: "/legal",
});

export default function LegalNoticePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Legal Notice (Impressum)</h1>
          <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-gray max-w-none space-y-8">
            {/* Service Provider Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Provider Information</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                In accordance with Croatian and EU electronic commerce law, the following information identifies the service provider:
              </p>
              <div className="text-gray-700 leading-relaxed space-y-2">
                <p><strong>Business name:</strong> OGLAŠAVAJ SE, obrt za marketinške usluge</p>
                <p><strong>Owner:</strong> Darko Plašć</p>
                <p><strong>Address:</strong> Ivana Dončevića 7, 43000 Bjelovar, Croatia</p>
                <p><strong>OIB (Personal Identification Number):</strong> 98808078966</p>
                <p><strong>Business registration number:</strong> 98191845</p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="text-gray-700 leading-relaxed space-y-2">
                <p>
                  <strong>Email:</strong> <a href="mailto:info@formulaguard.com" className="text-teal-600 hover:text-teal-700 underline">info@formulaguard.com</a>
                </p>
              </div>
            </section>

            {/* Legal Form */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Legal Form</h2>
              <p className="text-gray-700 leading-relaxed">
                This service is operated by a sole proprietorship (obrt) registered in Croatia under Croatian law.
              </p>
            </section>

            {/* Supervisory Authority */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Supervisory Authority</h2>
              <p className="text-gray-700 leading-relaxed">
                The competent supervisory authority for this business is the relevant Croatian regulatory body for sole proprietorships.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

