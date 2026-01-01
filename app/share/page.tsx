'use client';

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Home } from "lucide-react";
import Link from "next/link";

interface ShareData {
  meta: {
    formulaName: string;
    productType: 'leave-on' | 'rinse-off';
    batchSize: number | null;
    generatedAtISO: string;
  };
  ingredients: Array<{
    name: string;
    inci: string | null;
    percent: number;
    category: string | null;
    maxUsageLeaveOn: number | null;
    maxUsageRinseOff: number | null;
    maxUsageFallback: number | null;
  }>;
  processSteps: Array<{
    order: number;
    title: string;
    phase: string | null;
    tempC: number | null;
    timeMin: number | null;
    description: string | null;
    notes: string | null;
  }>;
  warnings: {
    maxUsageGroup: Array<{
      category: string;
      totalPercent: number;
      limitPercent: number;
    }>;
    eu: {
      prohibited: Array<{
        ingredientName: string;
        inci: string;
        annex: string;
        reason: string;
        conditionsText: string | null;
        referenceUrl: string | null;
        source: string | null;
      }>;
      restrictions: Array<{
        ingredientName: string;
        inci: string;
        annex: string;
        reason: string;
        maxPercentage: number | null;
        actualPercentage: number;
        conditionsText: string | null;
        referenceUrl: string | null;
        source: string | null;
      }>;
    };
    ifra: {
      warnings: Array<{
        ingredientName: string;
        inci: string;
        entries: Array<{
          standardName: string;
          standardType: string;
          amendmentNumber: number | null;
          referenceUrl: string | null;
        }>;
      }>;
    };
  };
}

function ShareContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ShareData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const encodedData = searchParams.get('data');
      
      if (!encodedData) {
        setError('No data provided in the share link.');
        setIsLoading(false);
        return;
      }

      // Decode base64url
      let base64 = encodedData
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      // Add padding if needed
      while (base64.length % 4) {
        base64 += '=';
      }

      const jsonString = atob(base64);
      
      // Payload size guard: prevent huge payloads from causing performance issues
      if (!jsonString || jsonString.length === 0) {
        throw new Error('Decoded data is empty');
      }
      if (jsonString.length > 200000) {
        throw new Error('Shared data is too large or invalid.');
      }
      
      const parsedData = JSON.parse(jsonString) as ShareData;

      // Basic validation
      if (!parsedData.meta || !parsedData.ingredients || !parsedData.warnings) {
        throw new Error('Invalid data structure');
      }

      setData(parsedData);
    } catch (err) {
      console.error('Failed to decode share data:', err);
      // Preserve specific error message for size limit, otherwise use generic message
      if (err instanceof Error && err.message === 'Shared data is too large or invalid.') {
        setError('Shared data is too large or invalid.');
      } else {
        setError('Invalid or corrupted share link. Please check the URL and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shared formula...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h1 className="text-xl font-semibold text-gray-900">Invalid Share Link</h1>
          </div>
          <p className="text-gray-600 mb-6">{error || 'Unable to load the shared formula.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getMaxUsageDisplay = (ing: ShareData['ingredients'][0]) => {
    const { maxUsageLeaveOn, maxUsageRinseOff, maxUsageFallback, percent } = ing;
    const productType = data.meta.productType;

    if (maxUsageLeaveOn !== null && maxUsageRinseOff !== null) {
      return `Leave-On ${maxUsageLeaveOn}% • Rinse-Off ${maxUsageRinseOff}%`;
    }
    if (productType === 'leave-on' && maxUsageLeaveOn !== null) {
      return `Leave-On: ${maxUsageLeaveOn}%`;
    }
    if (productType === 'rinse-off' && maxUsageRinseOff !== null) {
      return `Rinse-Off: ${maxUsageRinseOff}%`;
    }
    if (maxUsageFallback !== null) {
      return `${maxUsageFallback}% (fallback)`;
    }
    return '—';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">{data.meta.formulaName}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div>
                Product Type: <span className="font-medium">{data.meta.productType === 'leave-on' ? 'Leave-On' : 'Rinse-Off'}</span>
              </div>
              {data.meta.batchSize && (
                <div>
                  Batch Size: <span className="font-medium">{data.meta.batchSize}g</span>
                </div>
              )}
              <div>
                Generated: <span className="font-medium">{formatDate(data.meta.generatedAtISO)}</span>
              </div>
            </div>
          </div>

          {/* Ingredients Table */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h2>
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">INCI</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-700">%</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Category</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Max Usage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.ingredients.map((ing, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{ing.name}</td>
                      <td className="px-4 py-2 text-gray-600 text-xs">{ing.inci || '—'}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">{ing.percent.toFixed(2)}%</td>
                      <td className="px-4 py-2 text-gray-600">{ing.category || '—'}</td>
                      <td className="px-4 py-2 text-gray-600 text-xs">{getMaxUsageDisplay(ing)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Manufacturing Procedure */}
          {data.processSteps.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Manufacturing Procedure</h2>
              <div className="space-y-3">
                {data.processSteps.map((step) => {
                  const metaParts: string[] = [];
                  if (step.phase) metaParts.push(`Phase ${step.phase}`);
                  if (step.tempC !== null && step.tempC !== undefined) {
                    metaParts.push(`${step.tempC}°C`);
                  }
                  if (step.timeMin !== null && step.timeMin !== undefined) {
                    metaParts.push(`${step.timeMin} min`);
                  }
                  const metaLine = metaParts.length > 0 ? metaParts.join(", ") : null;

                  return (
                    <div key={step.order} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                      <div className="text-sm text-gray-900">
                        <span className="font-semibold">{step.order}. {step.title}</span>
                        {metaLine && (
                          <span className="text-gray-600 ml-2">({metaLine})</span>
                        )}
                      </div>
                      {step.description && (
                        <div className="text-xs text-gray-700 mt-2">{step.description}</div>
                      )}
                      {step.notes && (
                        <div className="text-xs text-gray-500 italic mt-1">{step.notes}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Warnings Summary */}
          <div className="space-y-6">
            {/* Max Usage Group Warnings */}
            {data.warnings.maxUsageGroup.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-amber-900 mb-3">Max Usage (Group) Warnings</h2>
                <div className="space-y-2">
                  {data.warnings.maxUsageGroup.map((warning, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="text-sm text-amber-900">
                        <span className="font-semibold">{warning.category}:</span> Total {warning.totalPercent.toFixed(2)}% (recommended max: {warning.limitPercent.toFixed(2)}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EU Compliance */}
            {(data.warnings.eu.prohibited.length > 0 || data.warnings.eu.restrictions.length > 0) && (
              <div>
                <h2 className="text-lg font-semibold text-red-900 mb-3">EU Compliance</h2>
                <div className="space-y-3">
                  {/* Prohibited (Annex II) */}
                  {data.warnings.eu.prohibited.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-red-800 mb-2">Prohibited (Annex II)</h3>
                      <div className="space-y-2">
                        {data.warnings.eu.prohibited.map((block, idx) => (
                          <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="text-sm text-red-900">
                              <span className="font-semibold">{block.ingredientName}</span> ({block.inci})
                            </div>
                            <div className="text-xs text-red-800 mt-1">{block.reason}</div>
                            {block.conditionsText && (
                              <div className="text-xs text-red-700 mt-1 italic">Conditions: {block.conditionsText}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Restrictions (Annex III/VI) */}
                  {data.warnings.eu.restrictions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-orange-800 mb-2">Restrictions (Annex III/VI)</h3>
                      <div className="space-y-2">
                        {data.warnings.eu.restrictions.map((block, idx) => (
                          <div key={idx} className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                            <div className="text-sm text-orange-900">
                              <span className="font-semibold">{block.ingredientName}</span> ({block.inci})
                            </div>
                            <div className="text-xs text-orange-800 mt-1">{block.reason}</div>
                            {block.maxPercentage !== null && (
                              <div className="text-xs text-orange-700 mt-1">
                                Max: {block.maxPercentage}% • Actual: {block.actualPercentage.toFixed(2)}%
                              </div>
                            )}
                            {block.conditionsText && (
                              <div className="text-xs text-orange-700 mt-1 italic">Conditions: {block.conditionsText}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* IFRA Informational */}
            {data.warnings.ifra.warnings.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-blue-900 mb-3">IFRA Guidance (Informational)</h2>
                <div className="space-y-2">
                  {data.warnings.ifra.warnings.map((warning, idx) => (
                    <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="text-sm text-blue-900">
                        <span className="font-semibold">{warning.ingredientName}</span> ({warning.inci})
                      </div>
                      <div className="text-xs text-blue-800 mt-1">
                        {warning.entries.length} IFRA standard{warning.entries.length > 1 ? 's' : ''} associated
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Disclaimers */}
          <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">EU Informational Notice</h3>
              <p className="text-xs text-blue-800">
                This summary is based on available EU Cosmetics Regulation data. Always verify current regulations and consult with regulatory experts before production.
              </p>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">General Disclaimer</h3>
              <p className="text-xs text-gray-700">
                Always verify supplier documentation, certificates of analysis, and current regulatory requirements. This tool provides guidance only and does not replace professional regulatory review.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-teal-600 hover:text-teal-700 font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              Create your own formula
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ShareContent />
    </Suspense>
  );
}

