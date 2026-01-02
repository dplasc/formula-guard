"use client";

import { useState } from "react";
import PlanSelector from "@/components/PlanSelector";
import CheckoutButton from "@/components/CheckoutButton";
import BillingPortalButton from "@/components/BillingPortalButton";

type PlanType = "monthly" | "yearly";

interface PricingSectionProps {
  isPaidUser: boolean;
}

export default function PricingSection({ isPaidUser }: PricingSectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("yearly");

  const monthlyPrice = 9.99;
  const yearlyPrice = 99.0;
  const monthlyPriceYearly = (yearlyPrice / 12).toFixed(2);

  return (
    <div className="space-y-8">
      {/* Plan Selector */}
      <div className="text-center">
        <PlanSelector selectedPlan={selectedPlan} onPlanChange={setSelectedPlan} />
        
        {/* Pricing Display */}
        <div className="mt-6 mb-8">
          <div className="text-5xl font-bold text-gray-900 mb-2">
            {selectedPlan === "yearly" ? `€${yearlyPrice}` : `€${monthlyPrice}`}
          </div>
          <div className="text-gray-600">
            {selectedPlan === "yearly" ? (
              <>
                per year
                <span className="block text-sm text-teal-600 mt-1">
                  €{monthlyPriceYearly}/month (billed annually)
                </span>
              </>
            ) : (
              "per month"
            )}
          </div>
          {selectedPlan === "yearly" && (
            <div className="mt-2 text-sm text-teal-600 font-medium">
              Save ~17% compared to monthly
            </div>
          )}
        </div>
      </div>

      {/* Free vs Pro Comparison */}
      <section className="border-t border-gray-200 pt-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Free vs Pro Comparison
        </h2>
        
        <div className="overflow-x-auto">
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
                <td className="py-3 px-4 text-gray-700">Build formulas with ingredient calculator</td>
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
                <td className="py-3 px-4 text-gray-700">Print/PDF export</td>
                <td className="py-3 px-4 text-center">
                  <span className="text-gray-400">—</span>
                </td>
                <td className="py-3 px-4 text-center bg-teal-50">
                  <span className="text-teal-600 font-semibold">✓</span>
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-700">Save/Load formulas</td>
                <td className="py-3 px-4 text-center">
                  <span className="text-gray-400">—</span>
                </td>
                <td className="py-3 px-4 text-center bg-teal-50">
                  <span className="text-teal-600 font-semibold">✓</span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Dashboard management</td>
                <td className="py-3 px-4 text-center">
                  <span className="text-gray-400">—</span>
                </td>
                <td className="py-3 px-4 text-center bg-teal-50">
                  <span className="text-teal-600 font-semibold">✓</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-gray-600 text-center">
          Free is for testing. Compliance and exports require Pro.
        </p>
      </section>

      {/* Pro Qualifier Section */}
      <section className="border-t border-gray-200 pt-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Who is FormulaGuard Pro for?
        </h3>
        <ul className="space-y-3 mb-4 max-w-2xl">
          <li className="flex items-start">
            <span className="text-teal-600 mr-3 mt-1">•</span>
            <span className="text-gray-700">You sell cosmetic products or formulations</span>
          </li>
          <li className="flex items-start">
            <span className="text-teal-600 mr-3 mt-1">•</span>
            <span className="text-gray-700">You need compliance checks (EU, IFRA) you can rely on</span>
          </li>
          <li className="flex items-start">
            <span className="text-teal-600 mr-3 mt-1">•</span>
            <span className="text-gray-700">You export, share, or document formulas (PDF / print)</span>
          </li>
          <li className="flex items-start">
            <span className="text-teal-600 mr-3 mt-1">•</span>
            <span className="text-gray-700">You want to save, manage, and reuse formulas professionally</span>
          </li>
        </ul>
        <p className="text-sm text-gray-500 mt-4">
          Free is ideal for testing and learning. Pro is required for real-world compliance and exports.
        </p>
      </section>

      {/* CTA Section */}
      <section className="border-t border-gray-200 pt-8">
        <div className="flex flex-col items-center gap-3">
          {isPaidUser ? (
            <BillingPortalButton />
          ) : (
            <CheckoutButton plan={selectedPlan} />
          )}
        </div>
      </section>
    </div>
  );
}

