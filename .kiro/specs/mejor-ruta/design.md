# Design Document

## Overview

"Mejor Ruta" (Best Route) adds a trade-route finder to the SCG web app under the existing **Data** menu, at the `/mejor-ruta` route. It consumes UEX Corp commodity, price, terminal, and vehicle data and returns the most profitable buy-low / sell-high trade routes for a selected ship given an initial UEC investment. The UI mirrors SC Trade Tools "Trade Routes": a ship selector, an initial-investment input, a sidebar of filters (profit mode, max stops, commodity/type/faction include-exclude, security level, box size, and location toggles), and a main area that displays ranked route results.

The feature also introduces a **global footer** rendered on every page through the root layout, containing an unofficial-tool disclaimer (not affiliated with Cloud Imperium Games), a links section, and a contact section.

The design separates four concerns so each can be built and tested independently:

- **UEX_Client** — server-side data access that retrieves commodities, commodity prices, terminals, and vehicles (ships) from the UEX Corp API (`https://api.uexcorp.uk/2.0`, no auth).
- **Route_Engine** — a pure, framework-free computation module that derives ranked `Trade_Route[]` from price/terminal/ship data and the active filters. This is the heart of the feature and the primary target for property-based testing.
- **Route_Finder** — the `/mejor-ruta` page and its client UI that collect inputs/filters and render results.
- **Site chrome** — the **Data** menu entry in `SiteHeader` and the new `SiteFooter` in the root layout.

### Framework compliance (Requirement 10)

This project runs a **modified version of Next.js (App Router)**. Per `AGENTS.md`, the guides in `node_modules/next/dist/docs/` were consulted before this design. Findings that shape the design:

- **Layouts and pages are Server Components by default**; interactivity requires a `"use client"` boundary. (`05-server-and-client-components.md`)
- **Server Components fetch data with `async`/`await` + `fetch`**, and `fetch` results are cached via `next: { revalidate }` — exactly the pattern already used in `app/mercancia/uex-api.ts`. (`06-fetching-data.md`)
- **`loading.js` streams an instant loading state** for a route segment while the page renders. (`06-fetching-data.md`)
- **Parallel data fetching** uses `Promise.all` (or `Promise.allSettled` to tolerate partial failures). (`06-fetching-data.md`)
- The existing app already follows the **server layout fetches data → passes props to a `"use client"` component** pattern (`app/mercancia/layout.tsx` → `Mercancia.tsx`); this feature reuses it.

## Architecture

```mermaid
flowchart TD
    subgraph Server[Server Components]
        Layout[app/layout.tsx root layout]
        Page[app/mejor-ruta/page.tsx]
        UEX[UEX_Client\napp/mejor-ruta/uex-api.ts]
    end
    subgraph Client[Client Components - use client]
        Finder[RouteFinder.tsx]
        Sidebar[FiltersSidebar.tsx]
        Results[RouteResults.tsx]
    end
    subgraph Pure[Pure module - no framework]
        Engine[Route_Engine\napp/mejor-ruta/route-engine.ts]
    end

    Header[SiteHeader.tsx\nData menu] -->|navigates to /mejor-ruta| Page
    Page -->|fetch commodities, prices,\nterminals, vehicles| UEX
    UEX -->|UEX Corp API\nhttps://api.uexcorp.uk/2.0| API[(UEX Corp)]
    Page -->|passes market data as props| Finder
    Finder --> Sidebar
    Finder -->|inputs + filters| Engine
    Engine -->|ranked Trade_Route[]| Results
    Layout --> Footer[SiteFooter.tsx]
```

### Request / compute flow

1. The user opens `/mejor-ruta`. `page.tsx` (Server Component) fetches commodities, commodity prices, terminals, and vehicles through **UEX_Client** in parallel (`Promise.allSettled`) and passes the normalized market data to the **RouteFinder** client component. `loading.tsx` provides the instant loading state while the server fetch resolves.
2. **RouteFinder** holds the ship selection, initial investment, and all filter state. It renders the **FiltersSidebar** and the input controls.
3. On **Submit**, RouteFinder validates inputs (ship selected; investment is a positive number). On success it calls the pure **Route_Engine** with the market data, ship cargo capacity, investment, and the active filter set; the engine returns a ranked `Trade_Route[]`.
4. **RouteResults** renders the ranked routes (or a no-results message), with a loading indicator shown while the computation is in progress.

### Why the engine is a separate pure module

