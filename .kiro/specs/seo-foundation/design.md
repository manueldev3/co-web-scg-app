# Design Document: SEO Foundation

## Overview

El Sistema SEO se implementa como un directorio de librería independiente (`lib/seo/`) que expone funciones puras, constantes y componentes Server-Side de React, consumidos por el App Router de Next.js 16. El objetivo es dotar al sitio de metadatos completos (Open Graph, Twitter Cards, canonical URLs), datos estructurados (JSON-LD), sitemap dinámico, robots.txt, imágenes OG generadas en edge, y páginas de error con SEO apropiado — todo sin dependencias externas adicionales.

## Architecture

El Sistema_SEO se implementa como un directorio de librería independiente (`lib/seo/`) que expone funciones puras, constantes y componentes Server-Side de React. Los consumidores principales son:

1. **App Router files** — `app/sitemap.ts`, `app/robots.ts`, `app/og/[...path]/route.tsx`, `app/not-found.tsx`, `app/error.tsx`.
2. **Rutas dinámicas** — `app/mercancia/[name]/page.tsx` y `app/wiki/[category]/[slug]/page.tsx` invocan `generateMetadata` usando los helpers.
3. **Root layout** — `app/layout.tsx` inyecta el `WebSite` JSON-LD global.

No se añaden dependencias externas. Se usa exclusivamente la API disponible en Next.js 16 (`next/og` para `ImageResponse`, `MetadataRoute`, `Metadata`).

```
www/
├── lib/seo/
│   ├── index.ts              # Re-exports públicos
│   ├── constants.ts          # CANONICAL_DOMAIN, SITE_NAME, defaults
│   ├── metadata.ts           # buildMetadata()
│   ├── schemas.ts            # buildWebSiteSchema, buildBreadcrumbSchema, buildProductSchema, buildArticleSchema
│   └── components/
│       ├── JsonLd.tsx        # Server Component
│       └── Breadcrumbs.tsx   # Server Component
├── app/
│   ├── sitemap.ts
│   ├── robots.ts
│   ├── not-found.tsx
│   ├── error.tsx
│   └── og/[...path]/route.tsx
└── next.config.ts            # +remotePatterns para UEX images
```

---

## Components and Interfaces

### 1. `lib/seo/constants.ts`

Centraliza valores inmutables reutilizados por todos los módulos SEO.

```typescript
export const CANONICAL_DOMAIN = "https://scg-app.com";
export const SITE_NAME = "SCG - Guía de Star Citizen";
export const DEFAULT_LOCALE = "es_ES";
export const DEFAULT_DESCRIPTION =
  "Guía y herramientas de comercio para Star Citizen. Calculadora de rutas, precios de mercancía y wiki de naves.";
```

**Validates: Requirements 5.1, 3.2, 12.3**

---

### 2. `lib/seo/metadata.ts` — `buildMetadata`

Función pura que recibe una configuración por página y retorna un objeto `Metadata` completo.

```typescript
import type { Metadata } from "next";

export interface MetadataConfig {
  title: string;
  description: string;
  path: string;           // e.g. "/mercancia/hydrogen"
  ogType?: "website" | "article" | "product";
  ogImageUrl?: string;    // URL explícita; si ausente, se genera default
  noIndex?: boolean;
}

export function buildMetadata(config: MetadataConfig): Metadata {
  const canonical = buildCanonicalUrl(config.path);
  const ogImage = config.ogImageUrl ?? buildDefaultOgImageUrl(config.title);

  return {
    metadataBase: new URL(CANONICAL_DOMAIN),
    title: config.title,
    description: config.description,
    alternates: { canonical },
    openGraph: {
      title: config.title,
      description: config.description,
      url: canonical,
      siteName: SITE_NAME,
      locale: DEFAULT_LOCALE,
      type: config.ogType ?? "website",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
      images: [ogImage],
    },
    ...(config.noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
```

#### Canonical URL logic

```typescript
export function buildCanonicalUrl(path: string): string {
  const normalized = path.toLowerCase().replace(/\/+$/, "");
  const cleanPath = normalized === "" ? "/" : normalized;
  return `${CANONICAL_DOMAIN}${cleanPath}`;
}

function buildDefaultOgImageUrl(title: string): string {
  return `${CANONICAL_DOMAIN}/og/default?title=${encodeURIComponent(title)}`;
}
```

