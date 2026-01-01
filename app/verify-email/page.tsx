"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // ✅ Create Supabase client ONCE per component lifecycle
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (!user) {
        setError("Please sign in first.");
      }
    });
  }, [supabase]);

  const handleResend = async () => {
    if (!user) {
      setError("Please sign in first.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: user.email!,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (resendError) {
        setError(`Failed to resend email: ${resendError.message}`);
      } else {
        setMessage("Verification email sent! Please check your inbox.");
      }
    } catch (err: any) {
      setError(`Unexpected error: ${err?.message || "Unknown error occurred"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError(`Failed to sign out: ${signOutError.message}`);
      } else {
        router.push("/auth");
        router.refresh();
      }
    } catch (err: any) {
      setError(`Unexpected error: ${err?.message || "Unknown error occurred"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Verify your email</h1>
          
          <div className="mt-8 space-y-6">
            <p className="text-gray-700 leading-relaxed">
              We sent a verification link to your email. Please verify to continue.
            </p>

            <p className="text-sm text-gray-600">
              Need help? <a href="mailto:info@formulaguard.com" className="text-teal-600 hover:text-teal-700 underline">info@formulaguard.com</a>
            </p>

            {message && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">{message}</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={handleResend}
                disabled={loading || !user}
                className="flex-1 bg-teal-600 text-white py-2.5 px-4 rounded-md hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Resend verification email"}
              </button>

              <button
                onClick={handleSignOut}
                disabled={loading}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-md hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

