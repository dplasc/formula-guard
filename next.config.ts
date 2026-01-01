import type { NextConfig } from "next";

// Explicitly load .env.local in development to ensure NEXT_PUBLIC_* vars are available
// Note: Next.js automatically loads .env.local, but this ensures it's loaded before config evaluation
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (e) {
    // dotenv not available or .env.local doesn't exist - Next.js will handle it
  }
}

const nextConfig: NextConfig = {
  // output: 'export', // Commented out - needed for Supabase Auth to work
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
