import Link from 'next/link';

export default function HomeTrustSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">
          Trust & legal
        </h2>
        
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center mt-0.5 mr-4">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <p className="text-lg text-gray-700">
                FormulaGuard is an informational formulation support tool — not a substitute for regulatory assessment.
              </p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center mt-0.5 mr-4">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <p className="text-lg text-gray-700">
                EU annex and IFRA notes are references — always validate against official sources.
              </p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center mt-0.5 mr-4">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <p className="text-lg text-gray-700">
                We respect privacy. See how data is handled in our policies.
              </p>
            </li>
          </ul>
        </div>

        {/* Links Row */}
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/terms" className="text-teal-600 hover:text-teal-700 underline">
            Terms
          </Link>
          <Link href="/privacy" className="text-teal-600 hover:text-teal-700 underline">
            Privacy
          </Link>
          <Link href="/legal" className="text-teal-600 hover:text-teal-700 underline">
            Legal
          </Link>
        </div>
      </div>
    </section>
  );
}

