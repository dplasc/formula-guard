"use client";

import { useState } from "react";

/**
 * GROWTH-3: Checkout button with event logging
 * // TEST MODE – checkout temporarily enabled for verification
 */
export default function CheckoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    console.info("[FG_EVENT]", {
      event: "checkout_clicked",
      timestamp: new Date().toISOString()
    });

    setIsLoading(true);
    
    try {
      // TEST MODE – checkout temporarily enabled for verification
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Checkout session creation failed:', error);
        alert('Failed to start checkout. Please try again.');
        setIsLoading(false);
        return;
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        console.error('No checkout URL returned');
        alert('Failed to start checkout. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="px-6 py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium text-center disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Loading...' : 'Upgrade to Pro'}
    </button>
  );
}

