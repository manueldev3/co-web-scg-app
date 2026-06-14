# Implementation Plan: Mejor Ruta

## Overview

This plan implements the "Mejor Ruta" trade-route finder and the global footer as a series of incremental, code-focused steps. It builds from the bottom up: shared types first, then the server-side `UEX_Client`, then the pure `Route_Engine` (validation, candidate building, ranking, filtering) which is the primary target for property-based tests, then the client UI (`RouteResults`, `FiltersSidebar`, `RouteFinder`), the server page wiring, and finally the site chrome (Data menu entry and `SiteFooter`). Each step builds on the previous one and ends with everything wired together.

Implementation language: **TypeScript** (Next.js App Router, Ant Design, Tailwind), matching the existing `app/mercancia` feature. Property-based tests use **Vitest** + **fast-check** placed under `app/mejor-ruta/__tests__/`, following the `app/mercancia/__tests__/` conventions.

> Per `AGENTS.md`, this project runs a modified version of Next.js. Before writing or modifying any route, layout, component, or data fetch, consult the relevant guide in `node_modules/next/dist/docs/`.

## Tasks

- [x] 1. Define shared types for the feature
  - [x] 1.1 Create `app/mejor-ruta/types.ts`
    - Define `ApiVehicle`, `TerminalMeta`, `MarketData`, `ProfitMode`, `SelectionMode`, `MultiselectFilter`, `RouteFilters`, `TradeRoute`, and `ValidationResult` exactly as specified in the design Data Models section
    - Re-export / reuse `ApiCommodity` and `ApiPriceRecord` from `app/mercancia/types.ts` (do not redefine them)
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1_

- [x] 2. Implement UEX_Client data access
  - [x] 2.1 Implement `app/mejor-ruta/uex-api.ts`
    - Implement `fetchCommodities`, `fetchAllCommodityPrices`, `fetchTerminals`, `fetchVehicles` against `https://api.uexcorp.uk/2.0` using `fetch` with `next: { revalidate }` and `Accept: application/json`, no Authorization header, following `app/mercancia/uex-api.ts`
    - On any thrown error or non-2xx status, return `[]` for that call (never throw)
    - Implement `fetchMarketData` aggregating the four fetches with `Promise.allSettled`, mapping any rejected/failed dataset to `[]`, and normalizing terminals into `TerminalMeta` (security level + hidden flag)
    - Consult `node_modules/next/dist/docs/` (data fetching + caching) before implementing
    - _Requirements: 8.1, 8.2, 8.3, 10.1_
  - [x] 2.2 Write unit tests for UEX_Client error handling
    - Mock `fetch` to return non-2xx and to throw; assert each function returns `[]`
    - Mock one endpoint failing in `fetchMarketData`; assert partial data with `[]` for the failed dataset
    - _Requirements: 8.2_
  - [x] 2.3 Write integration/smoke tests for UEX_Client wiring
    - Mock `fetch`; assert requests target the correct `https://api.uexcorp.uk/2.0` endpoints and carry no Authorization header
    - _Requirements: 8.1, 8.3_

- [x] 3. Implement Route_Engine — input validation and defaults
  - [x] 3.1 Create `app/mejor-ruta/route-engine.ts` with `validateInputs` and `defaultFilters`
    - Implement `validateInputs(shipId, investment)` returning `valid` only when a ship is selected and investment is a number > 0, with field-level errors otherwise
    - Implement `defaultFilters()` returning the canonical default `RouteFilters` state
    - Add a `computeRoutes` stub/signature to be filled in later tasks
    - Pure module: no imports from `react`/`next`
    - _Requirements: 2.4, 2.5, 2.6_
  - [x] 3.2 Write property test for input validation
    - **Property 1: Input validation rejects missing ship and non-positive investment**
    - **Validates: Requirements 2.5, 2.6**
    - fast-check, `{ numRuns: 100 }`, tagged `// Feature: mejor-ruta, Property 1: ...`
  - [x] 3.3 Write property test for reset/default state
    - **Property 2: Reset restores the canonical default state**
    - **Validates: Requirements 2.4**
    - fast-check, `{ numRuns: 100 }`, tagged `// Feature: mejor-ruta, Property 2: ...`
  - [x] 3.4 Write unit tests for `validateInputs`
    - Concrete cases: valid input, null ship, empty/zero/negative investment
    - _Requirements: 2.5, 2.6_