**Invariants:**
- Canonical siempre usa `CANONICAL_DOMAIN` como base.
- Canonical siempre es lowercase.
- Canonical nunca tiene trailing slash (excepto root `/`).
- `openGraph` y `twitter` siempre están presentes con todos los campos requeridos.

**Validates: Requirements 3.1–3.7, 5.1–5.4**

---

### 3. `lib/seo/schemas.ts`

Funciones puras que construyen objetos JSON-LD conformes a schema.org.

```typescript
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
```

**Validates: Requirements 6.3–6.6**

---

### 4. `lib/seo/components/JsonLd.tsx`

Server Component que serializa un objeto JSON-LD y lo inyecta de forma segura.

```typescript
interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data);
  // Escape para prevenir XSS: reemplazar </script> y caracteres HTML peligrosos
  const escaped = json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escaped }}
    />
  );
}
```

**Escaping strategy:** Unicode escapes (`\u003c`, `\u003e`, `\u0026`) son válidos dentro de JSON y neutralizan la posibilidad de inyección de `</script>` o entidades HTML.

**Validates: Requirements 6.1, 6.2**

---

### 5. `lib/seo/components/Breadcrumbs.tsx`

Server Component que renderiza migas de pan accesibles y emite JSON-LD.

```typescript
import { JsonLd } from "./JsonLd";
import { buildBreadcrumbSchema, BreadcrumbItem } from "../schemas";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const schema = buildBreadcrumbSchema(items);

  return (
    <>
      <JsonLd data={schema} />
      <nav aria-label="Breadcrumb" className="text-sm text-[#BCBEC0] py-2 px-4">
        <ol className="flex flex-wrap gap-1 list-none p-0 m-0">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden="true">/</span>}
                {isLast ? (
                  <span aria-current="page" className="text-[#9ED0FA]">
                    {item.label}
                  </span>
                ) : (
                  <a href={item.href} className="hover:text-[#9ED0FA] transition-colors">
                    {item.label}
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
```

**Validates: Requirements 7.1–7.6**

---

### 6. `app/sitemap.ts`

