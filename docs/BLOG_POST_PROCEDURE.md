# Blog Post Procedure

## Purpose

This document outlines the standard procedure for creating and publishing blog posts on FormulaGuard. Follow these guidelines to ensure consistency and proper integration with the site's blog system.

## File Location and Naming

- **Location**: All blog posts must be placed in `content/blog/`
- **File format**: Use `.mdx` extension
- **Naming convention**: Use kebab-case (lowercase with hyphens)
  - Example: `what-is-formulaguard.mdx`, `ifra-compliance-guide.mdx`
- **Slug rules**: The filename (without `.mdx`) becomes the URL slug
  - `what-is-formulaguard.mdx` → `/blog/what-is-formulaguard`

## Frontmatter Fields

All blog posts must include frontmatter at the top of the file:

```mdx
---
title: "Your Post Title"
date: "YYYY-MM-DD"
description: "A brief description for SEO and preview cards"
cover: "/blog/your-slug/cover.jpg"
category: "Updates"
---
```

**Required fields:**
- `title`: Post title (string)
- `date`: Publication date in `YYYY-MM-DD` format
- `description`: SEO description and preview text (string)

**Optional fields:**
- `cover`: Path to cover image (string, e.g., `/blog/your-slug/cover.jpg`)
- `category`: Post category (string, e.g., "Updates", "Tutorials", "News")

## Images

- **Location**: Place images in `public/blog/[slug]/`
  - Example: For post `what-is-formulaguard.mdx`, images go in `public/blog/what-is-formulaguard/`
- **Naming**: Use descriptive kebab-case names
  - Examples: `cover.jpg`, `overview.jpg`, `formula-example.jpg`
- **Usage in MDX**: Import and use Next.js Image component:
  ```mdx
  import Image from "next/image";
  
  <Image
    src="/blog/your-slug/image-name.jpg"
    width={1200}
    height={630}
    alt="Descriptive alt text"
  />
  ```

## Publishing Checklist

- [ ] MDX file created in `content/blog/` with kebab-case filename
- [ ] Frontmatter includes required fields (title, date, description)
- [ ] Date is in `YYYY-MM-DD` format and set to intended publication date
- [ ] Images placed in `public/blog/[slug]/` directory matching the post slug
- [ ] All images have descriptive alt text for accessibility
- [ ] Content reviewed for accuracy and formatting
- [ ] Test the post locally at `/blog/[slug]` to verify rendering

