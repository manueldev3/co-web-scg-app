import { CANONICAL_DOMAIN, SITE_NAME } from "./constants";

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export function buildWebSiteSchema(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: CANONICAL_DOMAIN,
    potentialAction: {
      "@type": "SearchAction",
      target: `${CANONICAL_DOMAIN}/wiki?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${CANONICAL_DOMAIN}${item.href}`,
    })),
  };
}

export interface ProductSchemaInput {
  name: string;
  description: string;
  url: string;
  offers?: { priceCurrency: string; price: number; availability: string }[];
}

export function buildProductSchema(input: ProductSchemaInput): object {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    url: input.url,
    ...(input.offers && input.offers.length > 0
      ? { offers: input.offers.map((o) => ({ "@type": "Offer", ...o })) }
      : {}),
  };
}

export interface ArticleSchemaInput {
  headline: string;
  author: string;
  datePublished: string;
  description?: string;
}

export function buildArticleSchema(input: ArticleSchemaInput): object {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    author: { "@type": "Person", name: input.author },
    datePublished: input.datePublished,
    publisher: { "@type": "Organization", name: SITE_NAME, url: CANONICAL_DOMAIN },
    ...(input.description ? { description: input.description } : {}),
  };
}
