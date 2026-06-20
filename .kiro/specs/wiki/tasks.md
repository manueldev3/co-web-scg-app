# Implementation Plan: Wiki

## Overview

Implementación incremental de la wiki bajo `/wiki` en TypeScript (Next.js 16 App Router), siguiendo las convenciones del repositorio (`mercancia`/`mejor-ruta`). Se construye de adentro hacia afuera: primero los tipos y la lógica pura (con tests de propiedades), después el Cliente_UEX y el Registro_Categorias, luego las páginas genéricas (landing, listado, detalle), y finalmente el wiring con el Home y el Header. Cada paso se apoya en los anteriores y termina integrado, sin código huérfano.

Toda función pura cubierta por una propiedad del diseño tiene su test de propiedad con `fast-check` (mínimo 100 iteraciones), etiquetado `Feature: wiki, Property {N}: {texto}`. Antes de escribir rutas/componentes de Next.js se consulta `node_modules/next/dist/docs/` (Req 9.1–9.3).

## Tasks

- [x] 1. Establecer la base de tipos
  - [x] 1.1 Definir tipos del dominio y de la API en `app/wiki/types.ts`
    - `ApiVehicle`, `WikiListItem`, `WikiSearchResult`, `DetailField`, `WikiDetail`, `LandingEntry`
    - Reflejar exactamente la forma de la respuesta `/vehicles` (campos nullable)
    - _Requirements: 3.1, 4.3, 5.1, 5.2_

- [x] 2. Implementar la lógica pura de la wiki (`utils.ts`)
  - [x] 2.1 Implementar filtros y resolución de naves
    - En `app/wiki/utils.ts`: `isSpaceship`, `filterSpaceships`, `resolveShipName`, `toSlug`
    - _Requirements: 4.2, 4.3, 5.1_

  - [x] 2.2 Escribir test de propiedad para el filtro de naves
    - **Property 1: Filtro de naves**
    - **Validates: Requirements 4.2**
    - Archivo: `app/wiki/__tests__/filter-spaceships.property.test.ts`

  - [x] 2.3 Escribir test de propiedad para resolución de nombre y empresa
    - **Property 2: Resolución de nombre y empresa**
    - **Validates: Requirements 4.3, 5.1**
    - Archivo: `app/wiki/__tests__/ship-name.property.test.ts`

  - [x] 2.4 Implementar parseo, marcador de dato faltante y clasificaciones
    - En `app/wiki/utils.ts`: `parseContainerSizes`, `displayValue`, `activeClassifications`, constante `MISSING_DATA = "Dato no disponible"`
    - _Requirements: 5.3, 5.4, 5.5_

  - [x] 2.5 Escribir test de propiedad para round-trip de container_sizes
    - **Property 4: Round-trip de container_sizes**
    - **Validates: Requirements 5.4**
    - Archivo: `app/wiki/__tests__/container-sizes.property.test.ts`

  - [x] 2.6 Escribir test de propiedad para el marcador de dato faltante
    - **Property 5: Marcador de dato faltante**
    - **Validates: Requirements 5.5**
    - Archivo: `app/wiki/__tests__/display-value.property.test.ts`

  - [x] 2.7 Escribir test de propiedad para clasificaciones activas
    - **Property 7: Clasificaciones activas completas**
    - **Validates: Requirements 5.3**
    - Archivo: `app/wiki/__tests__/classifications.property.test.ts`

  - [x] 2.8 Implementar composición del detalle de nave
    - En `app/wiki/utils.ts`: `buildShipDetail` (usa los helpers anteriores y `detailFields` configurados)
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [x] 2.9 Escribir test de propiedad para la estructura del detalle
    - **Property 6: Estructura completa del detalle**
    - **Validates: Requirements 5.2**
    - Archivo: `app/wiki/__tests__/detail-structure.property.test.ts`

  - [x] 2.10 Implementar búsqueda, filtrado por nombre y enlace del Home
    - En `app/wiki/utils.ts`: `filterByName`, `searchWiki`, `buildWikiSearchHref`
    - _Requirements: 4.5, 6.1, 6.2, 6.3, 6.6, 7.4_

  - [x] 2.11 Escribir test de propiedad para el filtro por nombre del listado
    - **Property 3: Filtro por nombre del listado**
    - **Validates: Requirements 4.5**
    - Archivo: `app/wiki/__tests__/filter-by-name.property.test.ts`

  - [x] 2.12 Escribir test de propiedad para la búsqueda integral
    - **Property 8: Búsqueda integral en categorías activas**
    - **Validates: Requirements 6.1, 6.2, 6.3, 3.3**
    - Archivo: `app/wiki/__tests__/search.property.test.ts`

  - [x] 2.13 Escribir test de propiedad para texto vacío sin resultados
    - **Property 9: Texto vacío sin resultados**
    - **Validates: Requirements 6.6**
    - Archivo: `app/wiki/__tests__/search-empty.property.test.ts`

  - [x] 2.14 Escribir test de propiedad para el href de búsqueda del Home
    - **Property 11: Round-trip del enlace de búsqueda del Home**
    - **Validates: Requirements 7.4**
    - Archivo: `app/wiki/__tests__/search-href.property.test.ts`