Route computation is deterministic input→output logic over a large, structured input space (price records × terminals × filters). Isolating it from React/Next.js makes it directly unit- and property-testable with `vitest` + `fast-check`, exactly like the existing `app/mercancia/utils.ts` logic.

## Components and Interfaces

### 1. UEX_Client — `app/mejor-ruta/uex-api.ts`

Server-side data access, following the existing `app/mercancia/uex-api.ts` / `app/terminales/uex-api.ts` conventions: `fetch` with `next: { revalidate }`, `Accept: application/json`, no auth token, and **on any failure or non-success status return an empty array** (never throw).

```ts
const UEX_API_BASE = "https://api.uexcorp.uk/2.0";

export async function fetchCommodities(): Promise<ApiCommodity[]>; // GET /commodities
export async function fetchAllCommodityPrices(): Promise<ApiPriceRecord[]>; // GET /commodities_prices
export async function fetchTerminals(): Promise<ApiTerminal[]>; // GET /terminals
export async function fetchVehicles(): Promise<ApiVehicle[]>; // GET /vehicles

// Aggregates the four fetches with Promise.allSettled so a single failed
// endpoint yields [] for that dataset without failing the others.
export async function fetchMarketData(): Promise<MarketData>;
```

- `fetchAllCommodityPrices` retrieves the full price set used by the engine. The existing `app/mercancia` client fetches prices per commodity name; the route finder needs the bulk set, so this is a new call against `/commodities_prices`. If the bulk endpoint is unavailable or capped, the design falls back to fetching prices for the commodity set in parallel and concatenating — this is an implementation detail isolated inside UEX_Client and does not affect the engine contract.
- `fetchMarketData` returns `{ commodities, prices, terminals, vehicles }`; any field that failed to load is `[]`, which RouteFinder detects to show the "market data could not be loaded" error (Requirement 8.2).

### 2. Route_Engine — `app/mejor-ruta/route-engine.ts`

A pure module (no imports from `react`/`next`). Single entry point plus exported helpers so individual rules are testable:

```ts
export interface EngineInput {
  prices: ApiPriceRecord[];
  terminals: TerminalMeta[]; // security level + hidden flag keyed by terminal id
  shipCargoScu: number; // selected ship cargo capacity in SCU
  investment: number; // Initial_Investment in UEC (validated > 0)
  filters: RouteFilters;
}

// Main entry: produces the ranked list of routes.
export function computeRoutes(input: EngineInput): TradeRoute[];

// Exported building blocks (each independently testable):
export function buildCandidateRoutes(
  prices: ApiPriceRecord[],
  shipCargoScu: number,
  investment: number,
): TradeRoute[]; // pairs buy/sell terminals per commodity, sizes the load
export function applyFilters(
  routes: TradeRoute[],
  filters: RouteFilters,
  terminals: TerminalMeta[],
): TradeRoute[];
export function rankRoutes(
  routes: TradeRoute[],
  mode: ProfitMode,
): TradeRoute[];

// Pure helpers reused by the UI and validation:
export function validateInputs(
  shipId: number | null,
  investment: number | null,
): ValidationResult;
export function defaultFilters(): RouteFilters; // canonical default filter state (used by Reset)
```

**Quantity sizing rule** (the core of `buildCandidateRoutes`): for a commodity bought at terminal `B` (`price_buy > 0`) and sold at a different terminal `S` (`price_sell > price_buy`), the purchased quantity is

```
qty = floor( min( shipCargoScu,
                  investment / B.price_buy,
                  B.scu_buy,          // available supply at buy terminal
                  S.scu_sell ) )      // available demand at sell terminal
buyValue  = qty * B.price_buy
sellValue = qty * S.price_sell
profit    = sellValue - buyValue
```

Routes with `qty <= 0` or `profit <= 0` are discarded before filtering.

### 3. Route_Finder UI — `app/mejor-ruta/`

Following the `app/mercancia` layout→client pattern.

