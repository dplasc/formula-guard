"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function RecoverForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  // Check if there's a valid recovery session
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    // Check for hash parameters (Supabase recovery links use hash fragments)
    const hasHashParams = typeof window !== 'undefined' && window.location.hash.includes('access_token');

    // First check: immediate session check
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;
        if (session?.user) {
          setIsValidSession(true);
          return;
        }

        // If no session but has hash params, wait a bit for Supabase to process
        if (hasHashParams) {
          timeoutId = setTimeout(() => {
            if (!isMounted) return;
            supabase.auth
              .getSession()
              .then(({ data: { session: retrySession } }) => {
                if (!isMounted) return;
                setIsValidSession(!!retrySession?.user);
              })
              .catch(() => {
                if (isMounted) {
                  setIsValidSession(false);
                }
              });
          }, 1000);
        } else {
          setIsValidSession(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsValidSession(false);
        }
      });

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(`Failed to update password: ${updateError.message}`);
        return;
      }

      setSuccess(true);
      // Redirect to login after a short delay with success parameter
      setTimeout(() => {
        router.push("/auth?mode=login&reset=success");
      }, 2000);
    } catch (err: any) {
      setError(`Unexpected error: ${err?.message || "Unknown error occurred"}`);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-lg mb-4">
              <span className="text-white font-bold text-2xl">FG</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">FormulaGuard</h1>
            <p className="text-sm text-gray-600 mt-2">Checking recovery session...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if no valid session
  if (isValidSession === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-lg mb-4">
              <span className="text-white font-bold text-2xl">FG</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">FormulaGuard</h1>
            <p className="text-sm text-gray-600 mt-2">
              Natural Cosmetics Formulation Platform
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  Invalid or expired recovery link. Please request a new reset email.
                </p>
              </div>
              <a
                href="/auth"
                className="inline-block w-full bg-teal-600 text-white py-2.5 px-4 rounded-md hover:bg-teal-700 transition-colors font-medium text-center"
              >
                Back to Sign In
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success message
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-lg mb-4">
              <span className="text-white font-bold text-2xl">FG</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">FormulaGuard</h1>
            <p className="text-sm text-gray-600 mt-2">
              Natural Cosmetics Formulation Platform
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  Password updated successfully. Redirecting to login...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show password reset form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-lg mb-4">
            <span className="text-white font-bold text-2xl">FG</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-sm text-gray-600 mt-2">
            Enter your new password below
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 6 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

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
              {loading ? "Updating..." : "Set new password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RecoverPage() {
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
      <RecoverForm />
    </Suspense>
  );
}

