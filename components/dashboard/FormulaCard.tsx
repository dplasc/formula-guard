'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Loader2 } from 'lucide-react';
import type { FormulaListItem } from '@/app/dashboard/actions';
import { deleteFormula, duplicateFormula } from '@/app/dashboard/actions';

interface FormulaCardProps {
  formula: FormulaListItem;
  onDelete?: (id: string) => void;
  onDuplicate?: (newFormula: FormulaListItem) => void;
}

function getProductTypeStyles(productType: string) {
  if (productType === 'leaveOn') {
    return {
      bg: 'bg-teal-100',
      text: 'text-teal-700',
      label: 'Leave-On',
    };
  } else if (productType === 'rinseOff') {
    return {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      label: 'Rinse-Off',
    };
  }
  
  // Default
  return {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    label: productType,
  };
}

function getTechnicalStatusBadgeStyles(status: string) {
  const normalizedStatus = status.toUpperCase();
  
  if (normalizedStatus === 'VALID') {
    return {
      bg: 'bg-green-100',
      text: 'text-green-800',
    };
  } else if (normalizedStatus === 'INCOMPLETE') {
    return {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
    };
  } else if (normalizedStatus === 'INVALID') {
    return {
      bg: 'bg-red-100',
      text: 'text-red-800',
    };
  }
  
  // Default for unknown statuses
  return {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
  };
}

function calculateTechnicalStatus(formula: FormulaListItem): string {
  if (!formula.data?.ingredients || formula.data.ingredients.length === 0) {
    return 'INCOMPLETE';
  }
  
  const total = formula.data.ingredients.reduce((sum, ing) => sum + (ing.percentage || 0), 0);
  
  if (total > 100) return 'INVALID';
  if (total < 100) return 'INCOMPLETE';
  return 'VALID';
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function FormulaCard({ formula, onDelete, onDuplicate }: FormulaCardProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  
  const productTypeStyles = getProductTypeStyles(formula.product_type || '');
  const technicalStatus = calculateTechnicalStatus(formula);
  const technicalStatusStyles = getTechnicalStatusBadgeStyles(technicalStatus);
  const formattedDate = formatDate(formula.updated_at);

  const handleDeleteClick = () => {
    setShowConfirmModal(true);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    
    try {
      const result = await deleteFormula(formula.id);
      
      if (result.success) {
        setShowConfirmModal(false);
        if (onDelete) {
          onDelete(formula.id);
        }
      } else {
        alert('Failed to delete formula. Please try again.');
        setIsDeleting(false);
      }
    } catch (error) {
      alert('Failed to delete formula. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    
    try {
      const result = await duplicateFormula(formula.id);
      
      if (result.success && result.data) {
        if (onDuplicate) {
          onDuplicate(result.data);
        }
      } else {
        alert('Failed to duplicate formula. Please try again.');
      }
    } catch (error) {
      alert('Failed to duplicate formula. Please try again.');
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {formula.name || 'Unnamed Formula'}
            </h3>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${productTypeStyles.bg} ${productTypeStyles.text} flex-shrink-0`}
          >
            {productTypeStyles.label}
          </span>
        </div>
        
        <div className="mb-3">
          <p className="text-sm text-gray-500">Updated: {formattedDate}</p>
          {formula.batch_size && (
            <p className="text-xs text-gray-400 mt-1">Batch size: {formula.batch_size}g</p>
          )}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-2 ${technicalStatusStyles.bg} ${technicalStatusStyles.text}`}
          >
            {technicalStatus}
          </span>
        </div>
        
        <div className="flex gap-2">
          <Link
            href={`/formula/${formula.id}`}
            className="flex-1 inline-flex justify-center items-center px-4 py-2 min-h-[44px] border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
          >
            Open
          </Link>
          <button
            onClick={handleDuplicate}
            disabled={isDuplicating}
            className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Duplicate formula"
          >
            {isDuplicating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="px-4 py-2 min-h-[44px] border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete formula"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleCancel}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Delete Formula?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete &apos;{formula.name || 'Unnamed Formula'}&apos;? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancel}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Formula'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
