'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { FormulaListItem } from '@/app/dashboard/actions';
import FormulaCard from './FormulaCard';

interface FormulaListProps {
  initialFormulas: FormulaListItem[];
}

export default function FormulaList({ initialFormulas }: FormulaListProps) {
  const [formulas, setFormulas] = useState<FormulaListItem[]>(initialFormulas);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setFormulas((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDuplicate = (newFormula: FormulaListItem) => {
    // Optimistically add the new formula to the list
    setFormulas((prev) => [...prev, newFormula]);
    setToastMessage('Formula duplicated successfully.');
  };

  // Filter formulas based on search
  const filteredFormulas = useMemo(() => {
    return formulas.filter((formula) => {
      // Name search (case-insensitive)
      const matchesSearch = searchQuery === '' || 
        formula.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [formulas, searchQuery]);

  // Sort by updated date DESC (newest first)
  const sortedFormulas = useMemo(() => {
    return [...filteredFormulas].sort((a, b) => {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [filteredFormulas]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  return (
    <div>
      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search formulas by name..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
          />
        </div>

        {/* Toast Message */}
        {toastMessage && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">{toastMessage}</p>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-4 text-blue-600 hover:text-blue-800 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Results Count */}
        <div className="flex justify-end">
          <div className="text-sm text-gray-500">
            {sortedFormulas.length} {sortedFormulas.length === 1 ? 'formula' : 'formulas'}
          </div>
        </div>
      </div>

      {/* Formula Grid */}
      {sortedFormulas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No formulas match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedFormulas.map((formula) => (
            <FormulaCard key={formula.id} formula={formula} onDelete={handleDelete} onDuplicate={handleDuplicate} />
          ))}
        </div>
      )}
    </div>
  );
}

