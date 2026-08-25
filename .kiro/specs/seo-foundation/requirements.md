# Requirements Document

## Introduction

SEO Foundation establece la infraestructura de optimización para motores de búsqueda de la aplicación SCG (Star Citizen Guide). El proyecto actualmente carece de sitemap, robots.txt, metadatos Open Graph, datos estructurados JSON-LD y páginas de error estilizadas. Esta fase implementa todos los bloques fundamentales de SEO técnico como módulos reutilizables en `lib/seo/`, integrándose con el App Router de Next.js 16 y los datos dinámicos de la API UEX.

## Glossary

- **Sistema_SEO**: Conjunto de módulos, componentes y configuraciones en `lib/seo/` y archivos del App Router que gestionan la visibilidad del sitio en motores de búsqueda.
- **Generador_Sitemap**: Archivo `app/sitemap.ts` que produce un sitemap XML dinámico consultando la API UEX.
- **Generador_Robots**: Archivo `app/robots.ts` que produce el archivo robots.txt con directivas de rastreo.
- **Constructor_Metadata**: Funciones helper en `lib/seo/metadata.ts` que generan objetos `Metadata` de Next.js con Open Graph, Twitter Cards y URL canónica.
- **Generador_OG**: Route handlers en `app/og/` que producen imágenes Open Graph dinámicas mediante la API `ImageResponse` de Next.js.
- **Componente_JsonLd**: Componente React reutilizable que inyecta datos estructurados JSON-LD en el `<head>` de la página.
- **Componente_Breadcrumbs**: Componente React que renderiza migas de pan visuales y emite JSON-LD `BreadcrumbList`.
- **Pagina_404**: Archivo `app/not-found.tsx` que muestra una página 404 estilizada coherente con el tema del sitio.
- **Pagina_Error**: Archivo `app/error.tsx` que actúa como error boundary estilizado para errores en tiempo de ejecución.
- **Dominio_Canonico**: `https://scg-app.com` — dominio base para todas las URLs canónicas.
- **API_UEX**: API externa que provee datos de commodities, vehículos y terminales de Star Citizen.
- **Ruta_Dinamica**: Segmentos de URL con parámetros variables como `/mercancia/[name]` o `/wiki/[category]/[slug]`.
- **Ruta_Estatica**: Páginas con URL fija como `/`, `/mejor-ruta`, `/mercancia`.

## Requirements

### Requirement 1: Generación dinámica de Sitemap

**User Story:** As a search engine crawler, I want an up-to-date XML sitemap so that all indexable pages are discovered and crawled efficiently.

#### Acceptance Criteria

1. THE Generador_Sitemap SHALL export a default async function from `app/sitemap.ts` that returns a valid `MetadataRoute.Sitemap` array.
2. THE Generador_Sitemap SHALL include all Ruta_Estatica pages with `priority` and `changeFrequency` values appropriate to each page type.
3. WHEN the Generador_Sitemap executes, THE Generador_Sitemap SHALL fetch the list of commodities from the API_UEX and generate one entry per commodity with the pattern `/mercancia/{slug}`.
4. WHEN the Generador_Sitemap executes, THE Generador_Sitemap SHALL fetch the list of vehicles from the API_UEX and generate one entry per vehicle with the pattern `/wiki/naves/{slug}`.
5. THE Generador_Sitemap SHALL prefix all URLs with the Dominio_Canonico `https://scg-app.com`.
6. WHEN the API_UEX is unreachable, THE Generador_Sitemap SHALL return only the Ruta_Estatica entries without failing.
7. THE Generador_Sitemap SHALL assign `changeFrequency: "daily"` to commodity and vehicle pages and `changeFrequency: "weekly"` to static tool pages.

### Requirement 2: Generación de robots.txt

**User Story:** As a site administrator, I want a robots.txt that controls crawler access so that only indexable content is crawled and server resources are preserved.

#### Acceptance Criteria

1. THE Generador_Robots SHALL export a default function from `app/robots.ts` that returns a valid `MetadataRoute.Robots` object.
2. THE Generador_Robots SHALL allow all user agents to crawl the site by default.
3. THE Generador_Robots SHALL disallow crawling of `/api/`, `/og/`, and any private paths.
4. THE Generador_Robots SHALL include a `sitemap` field pointing to `https://scg-app.com/sitemap.xml`.

### Requirement 3: Metadata helpers reutilizables

**User Story:** As a developer, I want reusable metadata helper functions so that every page generates consistent Open Graph, Twitter Card, and canonical URL metadata without code duplication.

#### Acceptance Criteria

