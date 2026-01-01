import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { buildMetadata } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://formulaguard.com"),
  ...buildMetadata({
    title: "FormulaGuard",
    description: "FormulaGuard helps cosmetic formulators build safe, compliant formulas with ingredient limits, EU Annex guidance, and IFRA notes — all in one workflow.",
    path: "/",
  }),
  description: "FormulaGuard helps cosmetic formulators build safe, compliant formulas with ingredient limits, EU Annex guidance, and IFRA notes — all in one workflow.",
  openGraph: {
    title: "FormulaGuard",
    description: "FormulaGuard helps cosmetic formulators build safe, compliant formulas with ingredient limits, EU Annex guidance, and IFRA notes — all in one workflow.",
    url: "https://formulaguard.com/",
    siteName: "FormulaGuard",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FormulaGuard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FormulaGuard",
    description: "FormulaGuard helps cosmetic formulators build safe, compliant formulas with ingredient limits, EU Annex guidance, and IFRA notes — all in one workflow.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {process.env.NODE_ENV === "production" && (
          <Script
            id="cookieyes"
            src="https://cdn-cookieyes.com/client_data/d670e61462cc5e99e52d2af5adb9bf25/script.js"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
