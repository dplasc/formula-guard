import Link from 'next/link';

export default function HomePricingSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple pricing
          </h2>
          <p className="text-lg text-gray-600">
            Start free. Upgrade when you need compliance and exports.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Feature</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Free</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 bg-teal-50">Pro</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-700">Formula builder</td>
                <td className="py-3 px-4 text-center">
                  <span className="text-teal-600 font-semibold">✓</span>
                </td>
                <td className="py-3 px-4 text-center bg-teal-50">
                  <span className="text-teal-600 font-semibold">✓</span>
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-700">Compliance checks (EU, IFRA)</td>
                <td className="py-3 px-4 text-center">
                  <span className="text-gray-400">—</span>
                </td>
                <td className="py-3 px-4 text-center bg-teal-50">
                  <span className="text-teal-600 font-semibold">✓</span>
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-700">Print / PDF export</td>
                <td className="py-3 px-4 text-center">
                  <span className="text-gray-400">—</span>
                </td>
                <td className="py-3 px-4 text-center bg-teal-50">
                  <span className="text-teal-600 font-semibold">✓</span>
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-3 px-4 text-gray-700">Save & manage formulas</td>
                <td className="py-3 px-4 text-center">
                  <span className="text-gray-400">—</span>
                </td>
                <td className="py-3 px-4 text-center bg-teal-50">
                  <span className="text-teal-600 font-semibold">✓</span>
                </td>
              </tr>
              <tr className="border-t-2 border-gray-300">
                <td className="py-3 px-4 text-gray-900 font-semibold">Price</td>
                <td className="py-3 px-4 text-center text-gray-900 font-semibold">€0</td>
                <td className="py-3 px-4 text-center bg-teal-50">
                  <div className="text-gray-900 font-semibold">€9.99 / month</div>
                  <div className="text-sm text-gray-600 mt-1">€99 / year (save ~17%)</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div className="text-center mb-4">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center px-8 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            View pricing
          </Link>
        </div>

        {/* Disclaimer */}
        <p className="text-sm text-gray-600 text-center">
          Free is suitable for testing. Compliance checks and exports require Pro.
        </p>
      </div>
    </section>
  );
}

