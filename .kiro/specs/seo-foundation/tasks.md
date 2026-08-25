# Implementation Plan: SEO Foundation

## Overview

Implementar la infraestructura SEO completa para SCG App: módulos reutilizables en `lib/seo/`, archivos App Router (sitemap, robots, OG images, páginas de error), integración con rutas dinámicas existentes y esquemas JSON-LD. Todos los módulos usan APIs nativas de Next.js 16 sin dependencias externas adicionales.

## Tasks

- [x] 1. Crear módulos base de lib/seo
  - [x] 1.1 Crear `lib/seo/constants.ts` con CANONICAL_DOMAIN, SITE_NAME, DEFAULT_LOCALE, DEFAULT_DESCRIPTION
    - Exportar constantes inmutables usadas por todos los módulos SEO
    - _Requirements: 5.1, 3.2, 12.3_

  - [x] 1.2 Crear `lib/seo/metadata.ts` con buildMetadata y buildCanonicalUrl
    - Implementar `buildCanonicalUrl(path)`: normaliza a lowercase, sin trailing slash excepto root
    - Implementar `buildDefaultOgImageUrl(title)`: genera URL del endpoint OG
    - Implementar `buildMetadata(config: MetadataConfig)`: retorna Metadata completo con openGraph, twitter, canonical
    - Importar constantes desde `./constants`
    - _Requirements: 3.1–3.7, 5.1–5.4_

  - [x] 1.3 Escribir property tests para buildCanonicalUrl y buildMetadata
    - **Property 5: Canonical URL correctness** — para cualquier path válido, el resultado empieza con CANONICAL_DOMAIN, es lowercase, sin trailing slash excepto root
    - **Property 6: Metadata completeness** — para cualquier MetadataConfig válido, retorna openGraph y twitter con todos los campos requeridos
    - **Property 7: OG image propagation** — si ogImageUrl está presente se usa en ambos, si no se genera la URL default
    - **Validates: Requirements 3.3, 3.4, 3.5, 3.6, 3.7, 5.1–5.4**

  - [x] 1.4 Crear `lib/seo/schemas.ts` con funciones buildWebSiteSchema, buildBreadcrumbSchema, buildProductSchema, buildArticleSchema
    - Cada función retorna un objeto JSON-LD conforme a schema.org
    - buildBreadcrumbSchema: posiciones 1-indexed, URLs con CANONICAL_DOMAIN como prefijo
    - buildProductSchema: incluye offers cuando se proveen
    - buildArticleSchema: incluye publisher con SITE_NAME
    - _Requirements: 6.3–6.6_

  - [x] 1.5 Escribir property tests para schemas.ts
    - **Property 10: BreadcrumbList schema positions** — posiciones 1-based, names coinciden con labels, URLs con prefijo CANONICAL_DOMAIN
    - **Property 16: Product schema structure** — @context, @type, name y description presentes y coinciden con input
    - **Validates: Requirements 6.4, 6.5, 7.5**

- [x] 2. Crear componentes SEO
  - [x] 2.1 Crear `lib/seo/components/JsonLd.tsx` — Server Component que serializa JSON-LD con escape XSS
    - Reemplazar `<`, `>`, `&` con escapes Unicode (`\u003c`, `\u003e`, `\u0026`)
    - Renderizar `<script type="application/ld+json">` con dangerouslySetInnerHTML
    - _Requirements: 6.1, 6.2_

  - [x] 2.2 Escribir property tests para JsonLd
    - **Property 8: JSON-LD serialization round-trip** — el contenido serializado debe ser parseable de vuelta al objeto original
    - **Property 9: JSON-LD XSS escaping** — caracteres `<`, `>`, `&` nunca aparecen literalmente en el output
    - **Validates: Requirements 6.1, 6.2**

  - [x] 2.3 Crear `lib/seo/components/Breadcrumbs.tsx` — Server Component con nav accesible y emisión JSON-LD
    - Renderizar `<nav aria-label="Breadcrumb">` con `<ol>` de links
    - Último item con `aria-current="page"` sin link
    - Emitir JSON-LD BreadcrumbList usando JsonLd component internamente
    - Estilizar con Tailwind CSS coherente con el theme del sitio
    - _Requirements: 7.1–7.6_

  - [x] 2.4 Escribir property tests para Breadcrumbs
    - **Property 11: Breadcrumbs accessibility structure** — nav con aria-label, último item sin link con aria-current
    - **Property 12: Breadcrumbs JSON-LD emission** — script tag con BreadcrumbList schema, URLs con CANONICAL_DOMAIN
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5**

  - [x] 2.5 Crear `lib/seo/index.ts` — barrel export de todos los módulos
    - Re-exportar constantes, buildMetadata, buildCanonicalUrl, MetadataConfig
    - Re-exportar funciones de schemas y sus tipos
    - Re-exportar JsonLd y Breadcrumbs components
    - _Requirements: 12.1–12.6_

