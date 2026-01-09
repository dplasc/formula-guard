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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

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
          setLoading(false);
          return;
        }

        // Clear password for security and show confirmation message
        setPassword("");
        setSignUpSuccess(true);
        setError(null);
        setLoading(false);
        // Do NOT redirect or switch to sign-in mode - user must confirm email first
        return;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          // Check if error is due to unconfirmed email
          // Supabase returns specific errors for unconfirmed emails
          const errorMessage = signInError.message.toLowerCase();
          if (errorMessage.includes("email not confirmed") || 
              errorMessage.includes("email not verified") ||
              errorMessage.includes("signup is disabled")) {
            setError("Please check your email and confirm your account before signing in. If you didn't receive a confirmation email, please sign up again.");
          } else {
            setError(`Sign in failed: ${signInError.message}`);
          }
          setLoading(false);
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

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const redirectTo = next.startsWith("/") ? next : "/dashboard";
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (oauthError) {
        setError(`Google sign in failed: ${oauthError.message}`);
        setGoogleLoading(false);
      }
      // Note: If successful, user will be redirected, so we don't need to handle success case
    } catch (err: any) {
      setError(`Unexpected error: ${err?.message || "Unknown error occurred"}`);
      setGoogleLoading(false);
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
                setSignUpSuccess(false);
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
                setSignUpSuccess(false);
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
            <>
            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-md hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </button>

            {/* Divider */}
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>

            {/* Login/Signup Form */}
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

            {signUpSuccess && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  Check your email to confirm your account before signing in.
                </p>
              </div>
            )}

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
          </>
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
