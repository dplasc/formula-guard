"use client";

/**
 * GROWTH-3: Checkout button with event logging
 */
export default function CheckoutButton({ checkoutUrl }: { checkoutUrl: string }) {
  const handleClick = () => {
    console.info("[FG_EVENT]", {
      event: "checkout_clicked",
      timestamp: new Date().toISOString()
    });
  };

  return (
    <a
      href={checkoutUrl}
      onClick={handleClick}
      className="px-6 py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium text-center"
    >
      Upgrade to Pro
    </a>
  );
}

