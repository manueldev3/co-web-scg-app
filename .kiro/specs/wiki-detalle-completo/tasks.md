# Implementation Plan: Wiki — Detalle completo

## Overview

Mejora incremental del Detalle_Elemento de la wiki (`/wiki/naves/[slug]`) en TypeScript (Next.js App Router), construida de adentro hacia afuera sobre la spec `wiki` existente: primero se amplían los tipos, luego la lógica pura nueva de `utils.ts` (con tests de propiedades), después las nuevas fuentes del Cliente_UEX, a continuación la agregación resiliente en `naves.loadDetail`, y finalmente la presentación por secciones en `DetailView.tsx`. Cada paso se apoya en los anteriores y termina integrado, sin código huérfano.

Toda función pura cubierta por una propiedad del diseño tiene su test de propiedad con `fast-check` (mínimo 100 iteraciones, `{ numRuns: 100 }`), etiquetado `Feature: wiki-detalle-completo, Property {N}: {texto}`. Las propiedades heredadas de la spec `wiki` que siguen vigentes (round-trip de `parseContainerSizes`, marcador de `displayValue`) no se reescriben. Antes de escribir o modificar rutas, componentes o llamadas de datos de Next.js se consulta `node_modules/next/dist/docs/` según `AGENTS.md` (Req 8.1–8.3).

## Tasks

- [x] 1. Ampliar la base de tipos
  - [x] 1.1 Ampliar `app/wiki/types.ts` con los tipos de la API y el modelo de detalle generalizado
    - Ampliar `ApiVehicle` con los campos nuevos de `/vehicles`, todos opcionales/anulables: dimensiones (`mass`, `width`, `height`, `length`), combustible y versión (`fuel_quantum`, `fuel_hydrogen`, `game_version`), imágenes y enlaces (`url_photo`, `url_photos`, `url_store`, `url_brochure`, `url_video`, `url_hotsite`), identidad (`uuid`, `slug`) y el conjunto ampliado de indicadores `is_*` (`is_mining`, `is_salvage`, `is_refinery`, `is_scanning`, `is_exploration`, `is_military`, `is_civilian`, `is_medical`, `is_racing`, `is_stealth`)
    - Añadir `ApiVehiclePurchasePrice` (`id_vehicle`, `id_terminal`, `price_buy`, `vehicle_name?`, `terminal_name?`), `ApiVehicleRentalPrice` (con `price_rent`) y `ApiTerminal` (`id`, `name`, `nickname?`, `star_system_name?`, `planet_name?`, `city_name?`, `space_station_name?`)
    - Añadir los tipos del modelo de detalle: `PriceOperation` (`"buy" | "rent"`), `PriceRow` (`locationName`, `price`), `ExternalLinkType` (`"store" | "brochure" | "video" | "hotsite"`), `LinkEntry` (`type`, `label`, `href`), `GalleryImages` (`mainImage`, `images`, `altBase`) y la unión discriminada `DetailSection` por `kind` (`fields` | `gallery` | `prices` | `links`); conservar `DetailField`
    - Generalizar `WikiDetail`: eliminar `fields`/`classifications` planos y añadir `sections: DetailSection[]`, conservando `categoryId`, `title`, `subtitle`
    - _Requirements: 1.1, 1.2, 1.6, 2.3, 2.4, 2.5, 3.1, 4.2, 4.3, 5.1, 5.2_