- **`page.tsx`** (Server Component): `const market = await fetchMarketData();` then renders `<RouteFinder market={market} />`. Reading data here keeps the UEX calls server-side (no secrets, smaller client bundle) per the server/client guide.
- **`loading.tsx`** (Server Component): instant skeleton for the route segment while the server fetch resolves (Requirement 7.3 initial load).
- **`RouteFinder.tsx`** (`"use client"`): owns all input/filter state via `useState` (default state from `defaultFilters()`), renders the ship selector (Ant Design `Select`), the `InputNumber` for investment, Submit/Reset buttons, the `FiltersSidebar`, and `RouteResults`. Holds a `status` of `idle | computing | done | error`. On Submit it runs `validateInputs`; on success it sets `computing`, calls `computeRoutes`, then `done`. Reset calls `defaultFilters()` and clears ship/investment.
- **`FiltersSidebar.tsx`** (`"use client"`): renders all filter controls (profit mode radio, max-stops `InputNumber`, the three include/exclude multiselects with Avoid/Only toggles, min-security control, box-size control, and the wait-timers / auto-loading / smart-filters / expanded-view / avoid-hidden toggles), populated from `market` and bound to RouteFinder state.
- **`RouteResults.tsx`** (`"use client"`): renders the ranked routes (Ant Design `Table`/cards) showing buy terminal, sell terminal, commodity, quantity (SCU), capital required (UEC), and profit (UEC); shows extended columns when Expanded view is on; shows the no-results message for an empty list and a loading indicator while `computing`. Reuses `formatPrice` / `formatStock` from `app/mercancia/utils.ts`.

### 4. Data menu entry — `app/components/SiteHeader.tsx`

Add a `"Mejor Ruta"` child (`key: "2-2"`) to the existing **Data** menu (`key: "2"`), beside **Mercancía** (`key: "2-1"`), navigating with `router.push("/mejor-ruta")`. Extend `defaultSelectedKeys` so that when `activePath("mejor-ruta")` is true the menu opens to `["2", "2-2"]`. The item stays under **Data** and is never added to **Herramientas** (Requirement 1.4).

### 5. Global footer — `app/components/SiteFooter.tsx` + `app/layout.tsx`

A new `SiteFooter` Server Component rendered inside the root layout's `<SCGLayout>` after `{children}`, so it appears on every page (Requirement 9.1). It contains:

- a **disclaimer**: unofficial Star Citizen tool, not affiliated with Cloud Imperium Games;
- a **links** section; and
- a **contact** section.

It is a static Server Component (no client interactivity needed), keeping it out of the client bundle per the server/client guide.

## Data Models

Reuses existing `ApiCommodity` and `ApiPriceRecord` from `app/mercancia/types.ts`. New types live in `app/mejor-ruta/types.ts`.

