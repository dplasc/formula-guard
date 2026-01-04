'use client';

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FormulaCalculator from "@/components/FormulaCalculator";
import Header from "@/components/Header";
import { getFormulaById } from "@/app/actions/getFormulaById";
import type { Formula } from "@/app/actions/getFormulaById";

interface BuilderClientProps {
  initialFormulaId?: string | null;
  initialFormulaData?: {
    id: string;
    name: string;
    ingredients: any[];
    batchSize: number;
    unitSize?: number;
    procedure: string;
    notes: string;
    processSteps?: any[];
    workflow_status?: 'draft' | 'testing' | 'final' | 'archived';
    is_pinned?: boolean;
    organizationNotes?: string | null;
  } | null;
}

function BuilderContent({ initialFormulaId: propFormulaId, initialFormulaData: propFormulaData }: BuilderClientProps) {
  const searchParams = useSearchParams();
  const [formulaId, setFormulaId] = useState<string | null>(propFormulaId || null);
  const [formulaData, setFormulaData] = useState<{
    id: string;
    name: string;
    ingredients: any[];
    batchSize: number;
    unitSize?: number;
    procedure: string;
    notes: string;
    processSteps?: any[];
    workflow_status?: 'draft' | 'testing' | 'final' | 'archived';
    is_pinned?: boolean;
    organizationNotes?: string | null;
  } | null>(propFormulaData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    // If props are provided, use them (server-side loaded)
    if (propFormulaId && propFormulaData) {
      setFormulaId(propFormulaId);
      setFormulaData(propFormulaData);
      return;
    }

    // Otherwise, fall back to query params (for backward compatibility)
    const id = searchParams.get('id');
    
    if (id) {
      setIsLoading(true);
      setLoadError(null);
      
      getFormulaById(id)
        .then((result) => {
          if (result.error) {
            setLoadError(result.error);
            setFormulaId(null);
            setFormulaData(null);
          } else if (result.data) {
            const d = (result.data as any).data ?? {};
            setFormulaId(result.data.id);
            setFormulaData({
              id: result.data.id,
              name: result.data.name,
              ingredients: Array.isArray(d.ingredients) ? d.ingredients : [],
              batchSize: d.batchSize ?? 100,
              unitSize: d.unitSize,
              procedure: d.procedure || '',
              notes: d.notes || '',
              processSteps: d.processSteps || [],
            });
          }
        })
        .catch((error) => {
          setLoadError(error.message || 'Failed to load formula');
          setFormulaId(null);
          setFormulaData(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // No ID in URL, reset to new formula
      setFormulaId(null);
      setFormulaData(null);
    }
  }, [searchParams, propFormulaId, propFormulaData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header hasUnsavedChanges={hasUnsavedChanges} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Dashboard</h2>
          <p className="text-gray-600 text-sm">
            Calculate and validate your cosmetic formula percentages with real-time feedback.
          </p>
        </div>

        {isLoading && (
          <div className="mb-4 rounded-md bg-blue-50 p-4 border border-blue-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">Loading formula...</p>
              </div>
            </div>
          </div>
        )}

        {loadError && (
          <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading formula</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{loadError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <FormulaCalculator 
          initialFormulaId={formulaId}
          initialFormulaData={formulaData}
          onDirtyChange={setHasUnsavedChanges}
        />
      </main>
    </div>
  );
}

export default function BuilderClient({ initialFormulaId, initialFormulaData }: BuilderClientProps = {}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <BuilderContent initialFormulaId={initialFormulaId} initialFormulaData={initialFormulaData} />
    </Suspense>
  );
}