- [x] 2. Implementar la lógica pura nueva (`app/wiki/utils.ts`)
  - [x] 2.1 Implementar `parsePhotoUrls`
    - Decodifica la cadena JSON de `url_photos` en `string[]`; resiliente ante `null`/`undefined`/`""`/JSON inválido/JSON no-array → `[]`; nunca lanza
    - _Requirements: 3.2, 3.3_

  - [x]\* 2.2 Escribir test de propiedad para `parsePhotoUrls`
    - **Feature: wiki-detalle-completo, Property 1: Round-trip y resiliencia de parsePhotoUrls**
    - **Validates: Requirements 3.2, 3.3**
    - `fast-check` con `{ numRuns: 100 }`; round-trip con `fc.array(fc.webUrl())` vía `JSON.stringify`, y resiliencia con `fc.oneof` de null/undefined/""/JSON inválido/JSON no-array
    - Archivo: `app/wiki/__tests__/parse-photo-urls.property.test.ts`

  - [x] 2.3 Implementar `buildLocationNameResolver`
    - Construye un resolver `(idTerminal, fallbackName) => string`: nombre del terminal coincidente por `id`; si no hay coincidencia, `fallbackName` si no es Dato_Faltante ni cadena vacía; en otro caso, el marcador `MISSING_DATA`
    - _Requirements: 4.4, 4.5_

  - [x]\* 2.4 Escribir test de propiedad para `buildLocationNameResolver`
    - **Feature: wiki-detalle-completo, Property 3: Resolución de nombre de ubicación con fallback**
    - **Validates: Requirements 4.4, 4.5**
    - `fast-check` con `{ numRuns: 100 }`; `fc.array(ApiTerminal)` + `id_terminal` dentro/fuera del conjunto + `fallbackName` nullable/vacío
    - Archivo: `app/wiki/__tests__/location-resolver.property.test.ts`

  - [x] 2.5 Implementar `buildExternalLinks`
    - Recorre `url_store`/`url_brochure`/`url_video`/`url_hotsite` en orden estable; omite Dato_Faltante y cadenas vacías; asigna `label` por tipo y conserva el `href` original
    - _Requirements: 5.1, 5.2, 5.4_

  - [x]\* 2.6 Escribir test de propiedad para `buildExternalLinks`
    - **Feature: wiki-detalle-completo, Property 5: Omisión y etiquetado de enlaces externos**
    - **Validates: Requirements 5.1, 5.2, 5.4**
    - `fast-check` con `{ numRuns: 100 }`; `ApiVehicle` con los cuatro `url_*` nullable/vacío/URL
    - Archivo: `app/wiki/__tests__/external-links.property.test.ts`

  - [x] 2.7 Ampliar `activeClassifications`
    - Añadir las etiquetas del conjunto ampliado de indicadores `is_*` (minería, salvamento, refinería, escaneo, exploración, militar, civil, médico, carreras, sigilo) al mapa estable indicador→etiqueta; solo añade etiqueta cuando el valor es exactamente `1`; ignora `0`/`null`/ausente; orden de salida según el orden del mapa
    - _Requirements: 2.5_

  - [x]\* 2.8 Escribir test de propiedad para `activeClassifications` (migrar el existente)
    - **Feature: wiki-detalle-completo, Property 6: Clasificaciones activas ampliadas y completas**
    - **Validates: Requirements 2.5**
    - Reescribir `app/wiki/__tests__/classifications.property.test.ts` para cubrir combinaciones de todos los flags `is_*` (1/0/null/ausente) y múltiples activos simultáneos; `fast-check` con `{ numRuns: 100 }`

  - [x] 2.9 Implementar `buildGalleryImages`
    - `mainImage` desde `url_photo` (null si vacío/faltante), `images` desde `parsePhotoUrls(url_photos)`, `altBase` desde `resolveShipName(v)`; devuelve `null` cuando no hay ninguna imagen
    - Depende de `parsePhotoUrls` (2.1)
    - _Requirements: 3.1, 3.4, 3.5_

  - [x]\* 2.10 Escribir test de propiedad para `buildGalleryImages`
    - **Feature: wiki-detalle-completo, Property 2: Composición de la galería**
    - **Validates: Requirements 3.1, 3.4, 3.5**
    - `fast-check` con `{ numRuns: 100 }`; `ApiVehicle` con `url_photo` nullable/vacío y `url_photos` variado
    - Archivo: `app/wiki/__tests__/gallery-images.property.test.ts`

  - [x] 2.11 Implementar `buildPriceRows`
    - Filtra las filas por `id_vehicle === vehicleId`, preserva el orden, y mapea cada fila a `{ locationName: resolver(id_terminal, terminal_name), price }`; parametrizado por la clave de precio (`price_buy` / `price_rent`) o aceptando filas ya normalizadas
    - Depende del resolver de `buildLocationNameResolver` (2.3)
    - _Requirements: 4.2, 4.3, 4.6_

  - [x]\* 2.12 Escribir test de propiedad para `buildPriceRows`
    - **Feature: wiki-detalle-completo, Property 4: Filtrado y completitud de las filas de precio**
    - **Validates: Requirements 4.2, 4.3, 4.6**
    - `fast-check` con `{ numRuns: 100 }`; filas con `id_vehicle` mezclados + resolver mock; verifica una `PriceRow` por fila coincidente, ninguna de otro vehículo, orden y `price` preservados
    - Archivo: `app/wiki/__tests__/price-rows.property.test.ts`

  - [x] 2.13 Reescribir `buildShipDetail` a secciones componibles
    - Nueva firma `(v, purchases, rentals, terminals) => WikiDetail`; conserva `title = resolveShipName(v)` y `subtitle = displayValue(company_name)`; compone `sections` en el orden canónico (gallery, fields "Ficha técnica", prices-compra, prices-alquiler, links), **omitiendo** las vacías y **conservando siempre** la Ficha_Tecnica
    - La sección Ficha_Tecnica incluye los campos existentes (scu, crew, pad_type, container_sizes), los nuevos (masa, longitud, anchura, altura, fuel_quantum, fuel_hydrogen, game_version) y las clasificaciones activas; usa `buildGalleryImages`, `buildPriceRows` + `buildLocationNameResolver`, y `buildExternalLinks`
    - Depende de todos los helpers anteriores (2.1, 2.3, 2.5, 2.7, 2.9, 2.11)
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 2.1, 2.2, 2.3, 2.4, 4.7, 4.8, 5.5, 6.7, 7.4, 7.5_

  - [x]\* 2.14 Escribir test de propiedad para `buildShipDetail` (reescribir el existente)
    - **Feature: wiki-detalle-completo, Property 7: Composición, orden y omisión de secciones del detalle**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.6, 2.1, 2.2, 2.3, 2.4, 4.7, 4.8, 5.5, 6.7, 7.4, 7.5**
    - Reescribir `app/wiki/__tests__/detail-structure.property.test.ts` contra el nuevo modelo: `title`/`subtitle`, presencia siempre de la sección `fields` de Ficha_Tecnica, inclusión condicional de gallery/prices/links y orden canónico fijo; `ApiVehicle` + listas de precios/terminales arbitrarias; `fast-check` con `{ numRuns: 100 }`