1. THE Constructor_Metadata SHALL export a function `buildMetadata` from `lib/seo/metadata.ts` that accepts a page-specific configuration object and returns a complete Next.js `Metadata` object.
2. THE Constructor_Metadata SHALL set the `metadataBase` property to `https://scg-app.com`.
3. THE Constructor_Metadata SHALL generate an `alternates.canonical` URL for every page based on its path.
4. THE Constructor_Metadata SHALL include `openGraph` properties with `title`, `description`, `url`, `siteName`, `locale` set to `es_ES`, and `type`.
5. THE Constructor_Metadata SHALL include `twitter` properties with `card` set to `summary_large_image`, `title`, and `description`.
6. WHEN an OG image URL is provided in the configuration, THE Constructor_Metadata SHALL include the image URL in both `openGraph.images` and `twitter.images`.
7. WHEN no OG image URL is provided, THE Constructor_Metadata SHALL generate a default OG image URL pointing to the Generador_OG route with the page title as parameter.

### Requirement 4: Generación de imágenes Open Graph

**User Story:** As a content sharer, I want dynamic Open Graph images generated per page so that social media previews show relevant and branded visuals.

#### Acceptance Criteria

1. THE Generador_OG SHALL expose a route handler at `app/og/[...path]/route.tsx` that returns an image response using the Next.js `ImageResponse` API.
2. THE Generador_OG SHALL accept query parameters for `title` and optionally `subtitle` to customize the generated image content.
3. THE Generador_OG SHALL render the image with the SCG brand colors: background `#061220` and accent text `#9ED0FA`.
4. THE Generador_OG SHALL produce images with dimensions 1200×630 pixels.
5. THE Generador_OG SHALL set appropriate cache headers to enable edge caching of generated images.
6. IF the `title` query parameter is missing, THEN THE Generador_OG SHALL return a default branded image with the site name "SCG - Guía de Star Citizen".

### Requirement 5: URLs canónicas

**User Story:** As a search engine, I want canonical URLs on every page so that duplicate content issues are avoided and link equity is consolidated.

#### Acceptance Criteria

1. THE Constructor_Metadata SHALL produce canonical URLs using the Dominio_Canonico `https://scg-app.com` as base for all pages.
2. THE Constructor_Metadata SHALL generate canonical URLs without trailing slashes except for the root path `/`.
3. THE Constructor_Metadata SHALL generate canonical URLs in lowercase.
4. WHEN a Ruta_Dinamica page calls `generateMetadata`, THE Constructor_Metadata SHALL construct the canonical URL using the resolved slug parameter.

### Requirement 6: Datos estructurados JSON-LD

**User Story:** As a search engine, I want structured data on pages so that rich results and enhanced SERP features can be displayed for SCG content.

#### Acceptance Criteria

1. THE Componente_JsonLd SHALL accept a `data` prop of type `Thing` (schema.org base) and render a `<script type="application/ld+json">` element with the serialized JSON-LD.
2. THE Componente_JsonLd SHALL escape HTML special characters within the JSON-LD content to prevent XSS.
3. THE Sistema_SEO SHALL export a helper function `buildWebSiteSchema` from `lib/seo/schemas.ts` that returns a valid schema.org `WebSite` object with `name`, `url`, and `potentialAction` for site search.
4. THE Sistema_SEO SHALL export a helper function `buildBreadcrumbSchema` from `lib/seo/schemas.ts` that accepts an ordered list of breadcrumb items and returns a valid schema.org `BreadcrumbList` object.
5. THE Sistema_SEO SHALL export a helper function `buildProductSchema` from `lib/seo/schemas.ts` that accepts commodity or vehicle data and returns a valid schema.org `Product` object with `name`, `description`, and `offers` where applicable.
6. THE Sistema_SEO SHALL export a helper function `buildArticleSchema` from `lib/seo/schemas.ts` that accepts guide metadata and returns a valid schema.org `Article` object with `headline`, `author`, `datePublished`, and `publisher`.
7. THE root layout SHALL include the `WebSite` JSON-LD schema on every page.

### Requirement 7: Componente de Breadcrumbs

**User Story:** As a user, I want visible breadcrumb navigation so that I can understand my location in the site hierarchy and navigate back to parent pages.

#### Acceptance Criteria

1. THE Componente_Breadcrumbs SHALL accept an ordered array of breadcrumb items, each containing `label` and `href`.
2. THE Componente_Breadcrumbs SHALL render a `<nav aria-label="Breadcrumb">` element with an ordered list of links.
3. THE Componente_Breadcrumbs SHALL mark the last item as the current page using `aria-current="page"` and render it without a link.
4. THE Componente_Breadcrumbs SHALL emit a `BreadcrumbList` JSON-LD schema using the Componente_JsonLd internally.
5. THE Componente_Breadcrumbs SHALL use the Dominio_Canonico as the base for all breadcrumb `item` URLs in the JSON-LD output.
6. THE Componente_Breadcrumbs SHALL style breadcrumb items consistently with the site theme using Tailwind CSS utility classes.

