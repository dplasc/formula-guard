'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTab);
    };
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 id="demo-modal-title" className="text-2xl font-bold text-gray-900">
            FormulaGuard Demo
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Description Bullets */}
          <div className="mb-8">
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center mt-0.5 mr-4">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div>
                  <strong className="text-gray-900">IFRA Notes</strong> — Informational IFRA guidance for fragrance-marked ingredients to help with compliance planning
                </div>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center mt-0.5 mr-4">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div>
                  <strong className="text-gray-900">EU Annex Guidance</strong> — Annex II/III/VI references shown per ingredient with direct links to regulatory documentation
                </div>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center mt-0.5 mr-4">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div>
                  <strong className="text-gray-900">Usage Limits</strong> — Category totals plus leave-on and rinse-off specific max usage warnings to ensure safe formulations
                </div>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center mt-0.5 mr-4">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div>
                  <strong className="text-gray-900">Formula Builder</strong> — Leave-On / Rinse-Off product types, batch size configuration, step-by-step procedures, and formula templates
                </div>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center mt-0.5 mr-4">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div>
                  <strong className="text-gray-900">Safety Guardrails</strong> — Built-in validation ensures formulas are compliant with ingredient limits and regulatory requirements
                </div>
              </li>
            </ul>
          </div>

          {/* Screenshots */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src="/og.png"
                alt="FormulaGuard interface preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src="/blog/what-is-formulaguard/overview.jpg"
                alt="FormulaGuard formula builder preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end">
          <Link
            href="/blog"
            className="inline-flex items-center justify-center px-6 py-2 bg-white text-teal-600 font-medium rounded-lg border-2 border-teal-600 hover:bg-teal-50 transition-colors"
            onClick={onClose}
          >
            Read the blog
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center px-6 py-2 bg-white text-teal-600 font-medium rounded-lg border-2 border-teal-600 hover:bg-teal-50 transition-colors"
            onClick={onClose}
          >
            Open interactive demo
          </Link>
          <Link
            href="/auth"
            className="inline-flex items-center justify-center px-6 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
            onClick={onClose}
          >
            Start free
          </Link>
        </div>
      </div>
    </div>
  );
}