- [x] 3. Checkpoint - Lógica pura validada
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implementar las nuevas fuentes del Cliente_UEX (`app/wiki/uex-api.ts`)
  - [x] 4.1 Añadir `fetchVehiclePurchasePrices`, `fetchVehicleRentalPrices` y `fetchTerminals`
    - Consultar `node_modules/next/dist/docs/` para el patrón de fetch/caché vigente (modelo `next: { revalidate }`, sin Cache Components)
    - Replicar **exactamente** el patrón de `fetchVehicles`: `Accept: application/json`, **sin** `Authorization`, endpoints masivos `*_all` (`/vehicles_purchases_prices_all`, `/vehicles_rentals_prices_all`, `/terminals`), `next: { revalidate: 3600 }` (dentro de [3300, 3900]), lee `json.data ?? []`, `try/catch` → `console.error` y devuelve `[]`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.3_

  - [x]\* 4.2 Escribir test de propiedad para la resiliencia de las nuevas fuentes
    - **Feature: wiki-detalle-completo, Property 8: Resiliencia y extracción del Cliente_UEX (nuevas fuentes)**
    - **Validates: Requirements 6.4, 6.5**
    - `fast-check` con `{ numRuns: 100 }` mockeando `global.fetch`; respuestas con/sin `data`, status 2xx/no-2xx y `fetch` que lanza; cada función devuelve `json.data` cuando existe y `[]` en cualquier otro caso, sin propagar excepciones
    - Archivo: `app/wiki/__tests__/uex-client-prices.property.test.ts`

  - [x]\* 4.3 Escribir tests de integración de las nuevas fuentes
    - Con `global.fetch` mockeado (1–3 ejemplos): cabecera `Accept: application/json` presente y `Authorization` ausente; URLs masivas `*_all` sin fan-out por nave; `next.revalidate` dentro de `[3300, 3900]`
    - _Requirements: 6.1, 6.2, 6.3_
    - Archivo: `app/wiki/__tests__/uex-api-prices.integration.test.ts`

