'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

export default function ErrorBanner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  if (error !== 'load_formula') {
    return null;
  }

  const handleDismiss = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('error');
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.push(`/dashboard${newUrl}`);
  };

  return (
    <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
      <div className="flex items-start">
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
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-800">Couldn't load formula. Please try again.</p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="inline-flex rounded-md bg-red-50 text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