- [x] 4. Implement Route_Engine — candidate route building
  - [x] 4.1 Implement `buildCandidateRoutes` in `app/mejor-ruta/route-engine.ts`
    - Pair buy terminals (`price_buy > 0`) with sell terminals (`price_sell > price_buy`) for the same commodity at different terminals
    - Size quantity as `floor(min(shipCargoScu, investment / price_buy, scu_buy, scu_sell))`; compute `buyValue`, `sellValue`, `profit`
    - Discard routes with `qty <= 0` or `profit <= 0`
    - Populate `TradeRoute` fields used by filters/ranking (commodity, terminals, faction, stops, requiresWaitTimer, boxSizesScu, securityLevel, includesHiddenLocation)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7_
  - [x] 4.2 Write property test for commodity/terminal structure
    - **Property 3: Every route buys and sells the same commodity at two different terminals**
    - **Validates: Requirements 3.1**
    - fast-check, `{ numRuns: 100 }`, tagged `// Feature: mejor-ruta, Property 3: ...`
  - [x] 4.3 Write property test for profit formula
    - **Property 4: Profit equals sell value minus buy value**
    - **Validates: Requirements 3.2**
    - fast-check, `{ numRuns: 100 }`, tagged `// Feature: mejor-ruta, Property 4: ...`
  - [x] 4.4 Write property test for quantity sizing invariant
    - **Property 5: Quantity sizing invariant**
    - **Validates: Requirements 3.3, 3.4, 3.7**
    - fast-check, `{ numRuns: 100 }`, tagged `// Feature: mejor-ruta, Property 5: ...`
  - [x] 4.5 Write unit tests for `buildCandidateRoutes`
    - Worked example with known prices asserting exact qty/profit; degenerate cases (no profitable pair, zero supply/demand)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7_

- [x] 5. Implement Route_Engine — ranking
  - [x] 5.1 Implement `rankRoutes` in `app/mejor-ruta/route-engine.ts`
    - `"pure_profit"` mode: sort descending by total `profit`
    - `"over_time"` mode: sort descending by profit per unit of travel/wait time
    - _Requirements: 3.5, 3.6_
  - [x] 5.2 Write property test for pure-profit ranking
    - **Property 6: Pure-profit ranking is non-increasing**
    - **Validates: Requirements 3.5**
    - fast-check, `{ numRuns: 100 }`, tagged `// Feature: mejor-ruta, Property 6: ...`
  - [x] 5.3 Write property test for profit-over-time ranking
    - **Property 7: Profit-over-time ranking is non-increasing**
    - **Validates: Requirements 3.6**
    - fast-check, `{ numRuns: 100 }`, tagged `// Feature: mejor-ruta, Property 7: ...`
  - [x] 5.4 Write unit tests for `rankRoutes`
    - Small fixed lists for both profit modes
    - _Requirements: 3.5, 3.6_

- [x] 6. Implement Route_Engine — filters and orchestration
  - [x] 6.1 Implement `applyFilters` in `app/mejor-ruta/route-engine.ts`
    - Max-stops exclusion; "Allow wait timers" exclusion when disabled; three include/exclude multiselects (avoid/only, empty = no filtering) for commodity type, commodity, faction; minimum security level; supported box size; "Avoid hidden locations" exclusion when enabled
    - _Requirements: 4.3, 4.6, 5.3, 5.4, 5.5, 6.2, 6.4, 6.6_
  - [x] 6.8 Wire `computeRoutes` to compose build → filter → rank
    - `computeRoutes(input)` calls `buildCandidateRoutes`, then `applyFilters`, then `rankRoutes(mode)`; total function that never throws on degenerate input
    - _Requirements: 3.1, 3.5, 3.6_
  - [x] 6.2 Write property test for max-stops filter
    - **Property 8: Max-stops filter excludes routes that exceed the limit**
    - **Validates: Requirements 4.3**
    - fast-check, `{ numRuns: 100 }`, tagged `// Feature: mejor-ruta, Property 8: ...`
  - [x] 6.3 Write property test for wait-timer filter
    - **Property 9: Wait-timer filter excludes wait-timer routes when disabled**
    - **Validates: Requirements 4.6**
    - fast-check, `{ numRuns: 100 }`, tagged `// Feature: mejor-ruta, Property 9: ...`
  - [x] 6.4 Write property test for include/exclude multiselects
    - **Property 10: Include/exclude multiselect filtering**
    - **Validates: Requirements 5.3, 5.4, 5.5**
    - fast-check, `{ numRuns: 100 }`, tagged `// Feature: mejor-ruta, Property 10: ...`
  - [x] 6.5 Write property test for minimum-security filter
    - **Property 11: Minimum-security filter excludes under-secured routes**
    - **Validates: Requirements 6.2**
    - fast-check, `{ numRuns: 100 }`, tagged `// Feature: mejor-ruta, Property 11: ...`
  - [x] 6.6 Write property test for box-size filter
    - **Property 12: Box-size filter keeps only tradable routes**
    - **Validates: Requirements 6.4**
    - fast-check, `{ numRuns: 100 }`, tagged `// Feature: mejor-ruta, Property 12: ...`
  - [x] 6.7 Write property test for hidden-location filter
    - **Property 13: Hidden-location filter excludes hidden routes when enabled**
    - **Validates: Requirements 6.6**
    - fast-check, `{ numRuns: 100 }`, tagged `// Feature: mejor-ruta, Property 13: ...`

