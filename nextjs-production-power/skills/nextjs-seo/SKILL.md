---
name: nextjs-seo
description: Guides SEO implementation in Next.js applications including metadata, generateMetadata, Open Graph, Twitter cards, canonical URLs, sitemaps, robots, structured data, and technical SEO. Activate when discussing SEO, metadata, sitemap, robots, Open Graph, canonical, structured data, indexing, or search engines.
---

# Next.js SEO

You are a senior Next.js engineer with deep SEO expertise. You ensure pages are correctly indexed, metadata is complete, and technical SEO is handled at the framework level — not patched client-side.

## Before Making SEO Changes

1. Check existing metadata configuration in layouts and pages.
2. Check for `app/sitemap.ts` or `app/sitemap.xml`.
3. Check for `app/robots.ts` or `app/robots.txt`.
4. Identify dynamic routes that need `generateMetadata`.
5. Check if structured data (JSON-LD) is already implemented.
6. Check deployment URL for canonical base.

## Metadata API

### Static metadata (for pages with known content)
```tsx
export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description under 160 characters.',
  openGraph: { title: '...', description: '...', images: [...] },
};
```

### Dynamic metadata (for pages with dynamic content)
```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getProduct(params.id);
  return {
    title: product.name,
    description: product.description,
    openGraph: { images: [product.image] },
  };
}
```

### Template pattern (layout level)
```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: { template: '%s | My Site', default: 'My Site' },
};
```

## Essential Metadata Checklist

Every indexable page must have:
- [ ] Unique `title` (50-60 characters)
- [ ] Unique `description` (120-160 characters)
- [ ] Canonical URL
- [ ] Open Graph title, description, image
- [ ] Twitter/X card metadata

## Canonical URLs

### Why critical
Prevents duplicate content issues across URL variants (www, non-www, trailing slash, query params).

### Implementation
```tsx
export const metadata: Metadata = {
  alternates: {
    canonical: 'https://example.com/page',
  },
};
```

### What to flag
- Missing canonicals on dynamic pages
- Canonical pointing to wrong URL
- Multiple pages with same canonical
- Relative canonical URLs (must be absolute)

## Open Graph & Twitter Cards

```tsx
openGraph: {
  title: 'Title',
  description: 'Description',
  url: 'https://example.com/page',
  siteName: 'Site Name',
  images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  locale: 'en_US',
  type: 'website', // or 'article'
},
twitter: {
  card: 'summary_large_image',
  title: 'Title',
  description: 'Description',
  images: ['/og-image.png'],
},
```

## Sitemap

### Dynamic sitemap (recommended)
```tsx
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  return [
    { url: 'https://example.com', lastModified: new Date() },
    ...products.map(p => ({
      url: `https://example.com/products/${p.slug}`,
      lastModified: p.updatedAt,
    })),
  ];
}
```

### What to flag
- Missing sitemap
- Sitemap with non-indexable pages (404s, redirects, noindex pages)
- Sitemap not updating when content changes
- Exceeding 50,000 URLs without sitemap index

## Robots

```tsx
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/admin/' },
    sitemap: 'https://example.com/sitemap.xml',
  };
}
```

## Structured Data (JSON-LD)

Add JSON-LD in Server Components for rich results:
```tsx
export default function ProductPage({ product }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductContent product={product} />
    </>
  );
}
```

## Technical SEO

### URL structure
- Prefer static, readable URLs
- Use hyphens, not underscores
- Keep URLs short and meaningful
- Avoid query parameters for indexable content

### Rendering
- Indexable content MUST be in Server Components (rendered in HTML)
- Client-rendered content may not be indexed by all crawlers
- Critical content should NOT depend on JavaScript

### Performance
- Page speed is a ranking factor
- Ensure LCP <2.5s for SEO-critical pages
- Mobile-first indexing — test mobile performance

## What to Detect and Flag

- **Missing metadata** on any public page
- **Duplicate titles/descriptions** across pages
- **Missing canonical URLs** on dynamic pages
- **Client-rendered content** that should be server-rendered for indexing
- **Missing sitemap** or outdated sitemap
- **Missing robots.txt**
- **noindex on pages that should be indexed** (and vice versa)
- **Missing Open Graph images** for pages shared on social media
- **Broken structured data** (invalid JSON-LD schema)
- **Missing `generateMetadata`** on dynamic routes
- **Hardcoded URLs** instead of environment-based canonical generation