- [x] 5. Reescribir la agregación del detalle (`app/wiki/categories/naves.ts`)
  - [x] 5.1 Reescribir `naves.loadDetail` para agregar las cuatro fuentes con `Promise.allSettled`
    - Consultar `node_modules/next/dist/docs/` para confirmar el patrón de data-fetching vigente
    - `Promise.allSettled([fetchVehicles, fetchVehiclePurchasePrices, fetchVehicleRentalPrices, fetchTerminals])`; cada origen → `[]` si `rejected`; `filterSpaceships` + búsqueda por slug; `null` si no se encuentra; en otro caso `buildShipDetail(ship, purchases, rentals, terminals)`. `loadItems` no cambia
    - _Requirements: 4.1, 6.6, 6.7, 7.1_

  - [x]\* 5.2 Escribir tests de `loadDetail` (unitario + integración de agregación)
    - `loadDetail` devuelve `null` para slug inexistente (Req 7.1); cuando una fuente de precios falla o devuelve `[]`, el detalle se compone igualmente sin ese Bloque_Precios (Req 6.6, 6.7)
    - _Requirements: 6.6, 6.7, 7.1_
    - Archivo: `app/wiki/__tests__/naves-load-detail.test.ts`

- [x] 6. Checkpoint - Acceso a datos y agregación validados
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Reescribir la presentación por secciones (`app/wiki/[category]/[slug]/DetailView.tsx`)
  - [x] 7.1 Reescribir `DetailView` para renderizar secciones por `kind`
    - Consultar `node_modules/next/dist/docs/` antes de modificar el componente (Server Component, `<Link>` de `next/link`)
    - Conservar el encabezado (título + subtítulo, Req 1.6) y el enlace "Volver al listado" (Req 1.7); iterar `detail.sections` en orden (Req 1.3) y despachar a un sub-renderer según `kind` (Req 1.4, 1.5)
    - Sub-renderers presentacionales: `FieldsSection` (`<dl>` reutilizando la presentación actual, `string[]` como lista), `GallerySection` (`<img loading="lazy" alt={...}>` nativo —sin `next/image` por ausencia de `remotePatterns`—, `alt` derivado de `altBase`), `PricesSection` (encabezado por `operation` + tabla con importe en aUEC), `LinksSection` (cada enlace con `target="_blank"` y `rel="noopener noreferrer"` y su etiqueta de tipo)
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 3.1, 3.5, 4.2, 4.3, 4.9, 5.2, 5.3, 8.1, 8.3_

  - [x]\* 7.2 Migrar y ampliar los tests de componente del detalle
    - Reescribir los fixtures `makeDetail()` de `app/wiki/__tests__/DetailView.test.tsx` a la forma `sections: DetailSection[]`; conservar las aserciones de título, subtítulo y "Volver al listado"; verificar render de secciones **en orden** (Req 1.3) y sub-renderer correcto por `kind` (Req 1.4, 1.5); añadir aserciones para `GallerySection` (`alt` derivado del nombre), `PricesSection` (fila por ubicación + importe en aUEC + encabezado por operación) y `LinksSection` (`target="_blank"`, `rel="noopener noreferrer"`, etiqueta de tipo)
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 3.1, 3.5, 4.2, 4.3, 4.9, 5.2, 5.3_

- [x] 8. Checkpoint final - Verificar build y tests
  - Ejecutar la suite de tests y `next build`; confirmar que no se usan APIs obsoletas de Next.js (Req 8.3) consultando `node_modules/next/dist/docs/`. Ensure all tests pass, ask the user if questions arise.

## Notes

- Las tareas marcadas con `*` son opcionales (tests) y pueden omitirse para un MVP más rápido; las de implementación nunca se marcan opcionales.
- Cada tarea referencia requisitos específicos para trazabilidad.
- Los tests de propiedades (`fast-check`, mínimo 100 iteraciones) validan las propiedades de corrección universales del diseño; los tests unitarios, de componente e integración cubren criterios concretos (formato aUEC, render por `kind`, headers/`*_all`/`revalidate`, agregación resiliente).
- Las propiedades heredadas de la spec `wiki` vigentes (`parseContainerSizes`, `displayValue`) y los tests no relacionados de `utils.ts` no se modifican.
- Los checkpoints aseguran validación incremental.
- Antes de escribir o modificar rutas, componentes o llamadas de datos de Next.js (4.1, 5.1, 7.1) se consulta `node_modules/next/dist/docs/` según `AGENTS.md`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.3", "2.5", "2.7", "4.1"] },
    {
      "id": 2,
      "tasks": ["2.2", "2.4", "2.6", "2.8", "2.9", "2.11", "4.2", "4.3"]
    },
    { "id": 3, "tasks": ["2.10", "2.12", "2.13"] },
    { "id": 4, "tasks": ["2.14", "5.1", "7.1"] },
    { "id": 5, "tasks": ["5.2", "7.2"] }
  ]
}
```