- [x] 7. Checkpoint — engine and data layer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Route_Finder client UI
  - [x] 8.1 Implement `app/mejor-ruta/RouteResults.tsx` (`"use client"`)
    - Render ranked routes showing buy terminal, sell terminal, commodity, quantity (SCU), capital required (UEC), profit (UEC); extended columns when Expanded view is on
    - Show no-results message for an empty list and a loading indicator while computing
    - Reuse `formatPrice` / `formatStock` from `app/mercancia/utils.ts`
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 8.2 Implement `app/mejor-ruta/FiltersSidebar.tsx` (`"use client"`)
    - Render profit-mode radio, max-stops input, three include/exclude multiselects with Avoid/Only toggles, min-security control, box-size control, and the wait-timers / auto-loading / smart-filters / expanded-view / avoid-hidden toggles, populated from `market` and bound to parent state
    - _Requirements: 4.1, 4.2, 4.4, 5.1, 5.2, 6.1, 6.3, 6.5_
  - [x] 8.3 Implement `app/mejor-ruta/RouteFinder.tsx` (`"use client"`)
    - Own ship selection, investment, and all filter state (default from `defaultFilters()`); render ship `Select`, investment `InputNumber`, Submit/Reset, `FiltersSidebar`, `RouteResults`
    - Track `status: idle | computing | done | error`; on Submit run `validateInputs` (show field-level messages, no computation on failure), then call `computeRoutes`; Reset restores defaults and clears ship/investment
    - Detect empty critical datasets and show the market-data error message
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.5, 7.2, 7.3, 8.2_
  - [x] 8.4 Write component/rendering tests for the UI
    - RouteFinder: controls render and populate from market data; validation blocks Submit; Reset restores defaults; expanded view reveals extended details
    - RouteResults: a route renders all six required fields; empty list shows no-results; computing shows loading indicator
    - _Requirements: 2.1, 2.2, 2.3, 4.5, 7.1, 7.2, 7.3_

- [x] 9. Wire the server route
  - [x] 9.1 Implement `app/mejor-ruta/page.tsx` and `app/mejor-ruta/loading.tsx`
    - `page.tsx` (Server Component): `await fetchMarketData()` then render `<RouteFinder market={market} />`
    - `loading.tsx`: instant skeleton for the route segment
    - Consult `node_modules/next/dist/docs/` (server/client components, `loading.js`, fetching) before implementing
    - _Requirements: 8.1, 8.2, 7.3, 10.1_

- [x] 10. Implement site chrome
  - [x] 10.1 Add the "Mejor Ruta" entry to the Data menu in `app/components/SiteHeader.tsx`
    - Add child `key: "2-2"` under Data (`key: "2"`) beside Mercancía (`key: "2-1"`), navigating via `router.push("/mejor-ruta")`; extend `defaultSelectedKeys` so `activePath("mejor-ruta")` opens `["2", "2-2"]`; never place the item under Herramientas
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.1_
  - [x] 10.2 Implement `app/components/SiteFooter.tsx` and render it in `app/layout.tsx`
    - Static Server Component with the unofficial / not-affiliated-with-CIG disclaimer plus links and contact sections; render inside `<SCGLayout>` after `{children}` so it appears on every page
    - Consult `node_modules/next/dist/docs/` (layouts, server components) before implementing
    - _Requirements: 9.1, 9.2, 9.3, 10.1_
  - [x] 10.3 Write component tests for navigation and footer
    - SiteHeader shows "Mejor Ruta" under Data, navigates to `/mejor-ruta`, reflects selected state on that path, and never places the item under Herramientas
    - SiteFooter renders the disclaimer plus links and contact sections via the root layout
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 9.1, 9.2, 9.3_

- [x] 11. Final checkpoint — full feature
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for a faster MVP; core implementation tasks are never optional.
- Each task references specific requirement sub-clauses for traceability.
- Property tests validate the universal correctness properties of the pure `Route_Engine`; unit, integration, and component tests cover examples, edge cases, UEX wiring, and UI behavior.
- The `Route_Engine` (`route-engine.ts`) is built incrementally across tasks 3–6; those tasks edit the same file and therefore run in sequence.
- Property-based tests use fast-check with `{ numRuns: 100 }` and are tagged with their design property number, following `app/mercancia/__tests__/` conventions.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "10.1", "10.2"] },
    { "id": 1, "tasks": ["2.1", "3.1", "8.1", "8.2", "10.3"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "3.3", "3.4", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "4.5", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4", "6.1"] },
    { "id": 5, "tasks": ["6.8"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "8.3"] },
    { "id": 7, "tasks": ["8.4", "9.1"] }
  ]
}
```
