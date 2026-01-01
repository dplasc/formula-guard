'use client';

import Link from 'next/link';

export default function PublicHeader() {
  const isBlogEnabled = process.env.NEXT_PUBLIC_BLOG_ENABLED === "true";
  
  return (
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
            <nav className="hidden sm:flex items-center gap-6">
              <Link
                href="/faq"
                className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
              >
                FAQ
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
  );
}