```ts
/** GET /vehicles — ship with cargo capacity in SCU. */
export interface ApiVehicle {
  id: number;
  name: string;
  scu: number | null; // cargo capacity in SCU
  is_spaceship: number;
}

/** Terminal metadata used for security/hidden filtering (extends app/terminales ApiTerminal). */
export interface TerminalMeta {
  id: number;
  name: string;
  securityLevel: number; // numeric security level (higher = safer)
  isHidden: boolean; // Hidden_Location flag from UEX
}

/** Normalized data passed from the server page to RouteFinder. */
export interface MarketData {
  commodities: ApiCommodity[];
  prices: ApiPriceRecord[];
  terminals: TerminalMeta[];
  vehicles: ApiVehicle[];
}

export type ProfitMode = "pure_profit" | "over_time";
export type SelectionMode = "avoid" | "only";

export interface MultiselectFilter {
  mode: SelectionMode;
  values: number[]; // selected ids; empty => no filtering (Req 5.5)
}

export interface RouteFilters {
  profitMode: ProfitMode;
  maxStops: number | null;
  commodityTypes: MultiselectFilter;
  commodities: MultiselectFilter;
  factions: MultiselectFilter;
  minSecurityLevel: number | null;
  boxSizeScu: number | null;
  allowWaitTimers: boolean;
  autoLoading: boolean;
  smartFilters: boolean;
  expandedView: boolean;
  avoidHiddenLocations: boolean;
}

/** A computed trade route (Trade_Route in the glossary). */
export interface TradeRoute {
  commodityId: number;
  commodityName: string;
  commodityTypeId: number | null;
  buyTerminalId: number;
  buyTerminalName: string;
  sellTerminalId: number;
  sellTerminalName: string;
  factionId: number | null;
  quantityScu: number; // purchased quantity in SCU
  buyValue: number; // capital required, UEC
  sellValue: number; // gross sale value, UEC
  profit: number; // sellValue - buyValue, UEC
  stops: number; // number of stops on the route
  requiresWaitTimer: boolean; // terminal requires a wait timer
  boxSizesScu: number[]; // box sizes the commodity is tradable in
  securityLevel: number; // min security level across the route's terminals
  includesHiddenLocation: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: { ship?: string; investment?: string };
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

These properties target the pure **Route_Engine** (`computeRoutes`, `applyFilters`, `rankRoutes`, `buildCandidateRoutes`, `validateInputs`, `defaultFilters`). UI presence, navigation, footer content, and UEX wiring are covered by example/integration tests in the Testing Strategy, not by properties. Each property is consolidated from the prework to avoid redundancy.

### Property 1: Input validation rejects missing ship and non-positive investment

_For any_ input state, `validateInputs` returns `valid: true` if and only if a ship is selected (non-null id) **and** the investment is a number greater than zero; otherwise it returns `valid: false` with an error identifying each offending field (ship and/or investment), and no route computation is requested.

**Validates: Requirements 2.5, 2.6**

### Property 2: Reset restores the canonical default state

_For any_ arbitrary filter and input state, applying Reset yields a state deep-equal to `defaultFilters()` with no ship selected and no investment value, independent of the prior state.

**Validates: Requirements 2.4**

### Property 3: Every route buys and sells the same commodity at two different terminals

_For any_ price data, ship cargo capacity, and investment, every `TradeRoute` produced by `computeRoutes` has the same `commodityId` on its buy and sell sides and a `buyTerminalId` different from its `sellTerminalId`.

**Validates: Requirements 3.1**

### Property 4: Profit equals sell value minus buy value

_For any_ `TradeRoute` produced by the engine, `profit === sellValue - buyValue` and equals `quantityScu * (sellUnitPrice - buyUnitPrice)`, expressed in UEC.

**Validates: Requirements 3.2**

### Property 5: Quantity sizing invariant

_For any_ `TradeRoute` produced by the engine, the purchased `quantityScu` does not exceed the selected ship cargo capacity, the available supply at the buy terminal, or the available demand at the sell terminal, and the `buyValue` does not exceed the Initial_Investment.

**Validates: Requirements 3.3, 3.4, 3.7**

### Property 6: Pure-profit ranking is non-increasing

_For any_ result list computed with `Profit_Mode = "Pure profit"`, the routes are ordered so that each route's total profit is greater than or equal to the next route's total profit.

**Validates: Requirements 3.5**

### Property 7: Profit-over-time ranking is non-increasing

_For any_ result list computed with `Profit_Mode = "Profit over time"`, the routes are ordered so that each route's profit per unit of travel/wait time is greater than or equal to the next route's profit per unit time.

**Validates: Requirements 3.6**

### Property 8: Max-stops filter excludes routes that exceed the limit

_For any_ set of routes and any maximum-number-of-stops value, no route surviving `applyFilters` has a `stops` count greater than the maximum.

**Validates: Requirements 4.3**

### Property 9: Wait-timer filter excludes wait-timer routes when disabled

_For any_ set of routes, when the "Allow wait timers" toggle is disabled, no route surviving `applyFilters` has `requiresWaitTimer === true`.

**Validates: Requirements 4.6**

### Property 10: Include/exclude multiselect filtering

_For any_ set of routes and any one of the three multiselects (commodity type, commodity, faction): when the multiselect is in "Only selection" mode with one or more values, every surviving route's corresponding attribute is one of the selected values; when in "Avoid selection" mode with one or more values, no surviving route's corresponding attribute is one of the selected values; and when no values are selected, the output for that multiselect equals the input (no filtering).

**Validates: Requirements 5.3, 5.4, 5.5**

### Property 11: Minimum-security filter excludes under-secured routes

_For any_ set of routes and any minimum security level, every route surviving `applyFilters` has a route security level greater than or equal to the minimum (no included terminal is below the minimum).

**Validates: Requirements 6.2**

### Property 12: Box-size filter keeps only tradable routes

_For any_ set of routes and any supported box size, every route surviving `applyFilters` lists that box size among the sizes its commodity is tradable in.

**Validates: Requirements 6.4**

### Property 13: Hidden-location filter excludes hidden routes when enabled

_For any_ set of routes, when the "Avoid hidden locations" toggle is enabled, no route surviving `applyFilters` includes a Hidden_Location.

**Validates: Requirements 6.6**

## Error Handling

- **UEX data failures (Requirement 8.2):** Every UEX_Client function catches network errors and treats non-2xx responses as failures, returning `[]` (mirroring the existing `app/mercancia/uex-api.ts`). `fetchMarketData` uses `Promise.allSettled` so one failed endpoint does not abort the others. RouteFinder detects empty/missing critical datasets (e.g. empty prices or vehicles) and renders a market-data error: _"No se pudieron cargar los datos de mercado."_
- **Input validation (Requirements 2.5, 2.6):** Submit is gated by `validateInputs`. If no ship is selected or the investment is empty/zero/negative, RouteFinder shows field-level validation messages (Ant Design `Form`/`message`) and does **not** call `computeRoutes`.
- **Empty results (Requirement 7.2):** A valid computation returning zero routes renders an explicit no-results message rather than an empty table.
- **Loading state (Requirement 7.3):** RouteFinder tracks `status`; while `computing`, RouteResults shows a loading indicator until results or the no-results message replace it. `loading.tsx` covers the initial server fetch.
- **Engine robustness:** `computeRoutes` is total — it never throws on degenerate input (empty prices, zero/negative candidate quantities, missing terminal metadata). Such inputs simply yield fewer or zero routes. Routes with `qty <= 0` or `profit <= 0` are dropped before ranking.
- **Number formatting:** UEC/SCU values are formatted via the existing `formatPrice` / `formatStock` helpers to keep presentation consistent with Mercancía.

## Testing Strategy

Tests use the project's existing stack: **Vitest** (`vitest --run`) with **fast-check** for property-based tests, placed under `app/mejor-ruta/__tests__/` following the `app/mercancia/__tests__/` conventions (e.g. `*.property.test.ts`, `*.unit.test.ts`, `*.integration.test.ts`).

### Property-based tests (Route_Engine)

PBT applies to the engine because it is a pure function over a large, structured input space (price records × terminals × ships × filters), where input variation reveals real edge cases (zero supply/demand, investment caps, equal prices, empty selections).

- Library: **fast-check** (already a dependency). Do not hand-roll generators frameworks.
- Each property from the **Correctness Properties** section is implemented by a **single** property-based test running a **minimum of 100 iterations** (`{ numRuns: 100 }`).
- Each test is tagged with a comment referencing its design property, in the format:
  `// Feature: mejor-ruta, Property {number}: {property_text}`
