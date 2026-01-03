"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { LogIn, UserPlus } from "lucide-react";

function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") ?? "/dashboard";
  const mode = searchParams?.get("mode");

  // Handle mode query param and success message (e.g., from password reset success)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "login" && !isSignUp && !showRecovery) {
      // Already in login mode, just ensure we're not in signup or recovery
      setIsSignUp(false);
      setShowRecovery(false);
      // Show success message if coming from password reset
      if (searchParams?.get("reset") === "success") {
        setSuccessMessage("Password updated successfully. Please log in with your new password.");
        // Clear message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    }
  }, [mode, isSignUp, showRecovery, searchParams]);

  // ✅ Create Supabase client ONCE per component lifecycle
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  // Redirect if already logged in
  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!isMounted) return;
        if (user) {
          const redirectTo = next.startsWith("/") ? next : "/dashboard";
          router.push(redirectTo);
        }
      })
      .catch(() => {
        // Ignore - auth can be in transient state during initial load
      });

    return () => {
      isMounted = false;
    };
  }, [router, supabase, next]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const redirectTo = next.startsWith("/") ? next : "/dashboard";

      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/builder`,
          },
        });

        if (signUpError) {
          setError(`Sign up failed: ${signUpError.message}`);
          return;
        }

        alert("Account created! You can now sign in.");
        setIsSignUp(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(`Sign in failed: ${signInError.message}`);
          return;
        }

        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: any) {
      setError(`Unexpected error: ${err?.message || "Unknown error occurred"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryLoading(true);
    setError(null);
    setRecoverySuccess(false);

    try {
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(
        recoveryEmail,
        {
          redirectTo: `${window.location.origin}/recover`,
        }
      );

      if (recoveryError) {
        setError(`Failed to send recovery email: ${recoveryError.message}`);
        return;
      }

      setRecoverySuccess(true);
    } catch (err: any) {
      setError(`Unexpected error: ${err?.message || "Unknown error occurred"}`);
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-lg mb-4">
            <span className="text-white font-bold text-2xl">FG</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">FormulaGuard</h1>
          <p className="text-sm text-gray-600 mt-2">
            Natural Cosmetics Formulation Platform
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Toggle Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setShowRecovery(false);
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-colors ${
                !isSignUp && !showRecovery
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setShowRecovery(false);
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-colors ${
                isSignUp && !showRecovery
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </button>
          </div>

          {/* Recovery Form */}
          {showRecovery ? (
            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="recovery-email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  id="recovery-email"
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              {recoverySuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    If an account exists for this email, a reset link has been sent.
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecovery(false);
                    setRecoveryEmail("");
                    setRecoverySuccess(false);
                    setError(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-md hover:bg-gray-200 transition-colors font-medium"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="flex-1 bg-teal-600 text-white py-2.5 px-4 rounded-md hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {recoveryLoading ? "Sending..." : "Send reset link"}
                </button>
              </div>
            </form>
          ) : (
            /* Login/Signup Form */
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="••••••••"
              />
              {isSignUp && (
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 6 characters
                </p>
              )}
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    setShowRecovery(true);
                    setRecoveryEmail(email);
                    setError(null);
                  }}
                  className="mt-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Forgot password?
                </button>
              )}
            </div>

            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-2.5 px-4 rounded-md hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-lg mb-4">
              <span className="text-white font-bold text-2xl">FG</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">FormulaGuard</h1>
            <p className="text-sm text-gray-600 mt-2">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