- [x] 3. Checkpoint - Lógica pura validada
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implementar el Cliente_UEX
  - [x] 4.1 Implementar `fetchVehicles` en `app/wiki/uex-api.ts`
    - Consultar `node_modules/next/dist/docs/` para el patrón de fetch/caché vigente
    - `Accept: application/json`, sin `Authorization`, `next: { revalidate: 3600 }`, lee `json.data ?? []`
    - `try/catch`: ante excepción o `!result.ok`, `console.error` y devuelve `[]`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6, 9.1, 9.2, 9.3_

  - [x] 4.2 Escribir test de propiedad para la resiliencia del Cliente_UEX
    - **Property 12: Resiliencia y extracción del Cliente_UEX**
    - **Validates: Requirements 8.3, 8.4**
    - Archivo: `app/wiki/__tests__/uex-client.property.test.ts` (mock `global.fetch`)

  - [x] 4.3 Escribir tests de integración del Cliente_UEX
    - Cabecera `Accept` presente y `Authorization` ausente; `revalidate` en `[3300, 3900]`; una sola llamada a `/vehicles`
    - _Requirements: 8.1, 8.2, 8.6_
    - Archivo: `app/wiki/__tests__/uex-api.integration.test.ts`

- [x] 5. Implementar el Registro_Categorias y la categoría naves
  - [x] 5.1 Crear `app/wiki/registry.ts` con la interfaz `WikiCategory` y los selectores puros
    - `WIKI_CATEGORIES`, `getCategory`, `getActiveCategories`, `getLandingEntries`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 2.1, 2.5_

  - [x] 5.2 Implementar la categoría naves en `app/wiki/categories/naves.ts`
    - `loadItems`/`loadDetail` usando `fetchVehicles()` + helpers de `utils.ts`; única categoría `active`
    - _Requirements: 3.5, 4.1, 4.2, 4.3, 5.1, 5.6_

  - [x] 5.3 Escribir test de propiedad para las entradas de la landing
    - **Property 10: Entradas de la landing derivadas del registro**
    - **Validates: Requirements 2.1, 2.5, 3.2**
    - Archivo: `app/wiki/__tests__/landing-entries.property.test.ts`

  - [x] 5.4 Escribir tests unitarios de los selectores del registro
    - `getActiveCategories(WIKI_CATEGORIES)` devuelve solo "naves"
    - _Requirements: 3.5_
    - Archivo: `app/wiki/__tests__/registry.unit.test.ts`

- [x] 6. Checkpoint - Acceso a datos y registro validados
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implementar la Wiki_Landing y el Buscador_Wiki
  - [x] 7.1 Crear `app/wiki/page.tsx` (Server) y `app/wiki/loading.tsx`
    - Consultar `node_modules/next/dist/docs/` (params/searchParams como `Promise`)
    - Derivar tarjetas de `getLandingEntries`; activas como `<Link>`, `coming_soon` deshabilitadas con tooltip; tema oscuro
    - Leer `searchParams` (`?q=`) para precargar el buscador
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 9.1, 9.2, 9.3_

  - [x] 7.2 Crear `app/wiki/WikiSearch.tsx` (Client)
    - Aplica `searchWiki`; resultados con nombre + categoría que enlazan a `/wiki/{categoryId}/{slug}`; vacío sin resultados; "sin resultados"
    - _Requirements: 2.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 7.3 Escribir tests de componente para la landing y el buscador
    - Una tarjeta por categoría, activas enlazables, inactivas deshabilitadas con tooltip, presencia del buscador, mensaje "sin resultados"
    - _Requirements: 2.2, 2.3, 2.4, 2.6, 6.5_
    - Archivo: `app/wiki/__tests__/WikiLanding.test.tsx`