```typescript
import type { MetadataRoute } from "next";
import { CANONICAL_DOMAIN } from "@/lib/seo/constants";
import { fetchCommodities } from "@/app/mercancia/uex-api";
import { fetchVehicles } from "@/app/wiki/uex-api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${CANONICAL_DOMAIN}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${CANONICAL_DOMAIN}/mercancia`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${CANONICAL_DOMAIN}/mejor-ruta`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${CANONICAL_DOMAIN}/wiki`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${CANONICAL_DOMAIN}/organizador-de-carga`, changeFrequency: "weekly", priority: 0.7 },
  ];

  // Fetch dynamic data; on failure, APIs return [] (no throw)
  const [commodities, vehicles] = await Promise.allSettled([
    fetchCommodities(),
    fetchVehicles(),
  ]);

  const commodityEntries: MetadataRoute.Sitemap =
    commodities.status === "fulfilled"
      ? commodities.value.map((c) => ({
          url: `${CANONICAL_DOMAIN}/mercancia/${c.slug}`,
          changeFrequency: "daily" as const,
          priority: 0.7,
        }))
      : [];

  const vehicleEntries: MetadataRoute.Sitemap =
    vehicles.status === "fulfilled"
      ? vehicles.value
          .filter((v) => v.is_spaceship === 1)
          .map((v) => ({
            url: `${CANONICAL_DOMAIN}/wiki/naves/${toSlug(v.name_full ?? v.name)}`,
            changeFrequency: "daily" as const,
            priority: 0.7,
          }))
      : [];

  return [...staticPages, ...commodityEntries, ...vehicleEntries];
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

**Resiliency:** `Promise.allSettled` garantiza que si una API falla, la otra sigue generando entradas y las estáticas siempre están presentes.

**Validates: Requirements 1.1–1.7**

---

### 7. `app/robots.ts`

```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/og/"],
      },
    ],
    sitemap: "https://scg-app.com/sitemap.xml",
  };
}
```

**Validates: Requirements 2.1–2.4**

---

### 8. `app/og/[...path]/route.tsx`

Route handler para generar imágenes OG dinámicas mediante `ImageResponse`.

```typescript
import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "SCG - Guía de Star Citizen";
  const subtitle = searchParams.get("subtitle") ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#061220",
          padding: "60px",
        }}
      >
        <h1 style={{ color: "#9ED0FA", fontSize: 56, textAlign: "center" }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ color: "#BCBEC0", fontSize: 28, marginTop: 16 }}>
            {subtitle}
          </p>
        )}
        <p style={{ color: "#82919E", fontSize: 20, marginTop: 40 }}>
          scg-app.com
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
```

**Validates: Requirements 4.1–4.6**

---

### 9. `app/not-found.tsx`

```typescript
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página no encontrada | SCG",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center bg-[#061220] text-white px-4 py-16">
      <h1 className="text-4xl font-bold text-[#9ED0FA] mb-4">404</h1>
      <p className="text-lg text-[#BCBEC0] mb-8">Página no encontrada</p>
      <nav className="flex flex-col gap-3 items-center">
        <Link href="/" className="text-[#9ED0FA] hover:underline">Ir al inicio</Link>
        <Link href="/mercancia" className="text-[#9ED0FA] hover:underline">Mercancía</Link>
        <Link href="/mejor-ruta" className="text-[#9ED0FA] hover:underline">Mejor Ruta</Link>
        <Link href="/wiki" className="text-[#9ED0FA] hover:underline">Wiki</Link>
      </nav>
    </main>
  );
}
```

**Validates: Requirements 8.1–8.5**

---

### 10. `app/error.tsx`

```typescript
"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center bg-[#061220] text-white px-4 py-16">
      <h1 className="text-3xl font-bold text-[#9ED0FA] mb-4">
        Algo salió mal
      </h1>
      <p className="text-[#BCBEC0] mb-8 text-center max-w-md">
        Ha ocurrido un error inesperado. Puedes intentar de nuevo o volver al inicio.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#9ED0FA] text-[#061220] rounded font-medium hover:bg-[#7BBDE8] transition-colors"
        >
          Reintentar
        </button>
        <a
          href="/"
          className="px-4 py-2 border border-[#9ED0FA] text-[#9ED0FA] rounded hover:bg-[#9ED0FA]/10 transition-colors"
        >
          Ir al inicio
        </a>
      </div>
    </main>
  );
}
```

**Validates: Requirements 9.1–9.6**

---

### 11. `next.config.ts` — Remote Images

Se añade `images.remotePatterns` para el hostname de imágenes UEX sin alterar la configuración existente:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.uexcorp.space",
      },
    ],
  },
};

export default nextConfig;
```

**Validates: Requirements 10.1–10.3**

---

### 12. `generateMetadata` en rutas dinámicas

#### `/mercancia/[name]/page.tsx`

```typescript
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const commodity = await resolveCommodity(params.name);
  if (!commodity) notFound();

  return buildMetadata({
    title: `${commodity.name} - Precios en Star Citizen | SCG`,
    description: `Consulta precios de compra y venta de ${commodity.name} en todas las terminales de Star Citizen.`,
    path: `/mercancia/${params.name}`,
    ogType: "product",
  });
}
```

#### `/wiki/[category]/[slug]/page.tsx`

```typescript
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await resolveItem(params.category, params.slug);
  if (!item) notFound();

  const categoryLabel = resolveCategoryLabel(params.category);
  return buildMetadata({
    title: `${item.name} - ${categoryLabel} Star Citizen | SCG`,
    description: `Información detallada sobre ${item.name} en Star Citizen: especificaciones, precios y más.`,
    path: `/wiki/${params.category}/${params.slug}`,
    ogType: "product",
  });
}
```

**Validates: Requirements 11.1–11.5**

---

### 13. Module organization — `lib/seo/index.ts`

```typescript
export { CANONICAL_DOMAIN, SITE_NAME, DEFAULT_LOCALE, DEFAULT_DESCRIPTION } from "./constants";
export { buildMetadata, buildCanonicalUrl, type MetadataConfig } from "./metadata";
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
```

**Validates: Requirements 12.1–12.6**

---

## Data Models

