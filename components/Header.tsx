"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogIn, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import UserMenu from "@/components/UserMenu";
import AnnouncementBell from "@/components/AnnouncementBell";

interface HeaderProps {
  hasUnsavedChanges?: boolean;
}

export default function Header({ hasUnsavedChanges = false }: HeaderProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const handleDashboardNavigation = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only guard navigation from builder page (root path)
    if (hasUnsavedChanges && pathname === "/") {
      const confirmed = window.confirm("You have unsaved changes. Leave without saving?");
      if (!confirmed) {
        e.preventDefault();
      }
    }
  };

  const isBlogEnabled = process.env.NEXT_PUBLIC_BLOG_ENABLED === "true";
  
  const navigationLinks = [
    { href: "/dashboard", label: "Dashboard" },
    ...(isBlogEnabled ? [{ href: "/blog", label: "Blog" }] : []),
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Link 
              href={user ? "/dashboard" : "/"} 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              onClick={handleDashboardNavigation}
            >
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">FG</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">FormulaGuard</h1>
                <p className="text-sm text-gray-600">Natural Cosmetics Formulation Platform</p>
              </div>
            </Link>
            
            {/* Desktop Navigation Links - Positioned on the right */}
            <nav className="hidden md:flex items-center gap-4 ml-auto mr-4">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-gray-700 hover:text-teal-600 font-medium transition-colors"
                  onClick={link.href === "/dashboard" ? handleDashboardNavigation : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 text-gray-700 hover:text-teal-600 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Announcement Bell (only for logged in users) */}
              {!loading && user && <AnnouncementBell />}
              
              {/* User Menu / Login */}
              {loading ? (
                <div className="w-24 h-10 bg-gray-100 rounded-md animate-pulse" />
              ) : user ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => router.push("/auth")}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Mobile Menu Drawer */}
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
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
                  {navigationLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={(e) => {
                        if (link.href === "/dashboard") {
                          handleDashboardNavigation(e);
                        }
                        setIsMobileMenuOpen(false);
                      }}
                      className="px-4 py-3 text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-md font-medium transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}