- Generators: a reusable `ApiPriceRecord` arbitrary (extending the pattern in `ordering.property.test.ts`), a `TradeRoute` arbitrary, a `RouteFilters` arbitrary, and a `TerminalMeta` arbitrary. Generators deliberately produce edge inputs: zero `scu_buy`/`scu_sell`, investment smaller than one unit's buy price, `sellPrice <= buyPrice`, empty multiselect values, and hidden/low-security terminals.
- Coverage map: Properties 1–2 → validation/reset; 3–5 → `buildCandidateRoutes`/`computeRoutes` structure and invariants; 6–7 → `rankRoutes`; 8–13 → `applyFilters`.

### Unit tests (examples and edge cases)

- `validateInputs`: concrete cases (valid, null ship, empty/zero/negative investment).
- `buildCandidateRoutes`: a worked example with known prices/quantities asserting exact qty/profit; degenerate cases (no profitable pair, zero supply).
- `rankRoutes`: small fixed lists for both profit modes.
- UEX_Client error handling (Requirement 8.2): mocked `fetch` returning failure / non-2xx → assert `[]`; `fetchMarketData` with one failing endpoint via `Promise.allSettled` → assert partial data.

### Integration / smoke tests (NOT property-based)

- **UEX_Client wiring (Requirements 8.1, 8.3):** 1–2 mocked-`fetch` tests asserting requests hit the correct endpoints under `https://api.uexcorp.uk/2.0` and carry **no** Authorization header. Behavior does not vary with input, so these are examples, not properties.

### Component / rendering tests (NOT property-based)

UI behavior is verified with example-based rendering assertions, not PBT:

- **Navigation (Requirements 1.1–1.4):** `SiteHeader` shows "Mejor Ruta" under Data, navigates to `/mejor-ruta`, reflects selected state on that path, and never places the item under Herramientas.
- **RouteFinder / FiltersSidebar (Requirements 2.1–2.3, 4.1–4.2, 4.4–4.5, 5.1–5.2, 6.1, 6.3, 6.5):** controls render and are populated from market data; expanded view reveals extended details.
- **RouteResults (Requirements 7.1–7.3):** a route renders all six required fields; empty list shows the no-results message; `computing` status shows the loading indicator.
- **SiteFooter (Requirements 9.1–9.3):** rendered by the root layout on every page, with the unofficial/not-affiliated disclaimer plus links and contact sections.

### Framework compliance (Requirement 10)

Not automatable; satisfied by building routes, layouts, components, and data fetching against the guides in `node_modules/next/dist/docs/` (server-by-default components, `fetch` + `revalidate`, `loading.tsx` streaming, `Promise.allSettled` parallel fetch) and reviewing against them, as documented in the Overview.
