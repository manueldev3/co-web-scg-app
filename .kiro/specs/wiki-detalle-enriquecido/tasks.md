# Implementation Plan: Wiki — Detalle Enriquecido (Bloque de Descripción)

## Overview

Mejora incremental del Detalle_Elemento de la wiki en TypeScript (Next.js 16 App Router). Se añade un único Tipo_Bloque nuevo (`Bloque_Descripcion`) al modelo de detalle componible existente, una fuente de descripción enchufable por categoría (`Proveedor_Descripcion`) declarada en el Registro_Categorias, y la Descripcion_Curada de naves mantenida en código. No se rediseña la página ni se añaden llamadas a la API_UEX.

Se construye de adentro hacia afuera: primero el tipo de sección y el contrato del registro, luego la lógica pura (con tests de propiedades), después la fuente curada y la resolución en `naves.loadDetail`, y por último la presentación en `DetailView`. Cada paso se apoya en los anteriores y termina integrado, sin código huérfano.

Toda función pura cubierta por una propiedad del diseño tiene su test de propiedad con `fast-check` (mínimo 100 iteraciones, `{ numRuns: 100 }`), etiquetado `Feature: wiki-detalle-enriquecido, Property {N}: {texto}`. Antes de escribir o modificar rutas/componentes/datos de Next.js se consulta `node_modules/next/dist/docs/` según `AGENTS.md` (Req 7.1–7.3).

## Tasks

- [x] 1. Ampliar el modelo de secciones con el Bloque_Descripcion
  - [x] 1.1 Añadir la variante `description` a la unión `DetailSection` en `app/wiki/types.ts`
    - Añadir `{ kind: "description"; paragraphs: string[] }` a la unión discriminada `DetailSection`, conservando las variantes existentes (`fields`, `gallery`, `prices`, `links`) sin cambios
    - Documentar la invariante: `paragraphs` siempre no vacío y cada elemento es una cadena no vacía sin recortar a espacios; la ausencia de descripción se representa por ausencia de la sección
    - _Requirements: 1.1, 5.1_

- [x] 2. Extender el Registro_Categorias con el Proveedor_Descripcion
  - [x] 2.1 Añadir el tipo `DescriptionProvider` y el campo opcional `descriptionProvider` en `app/wiki/registry.ts`
    - Definir `export type DescriptionProvider = (slug: string) => string | null | undefined;` (síncrono, nunca lanza por contrato)
    - Añadir `descriptionProvider?: DescriptionProvider;` a la interfaz `WikiCategory` como campo aditivo y opcional; no modificar los selectores existentes (`getCategory`, `getActiveCategories`, `getLandingEntries`)
    - _Requirements: 2.1, 2.3, 5.3_

  - [ ]\* 2.2 Ampliar los tests unitarios de los selectores del registro
    - Verificar que una categoría puede declarar `descriptionProvider` sin afectar a las demás y que los selectores existentes siguen devolviendo lo mismo
    - _Requirements: 2.1, 5.3_
    - Archivo: extender `app/wiki/__tests__/registry.unit.test.ts`

- [x] 3. Implementar la lógica pura de la descripción (`utils.ts`)
  - [x] 3.1 Implementar `normalizeDescription` y `resolveDescription` en `app/wiki/utils.ts`
    - `normalizeDescription(raw: string | null | undefined): string[] | null`: divide por líneas en blanco (`\n\s*\n+`), recorta cada párrafo y descarta los vacíos; devuelve `null` ante `null`/`undefined`/cadena vacía/solo espacios o si no queda ningún párrafo; preserva el orden; nunca lanza
    - `resolveDescription(provider: DescriptionProvider | undefined, slug: string): string[] | null`: si `provider` es `undefined` devuelve `null`; en otro caso invoca `provider(slug)` dentro de `try/catch` (ante excepción → `null`) y aplica `normalizeDescription`; nunca lanza
    - _Requirements: 2.3, 2.4, 2.5, 4.3, 6.1_

  - [ ]\* 3.2 Escribir test de propiedad para la normalización del Texto_Descripcion
    - **Property 1: Normalización del Texto_Descripcion (ausencia y división en párrafos)**
    - **Validates: Requirements 1.4, 2.4, 6.1**
    - Archivo: `app/wiki/__tests__/normalize-description.property.test.ts`

  - [ ]\* 3.3 Escribir test de propiedad para la resolución resiliente de la descripción
    - **Property 2: Resolución resiliente de la descripción**
    - **Validates: Requirements 2.3, 2.5, 4.3**
    - Archivo: `app/wiki/__tests__/resolve-description.property.test.ts`

  - [ ]\* 3.4 Escribir test unitario de ejemplo para `normalizeDescription`
    - Texto concreto de varios párrafos (con ruido de espacios) → lista de párrafos esperada (acompaña a la Property 1)
    - _Requirements: 1.4_
    - Archivo: `app/wiki/__tests__/normalize-description.unit.test.ts`

  - [x] 3.5 Ampliar `buildShipDetail` para insertar el Bloque_Descripcion en su posición canónica
    - Añadir el parámetro opcional `descriptionParagraphs?: string[] | null`; cuando es una lista no vacía, insertar `{ kind: "description", paragraphs }` tras la `gallery` (si existe) y antes de la Ficha_Tecnica (`fields`); cuando es `null`/`undefined`/vacía, no añadir la sección
    - Conservar todas las demás secciones y su orden sin cambios; las invocaciones existentes de 4 argumentos siguen siendo válidas
    - _Requirements: 1.2, 1.3, 1.6, 4.2, 6.1, 6.3_

  - [ ]\* 3.6 Escribir test de propiedad para la composición del detalle con el Bloque_Descripcion
    - **Property 4: Composición del detalle con el Bloque_Descripcion**
    - **Validates: Requirements 1.2, 1.3, 1.6, 2.2, 4.2, 5.1, 6.1, 6.3**
    - Archivo: `app/wiki/__tests__/description-section.property.test.ts`

