"use client";

import { useState } from "react";

type PlanType = "monthly" | "yearly";

interface CheckoutButtonProps {
  plan: PlanType;
}

/**
 * GROWTH-3: Checkout button with event logging
 * // TEST MODE – checkout temporarily enabled for verification
 */
export default function CheckoutButton({ plan }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    console.info("[FG_EVENT]", {
      event: "checkout_clicked",
      plan: plan,
      timestamp: new Date().toISOString()
    });

    setIsLoading(true);
    setError(null);
    
    try {
      // TEST MODE – checkout temporarily enabled for verification
      const requestBody = plan === "yearly" ? { plan: "yearly" } : {};
      
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Checkout session creation failed:', errorData);
        setError(errorData.error || 'Failed to start checkout. Please try again.');
        setIsLoading(false);
        return;
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        console.error('No checkout URL returned');
        setError('Failed to start checkout. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setError('Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="px-6 py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium text-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Loading...' : 'Upgrade to Pro'}
      </button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

