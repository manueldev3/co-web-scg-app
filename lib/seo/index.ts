export { CANONICAL_DOMAIN, SITE_NAME, DEFAULT_LOCALE, DEFAULT_DESCRIPTION } from "./constants";
export { buildMetadata, buildCanonicalUrl, buildDefaultOgImageUrl, type MetadataConfig } from "./metadata";
export {
  buildWebSiteSchema,
  buildBreadcrumbSchema,
  buildProductSchema,
  buildArticleSchema,
  type BreadcrumbItem,
  type ProductSchemaInput,
  type ArticleSchemaInput,
} from "./schemas";
export { JsonLd } from "./components/JsonLd";
export { Breadcrumbs } from "./components/Breadcrumbs";