- [x] 4. Checkpoint - Lógica pura de la descripción validada
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implementar la Descripcion_Curada y conectarla a la categoría naves
  - [x] 5.1 Crear la Descripcion_Curada en `app/wiki/categories/naves-descriptions.ts`
    - Mapa estático `export const SHIP_DESCRIPTIONS: Record<string, string>` indexado por `slug` (el mismo que produce `toSlug(resolveShipName(v))`); párrafos separados por `\n\n`; sin dependencias de API ni fuentes externas
    - _Requirements: 3.1, 3.2, 3.5_

  - [x] 5.2 Declarar `descriptionProvider` y resolver la descripción en `app/wiki/categories/naves.ts`
    - Añadir `describeShip: DescriptionProvider = (slug) => SHIP_DESCRIPTIONS[slug];` y exponerlo como `descriptionProvider` de `navesCategory`
    - En `loadDetail`, tras localizar la nave, llamar a `resolveDescription(navesCategory.descriptionProvider, slug)` y pasar el resultado a `buildShipDetail`; conservar `loadItems` y la agregación `Promise.allSettled` de UEX sin cambios (sin nuevas llamadas)
    - _Requirements: 2.2, 3.3, 3.4, 4.1, 4.2, 4.4_

  - [ ]\* 5.3 Escribir test de propiedad para el Proveedor_Descripcion curado de naves por slug
    - **Property 3: Proveedor_Descripcion curado de naves indexado por slug**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
    - Archivo: `app/wiki/__tests__/ship-descriptions.property.test.ts`

  - [ ]\* 5.4 Escribir tests unitarios de `naves.loadDetail` para el Bloque_Descripcion
    - Incluye el Bloque_Descripcion cuando la Descripcion_Curada tiene entrada para el slug; lo omite cuando no la tiene; devuelve `null` para slug inexistente (heredado)
    - _Requirements: 4.1, 6.2_
    - Archivo: extender `app/wiki/__tests__/detail.unit.test.ts` (o crear `app/wiki/__tests__/naves-detail.unit.test.ts` si no existe)

- [x] 6. Implementar la presentación del Bloque_Descripcion en `DetailView`
  - [x] 6.1 Añadir el sub-renderer `DescriptionSection` y su caso `description` en `app/wiki/[category]/[slug]/DetailView.tsx`
    - Consultar `node_modules/next/dist/docs/` antes de tocar el componente
    - Añadir `case "description"` al `switch` exhaustivo del `SectionRenderer`; renderizar un `<p>` por párrafo usando nodos de texto de React (sin `dangerouslySetInnerHTML`), presentación independiente de la categoría; conservar encabezado, "Volver al listado" y la iteración de secciones en orden
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 5.2, 5.4, 6.4_

  - [ ]\* 6.2 Escribir tests de componente para `DescriptionSection` y `DetailView`
    - `DescriptionSection`: un `<p>` por párrafo en orden (Req 1.4); párrafo con marcado tipo HTML se muestra como texto literal, sin crear nodos (Req 1.5)
    - `DetailView`: despacha la sección `description` por `kind` respetando el orden del array y sin depender de la categoría (Req 1.3, 5.2, 5.4); conserva encabezado y "Volver al listado" (Req 1.6, 6.4)
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 5.2, 5.4, 6.4_
    - Archivo: extender `app/wiki/__tests__/DetailView.test.tsx`

- [ ] 7. Verificación de integración y conformidad
  - [ ]\* 7.1 Escribir test de integración que confirme que la descripción no añade llamadas a la API_UEX
    - Con `global.fetch` mockeado: el número de invocaciones de `fetch` en `naves.loadDetail` es el mismo que antes de la mejora (la ruta `descriptionProvider` + `resolveDescription` no llama a `fetch`)
    - _Requirements: 3.5, 4.4_
    - Archivo: `app/wiki/__tests__/description-no-fetch.integration.test.ts`

- [x] 8. Checkpoint final - Verificar build y tests
  - Ejecutar la suite de tests y `next build`; confirmar que no se usan APIs obsoletas (Req 7.3). Ensure all tests pass, ask the user if questions arise.

## Notes

- Las tareas marcadas con `*` son opcionales (tests) y pueden omitirse para un MVP más rápido; las de implementación nunca se marcan opcionales.
- Cada tarea referencia requisitos específicos para trazabilidad.
- Los tests de propiedades validan las propiedades de corrección universales del diseño (Properties 1–4); los tests unitarios, de componente e integración cubren criterios concretos (texto plano, despacho por `kind`, presentación independiente de categoría, navegación de regreso, ausencia de I/O y conformidad de framework).
- Las propiedades heredadas de `wiki` y `wiki-detalle-completo` siguen vigentes; la firma ampliada de `buildShipDetail` es retrocompatible (parámetro opcional).
- Los checkpoints aseguran validación incremental.
- Antes de escribir o modificar código de Next.js (rutas, layouts, componentes, fetch) se consulta `node_modules/next/dist/docs/` según `AGENTS.md`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "5.1"] },
    { "id": 1, "tasks": ["2.2", "3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.4", "3.5"] },
    { "id": 3, "tasks": ["3.6", "5.2", "6.1"] },
    { "id": 4, "tasks": ["5.3", "5.4", "6.2", "7.1"] }
  ]
}
```
