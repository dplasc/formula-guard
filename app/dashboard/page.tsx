import Link from 'next/link';
import { getFormulas } from './actions';
import EmptyState from '@/components/dashboard/EmptyState';
import FormulaList from '@/components/dashboard/FormulaList';
import Header from '@/components/Header';
import ErrorBanner from '@/components/dashboard/ErrorBanner';

export default async function DashboardPage() {
  const { data, error } = await getFormulas();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <ErrorBanner />

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Formula Library</h1>
            <p className="text-gray-600 text-sm mt-1">
              View and manage your saved cosmetic formulas
            </p>
          </div>
          <Link
            href="/builder"
            className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
          >
            New Formula
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Failed to load formulas</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!error && (!data || data.length === 0) ? (
          <EmptyState />
        ) : (
          data && <FormulaList initialFormulas={data} />
        )}
      </main>
    </div>
  );
}