### Requirement 8: Página 404 estilizada

**User Story:** As a user who reaches a non-existent page, I want a helpful and branded 404 page so that I understand the situation and can navigate back to useful content.

#### Acceptance Criteria

1. THE Pagina_404 SHALL be defined at `app/not-found.tsx` and render a full-page layout consistent with the site theme (background `#061220`).
2. THE Pagina_404 SHALL display a clear heading indicating the page was not found.
3. THE Pagina_404 SHALL provide a link back to the homepage `/`.
4. THE Pagina_404 SHALL provide links to primary sections: `/mercancia`, `/mejor-ruta`, `/wiki`.
5. THE Pagina_404 SHALL export metadata with `title` set to "Página no encontrada | SCG" and a `robots` directive of `noindex`.

### Requirement 9: Página de error estilizada

**User Story:** As a user who encounters a runtime error, I want a friendly error page so that I can recover gracefully without seeing raw error details.

#### Acceptance Criteria

1. THE Pagina_Error SHALL be defined at `app/error.tsx` as a client component with `"use client"` directive.
2. THE Pagina_Error SHALL accept `error` and `reset` props as defined by the Next.js App Router error boundary contract.
3. THE Pagina_Error SHALL display a user-friendly message indicating something went wrong without exposing technical details.
4. THE Pagina_Error SHALL provide a "Reintentar" button that calls the `reset` function to re-render the segment.
5. THE Pagina_Error SHALL provide a link back to the homepage as a fallback navigation option.
6. THE Pagina_Error SHALL render with styling consistent with the site theme (background `#061220`, accent `#9ED0FA`).

### Requirement 10: Configuración de imágenes remotas

**User Story:** As a developer, I want remote image patterns configured in next.config.ts so that Next.js Image component can optimize images from the UEX API domain.

#### Acceptance Criteria

1. WHEN the application loads images from the API_UEX domain, THE Sistema_SEO SHALL have `images.remotePatterns` configured in `next.config.ts` to allow the UEX image hostname.
2. THE Sistema_SEO SHALL configure the remote pattern with protocol `https` and the appropriate UEX image hostname.
3. THE Sistema_SEO SHALL not remove or alter any existing configuration in `next.config.ts`.

### Requirement 11: generateMetadata en rutas dinámicas

**User Story:** As a developer, I want each dynamic route to export generateMetadata so that crawlers and social platforms receive page-specific titles, descriptions, and OG data.

#### Acceptance Criteria

1. WHEN a user visits `/mercancia/[name]`, THE Sistema_SEO SHALL generate metadata with a title following the pattern "{commodity_name} - Precios en Star Citizen | SCG" and a description including price range context.
2. WHEN a user visits `/wiki/[category]/[slug]`, THE Sistema_SEO SHALL generate metadata with a title following the pattern "{item_name} - {category_label} Star Citizen | SCG" and a description including relevant item attributes.
3. THE Sistema_SEO SHALL include an Open Graph image URL pointing to the Generador_OG for each Ruta_Dinamica page.
4. THE Sistema_SEO SHALL include the resolved canonical URL for each Ruta_Dinamica page.
5. IF the requested slug does not match any API_UEX record, THEN THE Sistema_SEO SHALL call `notFound()` to trigger the Pagina_404.

### Requirement 12: Organización de módulos SEO

**User Story:** As a developer, I want all SEO utilities organized under lib/seo/ so that the codebase maintains a clear separation of concerns and utilities are easily discoverable.

#### Acceptance Criteria

1. THE Sistema_SEO SHALL place all metadata helper functions in `lib/seo/metadata.ts`.
2. THE Sistema_SEO SHALL place all JSON-LD schema builder functions in `lib/seo/schemas.ts`.
3. THE Sistema_SEO SHALL place shared constants (Dominio_Canonico, site name, default descriptions) in `lib/seo/constants.ts`.
4. THE Sistema_SEO SHALL export a public API from `lib/seo/index.ts` that re-exports all helper functions and constants.
5. THE Sistema_SEO SHALL place the Componente_JsonLd in `lib/seo/components/JsonLd.tsx`.
6. THE Sistema_SEO SHALL place the Componente_Breadcrumbs in `lib/seo/components/Breadcrumbs.tsx`.