- [x] 3. Checkpoint - Verificar módulos lib/seo
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Crear archivos App Router SEO
  - [x] 4.1 Crear `app/robots.ts` — genera robots.txt con reglas de crawling
    - Permitir todos los user agents por defecto
    - Disallow `/api/` y `/og/`
    - Incluir sitemap URL apuntando a `https://scg-app.com/sitemap.xml`
    - _Requirements: 2.1–2.4_

  - [x] 4.2 Crear `app/sitemap.ts` — genera sitemap XML dinámico
    - Incluir rutas estáticas con priority y changeFrequency "weekly"
    - Fetch commodities y vehicles de API UEX con Promise.allSettled
    - Generar entries dinámicas con changeFrequency "daily"
    - Prefijo CANONICAL_DOMAIN en todas las URLs
    - Manejar fallos de API retornando solo rutas estáticas
    - _Requirements: 1.1–1.7_

  - [x] 4.3 Escribir property tests para sitemap
    - **Property 1: Sitemap commodity entries match API data** — una entrada por commodity con URL `/mercancia/{slug}`
    - **Property 2: Sitemap vehicle entries match API data** — una entrada por spaceship con URL `/wiki/naves/{slug}`
    - **Property 3: Sitemap URL prefix invariant** — todas las URLs empiezan con CANONICAL_DOMAIN
    - **Property 4: Sitemap changeFrequency assignment** — daily para dinámicas, weekly para estáticas
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.7**

  - [x] 4.4 Crear `app/og/[...path]/route.tsx` — Route handler para imágenes OG dinámicas
    - Usar `ImageResponse` de `next/og` con runtime edge
    - Aceptar query params `title` y `subtitle`
    - Renderizar con colores SCG: fondo `#061220`, accent `#9ED0FA`
    - Dimensiones 1200x630px
    - Cache headers: `public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800`
    - Default a "SCG - Guía de Star Citizen" si falta title
    - _Requirements: 4.1–4.6_

  - [x] 4.5 Crear `app/not-found.tsx` — Página 404 estilizada
    - Layout coherente con theme (fondo `#061220`)
    - Heading indicando página no encontrada
    - Links a homepage, /mercancia, /mejor-ruta, /wiki
    - Exportar metadata con title "Página no encontrada | SCG" y robots noindex
    - _Requirements: 8.1–8.5_

  - [x] 4.6 Crear `app/error.tsx` — Error boundary estilizado
    - Client component con "use client" directive
    - Aceptar props `error` y `reset`
    - Mensaje amigable sin detalles técnicos
    - Botón "Reintentar" que invoca reset()
    - Link de fallback al homepage
    - Estilos coherentes con theme
    - _Requirements: 9.1–9.6_

- [x] 5. Integrar SEO en rutas existentes
  - [x] 5.1 Actualizar `next.config.ts` con images.remotePatterns para UEX
    - Añadir remotePatterns con protocol "https" y hostname "media.uexcorp.space"
    - No alterar configuración existente
    - _Requirements: 10.1–10.3_

  - [x] 5.2 Añadir `generateMetadata` en `app/mercancia/[name]/page.tsx`
    - Resolver commodity por slug usando API existente
    - Generar título con patrón "{name} - Precios en Star Citizen | SCG"
    - Incluir OG image URL y canonical URL
    - Llamar `notFound()` si slug no existe
    - _Requirements: 11.1, 11.3, 11.4, 11.5_

  - [x] 5.3 Escribir property tests para metadata de commodity
    - **Property 13: Commodity metadata title pattern** — título sigue patrón "{commodity_name} - Precios en Star Citizen | SCG"
    - **Property 15: Dynamic routes include OG image** — openGraph.images contiene URL con `/og/`
    - **Validates: Requirements 11.1, 11.3**

  - [x] 5.4 Añadir `generateMetadata` en `app/wiki/[category]/[slug]/page.tsx`
    - Resolver item por category y slug
    - Generar título con patrón "{name} - {category_label} Star Citizen | SCG"
    - Incluir OG image URL y canonical URL
    - Llamar `notFound()` si no existe
    - _Requirements: 11.2, 11.3, 11.4, 11.5_

  - [x] 5.5 Escribir property tests para metadata de wiki
    - **Property 14: Wiki item metadata title pattern** — título sigue patrón "{item_name} - {category_label} Star Citizen | SCG"
    - **Property 15: Dynamic routes include OG image** — openGraph.images contiene URL con `/og/`
    - **Validates: Requirements 11.2, 11.3**

  - [x] 5.6 Actualizar `app/layout.tsx` para incluir WebSite JSON-LD schema global
    - Importar JsonLd component y buildWebSiteSchema desde lib/seo
    - Inyectar `<JsonLd data={buildWebSiteSchema()} />` dentro del `<head>`
    - _Requirements: 6.7_

- [x] 6. Final checkpoint - Verificar integración completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- El proyecto usa TypeScript, Next.js 16 App Router, Vitest y fast-check
- No se requieren dependencias adicionales — todo usa APIs nativas de Next.js 16
- Path alias `@` apunta al root del proyecto

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.4"] },
    { "id": 2, "tasks": ["1.3", "1.5", "2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3"] },
    { "id": 4, "tasks": ["2.4", "2.5"] },
    { "id": 5, "tasks": ["4.1", "4.4", "4.5", "4.6", "5.1"] },
    { "id": 6, "tasks": ["4.2", "5.2", "5.4", "5.6"] },
    { "id": 7, "tasks": ["4.3", "5.3", "5.5"] }
  ]
}
```
