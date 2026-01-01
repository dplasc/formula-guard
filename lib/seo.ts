import type { Metadata } from "next";

interface BuildMetadataParams {
  title: string;
  description: string;
  path: string;
}

export function buildMetadata({
  title,
  description,
  path,
}: BuildMetadataParams): Metadata {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const absoluteUrl = `${baseUrl}${path}`;

  // For layout default, use template format
  // For pages, return title as-is (template will handle prefix)
  const titleConfig =
    title === "FormulaGuard"
      ? { default: "FormulaGuard", template: "FormulaGuard — %s" }
      : title;

  const ogImageUrl = `${baseUrl}/og.png`;

  return {
    title: titleConfig,
    description,
    openGraph: {
      title,
      description,
      url: absoluteUrl,
      siteName: "FormulaGuard",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "FormulaGuard",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: absoluteUrl,
    },
  };
}

