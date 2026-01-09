'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function PublicHeader() {
  const isBlogEnabled = process.env.NEXT_PUBLIC_BLOG_ENABLED === "true";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo + Brand */}
            <Link 
              href="/" 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">FG</span>
              </div>
              <span className="text-xl font-bold text-gray-900">FormulaGuard</span>
            </Link>
            
            {/* Navigation Links + CTA */}
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/faq"
                  className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
                >
                  FAQ
                </Link>
                <Link
                  href="/how-it-works"
                  className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
                >
                  How it works
                </Link>
                {isBlogEnabled && (
                  <Link
                    href="/blog"
                    className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
                  >
                    Blog
                  </Link>
                )}
                <Link
                  href="/terms"
                  className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
                >
                  Terms
                </Link>
                <Link
                  href="/privacy"
                  className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  href="/contact"
                  className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
                >
                  Contact
                </Link>
              </nav>
              
              <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden p-2 text-gray-700 hover:text-teal-600 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
                
                <Link
                  href="/auth"
                  className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth"
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium"
                >
                  Start free
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Mobile Menu Drawer */}
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl z-50">
            <div className="flex flex-col h-full">
              {/* Header with Close Button */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Navigation Links */}
              <nav className="flex-1 px-4 py-6">
                <div className="flex flex-col gap-1">
                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-md font-medium transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    href="/faq"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-md font-medium transition-colors"
                  >
                    FAQ
                  </Link>
                  <Link
                    href="/how-it-works"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-md font-medium transition-colors"
                  >
                    How it works
                  </Link>
                  {isBlogEnabled && (
                    <Link
                      href="/blog"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-4 py-3 text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-md font-medium transition-colors"
                    >
                      Blog
                    </Link>
                  )}
                  <Link
                    href="/terms"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-md font-medium transition-colors"
                  >
                    Terms
                  </Link>
                  <Link
                    href="/privacy"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-md font-medium transition-colors"
                  >
                    Privacy
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-md font-medium transition-colors"
                  >
                    Contact
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}