- [x] 8. Implementar el Listado_Categoria
  - [x] 8.1 Crear `app/wiki/[category]/page.tsx` (Server) y `app/wiki/[category]/loading.tsx`
    - Resolver `params: Promise<{ category }>`; categoría inexistente/inactiva → "no encontrado"; activa → `loadItems()`
    - Lista vacía → mensaje de estado vacío
    - _Requirements: 4.1, 4.2, 4.6, 9.2, 9.3_

  - [x] 8.2 Crear `app/wiki/[category]/CategoryList.tsx` (Client)
    - Campo de filtro por nombre (`filterByName`); muestra nombre + empresa; enlaza al detalle
    - _Requirements: 4.3, 4.4, 4.5_

  - [x] 8.3 Escribir tests de componente del listado
    - Navegación al detalle, filtro por nombre, estado vacío
    - _Requirements: 4.4, 4.5, 4.6_
    - Archivo: `app/wiki/__tests__/CategoryList.test.tsx`

- [x] 9. Implementar el Detalle_Elemento
  - [x] 9.1 Crear `app/wiki/[category]/[slug]/page.tsx` (Server) y `loading.tsx`
    - Resolver `params: Promise<{ category, slug }>`; categoría inválida o `loadDetail` `null` → "no encontrado"
    - _Requirements: 5.1, 5.6, 9.2, 9.3_

  - [x] 9.2 Crear `app/wiki/[category]/[slug]/DetailView.tsx`
    - Título + subtítulo, todas las clasificaciones activas, `container_sizes` como lista numérica, marcador de dato faltante, `<Link>` de regreso al listado
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_

  - [x] 9.3 Escribir tests de componente del detalle
    - Estado "no encontrado", control de regreso al listado, presentación de campos/clasificaciones
    - _Requirements: 5.6, 5.7_
    - Archivo: `app/wiki/__tests__/DetailView.test.tsx`

- [x] 10. Checkpoint - Rutas de la wiki funcionando
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Integrar la wiki en la navegación y el Home
  - [x] 11.1 Añadir la entrada "Wiki" en `app/components/SiteHeader.tsx`
    - Ítem `key: "3"`, label "Wiki", `onClick: () => go("/wiki")`, conservando "Inicio" y "Herramientas para cargadores" y su orden
    - Extender `selectedKeys`: `pathname` que empieza por `/wiki` selecciona Wiki (alimenta menú horizontal y Drawer)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 11.2 Escribir tests de componente del Header
    - Presencia de "Wiki" → `/wiki`, conservación de entradas existentes y orden, selección por pathname
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
    - Archivo: extender `app/components/__tests__/SiteHeader.test.tsx`

  - [x] 11.3 Crear `app/components/HomeWikiSection.tsx`
    - Título + descripción; campo de búsqueda que navega a `/wiki?q=` con `buildWikiSearchHref`; enlace de acceso a `/wiki`; tokens visuales del Home
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 11.4 Insertar `HomeWikiSection` en `app/page.tsx`
    - Añadir la sección dentro del bloque `bg-[#040d16]` sin eliminar hero/herramientas/footer
    - _Requirements: 7.1_

  - [x] 11.5 Escribir tests de componente del Home_Wiki_Section
    - Coexistencia con hero/herramientas/footer, título/descripción, input que navega con el texto, enlace a la landing
    - _Requirements: 7.1, 7.2, 7.3, 7.5_
    - Archivo: `app/components/__tests__/HomeWikiSection.test.tsx`

- [x] 12. Checkpoint final - Verificar build y tests
  - Ejecutar la suite de tests y `next build`; confirmar que no se usan APIs obsoletas (Req 9.3). Ensure all tests pass, ask the user if questions arise.

## Notes

- Las tareas marcadas con `*` son opcionales (tests) y pueden omitirse para un MVP más rápido; las de implementación nunca se marcan opcionales.
- Cada tarea referencia requisitos específicos para trazabilidad.
- Los tests de propiedades validan las propiedades de corrección universales del diseño; los tests unitarios, de componente e integración cubren criterios concretos.
- Los checkpoints aseguran validación incremental.
- Antes de escribir código de Next.js (rutas, layouts, componentes, fetch) se consulta `node_modules/next/dist/docs/` según `AGENTS.md`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.4", "2.10", "4.1"] },
    {
      "id": 2,
      "tasks": [
        "2.8",
        "2.2",
        "2.3",
        "2.5",
        "2.6",
        "2.7",
        "2.11",
        "2.12",
        "2.13",
        "2.14",
        "4.2",
        "4.3"
      ]
    },
    { "id": 3, "tasks": ["2.9", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4"] },
    {
      "id": 5,
      "tasks": ["7.1", "7.2", "8.1", "8.2", "9.1", "9.2", "11.1", "11.3"]
    },
    { "id": 6, "tasks": ["7.3", "8.3", "9.3", "11.2", "11.4"] },
    { "id": 7, "tasks": ["11.5"] }
  ]
}
```