### MetadataConfig

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | `string` | ✓ | Título de la página |
| description | `string` | ✓ | Descripción para meta y OG |
| path | `string` | ✓ | Path relativo (e.g. `/mercancia/hydrogen`) |
| ogType | `"website" \| "article" \| "product"` | ✗ | Tipo OG; default `"website"` |
| ogImageUrl | `string` | ✗ | URL explícita de imagen OG |
| noIndex | `boolean` | ✗ | Si es `true`, emite `noindex` |

### BreadcrumbItem

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| label | `string` | ✓ | Texto visible de la miga |
| href | `string` | ✓ | Path relativo (e.g. `/wiki`) |

### ProductSchemaInput

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | `string` | ✓ | Nombre del producto |
| description | `string` | ✓ | Descripción del producto |
| url | `string` | ✓ | URL canónica del producto |
| offers | `Offer[]` | ✗ | Lista de ofertas con precio |

### ArticleSchemaInput

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| headline | `string` | ✓ | Titular del artículo |
| author | `string` | ✓ | Nombre del autor |
| datePublished | `string` | ✓ | Fecha ISO 8601 |
| description | `string` | ✗ | Descripción del artículo |

---

## Error Handling

| Escenario | Componente | Comportamiento |
|-----------|-----------|----------------|
| API UEX caída durante sitemap | `app/sitemap.ts` | Retorna solo rutas estáticas; no lanza |
| API UEX caída durante `generateMetadata` | Ruta dinámica | `notFound()` si no resuelve el item |
| Slug no encontrado | Ruta dinámica | `notFound()` → `app/not-found.tsx` |
| Error en tiempo de ejecución | `app/error.tsx` | Error boundary con UI amigable y botón reintentar |
| JSON-LD con caracteres HTML | `JsonLd` | Unicode-escape previene XSS |
| `title` ausente en OG route | `app/og/[...path]/route.tsx` | Usa título por defecto del sitio |

---

## Interfaces

### Flujo de datos: Sitemap

```
[API UEX: commodities] ──┐
                          ├──→ sitemap() ──→ MetadataRoute.Sitemap[]
[API UEX: vehicles]  ────┘
[Static pages config] ────┘
```

### Flujo de datos: Metadata en ruta dinámica

```
[Slug param] → resolveItem() → buildMetadata(config) → Metadata object
                     │
                     └──→ notFound() (si no existe)
```

### Flujo de datos: Breadcrumbs

```
[Route context] → items[] → Breadcrumbs component
                                 ├──→ <nav> HTML (accessible)
                                 └──→ JsonLd(buildBreadcrumbSchema(items))
```

---

## Testing Strategy

La verificación de corrección se basa en **16 propiedades formales** (ver sección siguiente) validadas mediante **property-based testing** con Vitest + fast-check. Cada propiedad ejecuta un mínimo de 100 iteraciones con entradas generadas aleatoriamente.

- **Property tests** (fast-check): Verifican invariantes universales de las funciones puras — `buildCanonicalUrl`, `buildMetadata`, `buildBreadcrumbSchema`, `buildProductSchema`, `buildArticleSchema`, serialización JSON-LD, y generación de sitemap.
- **Unit tests** (Vitest): Cubren edge cases específicos (API caída, slugs vacíos, caracteres especiales) e integración de componentes React (renderizado de `Breadcrumbs`, `JsonLd`, `NotFound`, `ErrorPage`).
- **Snapshot/smoke tests**: Validan la estructura final de `sitemap.xml` y `robots.txt` generados.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Sitemap commodity entries match API data

*For any* list of commodities returned by the API, the sitemap output SHALL contain exactly one entry per commodity, and each entry's URL SHALL match the pattern `https://scg-app.com/mercancia/{slug}` where `{slug}` is derived from the commodity's slug field.

**Validates: Requirements 1.3**

### Property 2: Sitemap vehicle entries match API data

*For any* list of vehicles returned by the API where `is_spaceship === 1`, the sitemap output SHALL contain exactly one entry per spaceship, and each entry's URL SHALL match the pattern `https://scg-app.com/wiki/naves/{slug}` where `{slug}` is derived from the vehicle's name.

**Validates: Requirements 1.4**

### Property 3: Sitemap URL prefix invariant

*For any* entry in the sitemap output, the URL SHALL start with `https://scg-app.com`.

**Validates: Requirements 1.5**

### Property 4: Sitemap changeFrequency assignment

