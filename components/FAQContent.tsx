'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PublicHeader from '@/components/marketing/PublicHeader';
import SocialIcons from '@/components/SocialIcons';
import type { SocialLinks } from '@/lib/siteSettings';

const faqs = [
  {
    question: 'What is FormulaGuard?',
    answer: 'FormulaGuard is a cosmetic formulation support tool that helps you build formulas and surface ingredient usage limits, EU annex references, and IFRA notes in one workflow.',
  },
  {
    question: 'Is FormulaGuard a legal compliance or certification tool?',
    answer: 'No. FormulaGuard provides informational guidance and warnings, but it does not replace regulatory assessment, safety reports (e.g., CPSR), stability/micro testing, or legal compliance checks.',
  },
  {
    question: 'What data sources do you use for EU compliance guidance?',
    answer: 'FormulaGuard displays references related to EU cosmetic annexes (e.g., Annex II/III/VI) and highlights potential restrictions. Always verify against the latest official regulations and your product\'s specific context.',
  },
  {
    question: 'How does IFRA guidance work in FormulaGuard?',
    answer: 'IFRA guidance is shown informationally and warnings appear only for ingredients marked as "Fragrance." IFRA categories and limits depend on product type and context, so use it as planning support—not final approval.',
  },
  {
    question: 'What\'s the difference between Leave-On and Rinse-Off?',
    answer: 'Leave-On products stay on the skin (e.g., creams, serums). Rinse-Off products are washed off (e.g., cleansers, shampoos). Some ingredient limits differ depending on the product type.',
  },
  {
    question: 'How are "Max Usage" warnings calculated?',
    answer: 'Some limits are applied by ingredient categories. FormulaGuard groups ingredients by category, sums their total %, and compares that to the minimum applicable limit. If the total exceeds the limit, a warning is shown.',
  },
  {
    question: 'Can I add custom ingredients and limits?',
    answer: 'Yes. Custom ingredients can be added, and advanced limits can be defined. Knowledge base ingredients are locked (display-only) to preserve reference integrity.',
  },
  {
    question: 'How does sharing work? Is a shared formula editable?',
    answer: 'Shared links are read-only. They encode a snapshot of the formula in the URL (with size guards) so you can share a view safely without exposing editing controls.',
  },
  {
    question: 'Do you store my formulas? Can I delete them?',
    answer: 'Saved formulas are stored in your account. You can delete your formulas at any time from your dashboard.',
  },
  {
    question: 'I found a mismatch or I\'m unsure—what should I do?',
    answer: 'Treat warnings as signals to investigate. Verify source documentation, your supplier specs, and your regulatory context. If you believe something is wrong, contact us so we can review and improve guidance.',
  },
];

function AccordionItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="text-lg font-semibold text-gray-900 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 pr-12">
          <p className="text-gray-700 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

interface FAQContentProps {
  socialLinks: SocialLinks;
}

export default function FAQContent({ socialLinks }: FAQContentProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Common questions about FormulaGuard, how it works, and what it can help you with.
          </p>

          <div className="mb-12">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onToggle={() => toggleItem(index)}
              />
            ))}
          </div>

          {/* CTA Section */}
          <div className="border-t border-gray-200 pt-8 mt-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
              <p className="text-gray-600 mb-6">
                Start building formulas with safety guidance built in.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center px-8 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Start free
                </Link>
                <a
                  href="https://80477dc3.sibforms.com/serve/MUIFANYDQtS3LmuHJaYI_6A4TyDVeLKvYCLsvL8unEKPN7iXZxBIpy5KNzp4qhtsFWLDpZLL1DDe5RXYuaEcB8yQK5bG-L3Ov6uLqDPT_bstNqcSUpnBdVeskDghaC03JDgJARLkqsTTFCAtf7WyEZkXLeyvNNh_djTwOzNYg50i0P2GIUXyooWZkrRVwAgs1G0Mnvwjcq62fpVM"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-3 bg-white text-teal-600 font-medium rounded-lg border-2 border-teal-600 hover:bg-teal-50 transition-colors"
                >
                  Join newsletter
                </a>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <div className="flex flex-col items-center gap-4">
              <SocialIcons socialLinks={socialLinks} />
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link href="/terms" className="text-teal-600 hover:text-teal-700 underline">
                  Terms of Service
                </Link>
                <Link href="/privacy" className="text-teal-600 hover:text-teal-700 underline">
                  Privacy Policy
                </Link>
                <Link href="/legal" className="text-teal-600 hover:text-teal-700 underline">
                  Legal
                </Link>
                <Link href="/contact" className="text-teal-600 hover:text-teal-700 underline">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

