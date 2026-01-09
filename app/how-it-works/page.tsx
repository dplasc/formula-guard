import Link from 'next/link';
import PublicHeader from '@/components/marketing/PublicHeader';
import PublicFooter from '@/components/marketing/PublicFooter';
import { getSocialLinks } from '@/lib/siteSettings';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'How it works',
  description: 'Learn how FormulaGuard works - A practical way to structure cosmetic formulation without replacing professional judgment.',
  path: '/how-it-works',
});

export default async function HowItWorksPage() {
  const socialLinks = await getSocialLinks();
  const isBlogEnabled = process.env.NEXT_PUBLIC_BLOG_ENABLED === 'true';

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            How FormulaGuard Works
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            A practical way to structure cosmetic formulation without replacing professional judgment.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Two-card grid */}
        <section className="mb-16 sm:mb-20">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {/* Card A */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                What FormulaGuard Is
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span>A tool to structure cosmetic formulas</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span>Supports learning and professional workflows</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span>Helps organize ingredients and manufacturing steps</span>
                </li>
              </ul>
            </div>

            {/* Card B */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                What FormulaGuard Is Not
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span>Not an automated formulator</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span>Not a product approval system</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span>Not a replacement for professional responsibility</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Highlight section */}
        <section className="mb-16 sm:mb-20 bg-gray-50 rounded-lg p-8 sm:p-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Ingredients, Process, and Constraints
          </h2>
          <div className="max-w-3xl mx-auto space-y-3 text-lg text-gray-700 mb-6">
            <p>Ingredients define WHAT is in the formula</p>
            <p>Process defines HOW it is made</p>
            <p>Constraints come later, not first</p>
          </div>
          <p className="text-center text-lg font-medium text-gray-900 max-w-3xl mx-auto">
            FormulaGuard supports thinking — it doesn't automate decisions.
          </p>
        </section>

        {/* Ingredient categories grid */}
        <section className="mb-16 sm:mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Ingredient Categories
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aqueous
              </h3>
              <p className="text-gray-600 text-sm">
                Water-based ingredients and hydrosols
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Oils & Butters
              </h3>
              <p className="text-gray-600 text-sm">
                Lipids, emollients, and butters
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Powders
              </h3>
              <p className="text-gray-600 text-sm">
                Clays, starches, and dry modifiers
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Emulsifiers
              </h3>
              <p className="text-gray-600 text-sm">
                Ingredients that connect oil and water phases
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Preservatives
              </h3>
              <p className="text-gray-600 text-sm">
                Systems that help prevent microbial growth
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Actives
              </h3>
              <p className="text-gray-600 text-sm">
                Functional ingredients with targeted roles
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 sm:col-span-2 lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Fragrance
              </h3>
              <p className="text-gray-600 text-sm">
                Fragrance materials and aroma components
              </p>
            </div>
          </div>
        </section>

        {/* Callout box */}
        <section className="mb-16 sm:mb-20">
          <div className="bg-teal-50 border-l-4 border-teal-600 rounded-lg p-6 sm:p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Custom Ingredients
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Not every ingredient needs to be in a database. Custom ingredients are normal in education and R&D — you can still build complete formulas and keep your thinking structured.
            </p>
          </div>
        </section>

        {/* Process flow section */}
        <section className="mb-16 sm:mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            From Draft to Real Product
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 mb-6">
              <div className="bg-white border-2 border-teal-600 rounded-full px-6 py-3 font-semibold text-gray-900">
                1. Draft
              </div>
              <div className="text-teal-600 font-bold text-xl">→</div>
              <div className="bg-white border-2 border-teal-600 rounded-full px-6 py-3 font-semibold text-gray-900">
                2. Testing
              </div>
              <div className="text-teal-600 font-bold text-xl">→</div>
              <div className="bg-white border-2 border-teal-600 rounded-full px-6 py-3 font-semibold text-gray-900">
                3. Stability
              </div>
              <div className="text-teal-600 font-bold text-xl">→</div>
              <div className="bg-white border-2 border-teal-600 rounded-full px-6 py-3 font-semibold text-gray-900">
                4. Compliance
              </div>
              <div className="text-teal-600 font-bold text-xl">→</div>
              <div className="bg-white border-2 border-teal-600 rounded-full px-6 py-3 font-semibold text-gray-900">
                5. Documentation
              </div>
            </div>
            <p className="text-center text-gray-600 max-w-2xl mx-auto">
              Software can help you plan — but real-world testing and documentation are still essential.
            </p>
          </div>
        </section>

        {/* Who it's for */}
        <section className="mb-16 sm:mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Designed for Learning and Professional Use
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-teal-600 font-bold text-xl">S</span>
              </div>
              <h3 className="font-semibold text-gray-900">Students</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-teal-600 font-bold text-xl">E</span>
              </div>
              <h3 className="font-semibold text-gray-900">Educators</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-teal-600 font-bold text-xl">I</span>
              </div>
              <h3 className="font-semibold text-gray-900">Indie brands</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-teal-600 font-bold text-xl">R</span>
              </div>
              <h3 className="font-semibold text-gray-900">R&D teams</h3>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="text-center mb-12 sm:mb-16">
          <Link
            href="/demo"
            className="inline-flex items-center justify-center px-8 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors mb-4"
          >
            Open interactive demo
          </Link>
          {isBlogEnabled && (
            <div className="mt-4">
              <Link
                href="/blog"
                className="text-teal-600 hover:text-teal-700 underline font-medium"
              >
                Read guides on the blog
              </Link>
            </div>
          )}
        </section>
      </div>

      <PublicFooter socialLinks={socialLinks} />
    </div>
  );
}