*For any* entry in the sitemap output, if the URL matches a commodity or vehicle pattern (`/mercancia/{slug}` or `/wiki/naves/{slug}`), its `changeFrequency` SHALL be `"daily"`; if the URL matches a static page pattern, its `changeFrequency` SHALL be `"weekly"`.

**Validates: Requirements 1.7**

### Property 5: Canonical URL correctness

*For any* valid path string, `buildCanonicalUrl(path)` SHALL produce a URL that (a) starts with `https://scg-app.com`, (b) is entirely lowercase, (c) has no trailing slash unless the path resolves to the root `/`, and (d) includes the normalized path segment.

**Validates: Requirements 3.3, 5.1, 5.2, 5.3, 5.4, 11.4**

### Property 6: Metadata completeness

*For any* valid `MetadataConfig` input, `buildMetadata` SHALL return a `Metadata` object containing (a) `openGraph` with `title`, `description`, `url`, `siteName` equal to `SITE_NAME`, `locale` equal to `"es_ES"`, `type`, and at least one image, and (b) `twitter` with `card` equal to `"summary_large_image"`, `title`, `description`, and at least one image.

**Validates: Requirements 3.4, 3.5**

### Property 7: OG image propagation

*For any* `MetadataConfig`, if `ogImageUrl` is provided, then both `openGraph.images` and `twitter.images` SHALL contain that URL; if `ogImageUrl` is absent, both SHALL contain a default URL of the form `https://scg-app.com/og/default?title={encoded_title}`.

**Validates: Requirements 3.6, 3.7**

### Property 8: JSON-LD serialization round-trip

*For any* valid JSON-serializable object passed to the `JsonLd` component, the rendered `<script>` element's inner content SHALL be parseable back to the original object via `JSON.parse` (after unescaping Unicode sequences).

**Validates: Requirements 6.1**

### Property 9: JSON-LD XSS escaping

*For any* JSON-LD object whose string values contain the characters `<`, `>`, or `&`, the serialized output within the `<script>` tag SHALL NOT contain literal `<`, `>`, or `&` characters — they SHALL be replaced with their Unicode escape equivalents (`\u003c`, `\u003e`, `\u0026`).

**Validates: Requirements 6.2**

### Property 10: BreadcrumbList schema positions

*For any* ordered list of `BreadcrumbItem` objects, `buildBreadcrumbSchema` SHALL return an object with `@type` equal to `"BreadcrumbList"` and an `itemListElement` array where each element has `position` equal to its 1-based index, `name` equal to the item's `label`, and `item` URL prefixed with `https://scg-app.com`.

**Validates: Requirements 6.4, 7.5**

### Property 11: Breadcrumbs accessibility structure

*For any* non-empty list of breadcrumb items, the `Breadcrumbs` component SHALL render (a) a `<nav>` element with `aria-label="Breadcrumb"`, (b) the last item with `aria-current="page"` and without an `<a>` tag, and (c) all non-last items as `<a>` links.

**Validates: Requirements 7.2, 7.3**

### Property 12: Breadcrumbs JSON-LD emission

*For any* non-empty list of breadcrumb items, the `Breadcrumbs` component SHALL emit a `<script type="application/ld+json">` element containing a valid `BreadcrumbList` schema where every `item` URL starts with `https://scg-app.com`.

**Validates: Requirements 7.4, 7.5**

### Property 13: Commodity metadata title pattern

*For any* commodity name string, the metadata title generated for `/mercancia/[name]` SHALL match the pattern `"{commodity_name} - Precios en Star Citizen | SCG"`.

**Validates: Requirements 11.1**

### Property 14: Wiki item metadata title pattern

*For any* item name and category label, the metadata title generated for `/wiki/[category]/[slug]` SHALL match the pattern `"{item_name} - {category_label} Star Citizen | SCG"`.

**Validates: Requirements 11.2**

### Property 15: Dynamic routes include OG image

*For any* dynamic route metadata generated via `generateMetadata`, the `openGraph.images` field SHALL contain at least one URL that includes the path segment `/og/`.

**Validates: Requirements 11.3**

### Property 16: Product schema structure

*For any* valid `ProductSchemaInput`, `buildProductSchema` SHALL return an object with `@context` equal to `"https://schema.org"`, `@type` equal to `"Product"`, and non-empty `name` and `description` fields matching the input values.

**Validates: Requirements 6.5**
