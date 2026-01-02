"use client";

import { useEffect } from "react";

/**
 * GROWTH-3: Log pricing page view event on mount
 */
export default function PricingViewLogger() {
  useEffect(() => {
    console.info("[FG_EVENT]", {
      event: "pricing_viewed",
      timestamp: new Date().toISOString()
    });
  }, []);

  return null;
}

