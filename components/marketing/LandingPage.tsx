'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Beaker, Shield, FileText, Info } from 'lucide-react';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';
import DemoModal from './DemoModal';
import type { SocialLinks } from '@/lib/siteSettings';

interface LandingPageProps {
  socialLinks: SocialLinks;
}

export default function LandingPage({ socialLinks }: LandingPageProps) {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-600 rounded-lg mb-6">
            <span className="text-white font-bold text-4xl">FG</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            FormulaGuard
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Build cosmetic formulas with ingredient limits, EU annex guidance, and IFRA notes — in one workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth"
              className="inline-flex items-center justify-center px-8 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Start free
            </Link>
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-teal-600 font-medium rounded-lg border-2 border-teal-600 hover:bg-teal-50 transition-colors"
            >
              View demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to formulate safely
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built for formulators who need precision, compliance, and safety built into their workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1: Formula Builder */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Beaker className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Formula Builder
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Leave-On / Rinse-Off product types, batch size configuration, step-by-step procedures, and formula templates.
              </p>
            </div>

            {/* Feature 2: Usage Limits */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Usage Limits
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Category totals plus leave-on and rinse-off specific max usage warnings to ensure safe formulations.
              </p>
            </div>

            {/* Feature 3: EU Annex Guidance */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                EU Annex Guidance
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Annex II/III/VI references shown per ingredient with direct links to regulatory documentation.
              </p>
            </div>

            {/* Feature 4: IFRA Notes */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Info className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                IFRA Notes
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Informational IFRA guidance for fragrance-marked ingredients to help with compliance planning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Who it's for
            </h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center mt-0.5 mr-4">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <p className="text-lg text-gray-700">
                  <strong className="text-gray-900">Indie formulators</strong> building natural cosmetic products with confidence
                </p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center mt-0.5 mr-4">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <p className="text-lg text-gray-700">
                  <strong className="text-gray-900">Small brands & labs</strong> needing streamlined compliance workflows
                </p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center mt-0.5 mr-4">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <p className="text-lg text-gray-700">
                  <strong className="text-gray-900">Students & educators</strong> learning cosmetic formulation best practices
                </p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Stay updated
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Product updates, formulation safety insights, and regulatory changes.
            <br />
            No spam. Unsubscribe anytime.
          </p>
          <a
            href="https://80477dc3.sibforms.com/serve/MUIFANYDQtS3LmuHJaYI_6A4TyDVeLKvYCLsvL8unEKPN7iXZxBIpy5KNzp4qhtsFWLDpZLL1DDe5RXYuaEcB8yQK5bG-L3Ov6uLqDPT_bstNqcSUpnBdVeskDghaC03JDgJARLkqsTTFCAtf7WyEZkXLeyvNNh_djTwOzNYg50i0P2GIUXyooWZkrRVwAgs1G0Mnvwjcq62fpVM"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            Join newsletter
          </a>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-amber-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong className="font-semibold text-gray-900">Legal Disclaimer:</strong> FormulaGuard is an informational formulation support tool. It does not replace regulatory assessment, safety reports, stability/micro testing, or legal compliance checks.
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <Link href="/terms" className="text-teal-600 hover:text-teal-700 underline font-medium">
                    Terms of Service
                  </Link>
                  <Link href="/privacy" className="text-teal-600 hover:text-teal-700 underline font-medium">
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter socialLinks={socialLinks} />

      {/* Demo Modal */}
      <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </div>
  );
}

