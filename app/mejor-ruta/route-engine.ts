import type {
  ApiCommodity,
  ApiPriceRecord,
  MultiselectFilter,
  ProfitMode,
  RouteFilters,
  TerminalMeta,
  TradeRoute,
  ValidationResult,
} from "./types";

/**
 * Route_Engine — pure, framework-free computation module.
 *
 * No imports from `react`/`next`. This file is built incrementally:
 * - Task 3.1 (this task): `validateInputs`, `defaultFilters`, and the
 *   `EngineInput` interface + stub signatures.
 * - Task 4.1: `buildCandidateRoutes`
 * - Task 5.1: `rankRoutes`
 * - Task 6.1: `applyFilters`
 * - Task 6.8: `computeRoutes` orchestration
 */

/** Input to the main `computeRoutes` entry point. */
export interface EngineInput {
  prices: ApiPriceRecord[];
  terminals: TerminalMeta[]; // security level + hidden flag + faction keyed by terminal id
  shipCargoScu: number; // selected ship cargo capacity in SCU
  investment: number; // Initial_Investment in UEC (validated > 0)
  filters: RouteFilters;
  /**
   * Commodity catalogue, used to resolve each route's commodity type
   * (`id_parent`) so the commodity-type filter works. Optional so existing
   * callers/tests that don't need type filtering keep compiling.
   */
  commodities?: ApiCommodity[];
}

/**
 * Validates the user inputs before requesting a route computation.
 *
 * Returns `valid: true` if and only if a ship is selected (non-null id) AND
 * the investment is a number greater than zero. Otherwise returns
 * `valid: false` with a field-level error for each offending field.
 *
 * Validates: Requirements 2.5, 2.6
 */
export function validateInputs(
  shipId: number | null,
  investment: number | null,
): ValidationResult {
  const errors: { ship?: string; investment?: string } = {};

  if (shipId === null) {
    errors.ship = "Selecciona una nave.";
  }

  if (
    investment === null ||
    typeof investment !== "number" ||
    Number.isNaN(investment) ||
    investment <= 0
  ) {
    errors.investment = "Ingresa una inversión válida mayor que cero.";
  }

  return {
    valid: errors.ship === undefined && errors.investment === undefined,
    errors,
  };
}

/**
 * Returns the canonical default `RouteFilters` state.
 * Used as the initial UI state and by the Reset control (Requirement 2.4).
 */
export function defaultFilters(): RouteFilters {
  return {
    profitMode: "pure_profit",
    maxStops: null,
    commodityTypes: { mode: "avoid", values: [] },
    commodities: { mode: "avoid", values: [] },
    factions: { mode: "avoid", values: [] },
    minSecurityLevel: null,
    boxSizeScu: null,
    allowWaitTimers: true,
    autoLoading: false,
    smartFilters: false,
    expandedView: false,
    avoidHiddenLocations: false,
  };
}

/**
 * Builds a short location string from a price record's location fields.
 * Prefers: planet/moon > city/station > outpost. Omits star system for brevity.
 * Example: "microTech > Port Tressler" or "ArcCorp > Area18"
 */
function buildTerminalLocation(record: ApiPriceRecord): string {
  const parts: string[] = [];
  // Planet or moon as the parent body
  if (record.planet_name) parts.push(record.planet_name);
  if (record.moon_name) parts.push(record.moon_name);
  // Specific location within: city, station, or outpost
  if (record.city_name) parts.push(record.city_name);
  if (record.space_station_name) parts.push(record.space_station_name);
  if (record.outpost_name) parts.push(record.outpost_name);
  return parts.join(" > ");
}

/**
 * Standard Star Citizen cargo container sizes, in SCU. Used as the default
 * `boxSizesScu` for a route's commodity because the UEX price record does not
 * expose per-commodity container availability. The box-size filter (task 6.1)
 * matches the supported box size against this list; defaulting to the full
 * standard set means routes are tradable in any standard box size until richer
 * data is available.
 */
const DEFAULT_BOX_SIZES_SCU = [1, 2, 4, 8, 16, 24, 32];

/**
 * Parse a UEX `container_sizes` string (e.g. `"1,2,4,8,16,24,32"`) into a
 * sorted, de-duplicated `number[]`. Returns the standard default set when the
 * string is missing or unparseable, so the box-size filter always has data.
 */
function parseContainerSizes(raw: string | undefined): number[] {
  if (!raw) return [...DEFAULT_BOX_SIZES_SCU];
  const sizes = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (sizes.length === 0) return [...DEFAULT_BOX_SIZES_SCU];
  return Array.from(new Set(sizes)).sort((a, b) => a - b);
}

/**
 * Pairs buy/sell terminals per commodity and sizes the load.
 *
 * For each commodity, every terminal that buys it from the player
 * (`price_buy > 0`) is paired with every *different* terminal that sells it
 * back to the player at a higher unit price (`price_sell > price_buy`). The
 * purchased quantity is sized so it fits the ship, the investment, the supply
 * at the buy terminal, and the demand at the sell terminal:
 *
 *   qty = floor(min(shipCargoScu, investment / B.price_buy, B.scu_buy, S.scu_sell))
 *
 * Routes with `qty <= 0` or `profit <= 0` are discarded.
 *
 * Field-derivation choices (the UEX price record does not carry every
 * `TradeRoute` field; these are populated so the later filter/rank tasks have
 * something to operate on):
 * - `commodityTypeId`: not present on `ApiPriceRecord`; set to `null`. A later
 *   task may enrich this by joining against the commodities dataset.
 * - `factionId`: taken from the buy terminal's `id_faction` (where the capital
 *   is committed); a value of `0` (UEX's "no faction") is normalized to `null`.
 * - `stops`: a single buy -> sell route is one hop, so `stops = 1`. The
 *   max-stops filter (task 6.1) compares against this.
 * - `requiresWaitTimer`: not derivable from price data; defaults to `false`
 *   (assume no wait timer unless richer data says otherwise).
 * - `boxSizesScu`: defaults to the standard SC container sizes (see above).
 * - `securityLevel`: the price record has no security level (that lives in
 *   `TerminalMeta`), so this is a placeholder `0`; `applyFilters` (task 6.1)
 *   resolves the real security level from terminal metadata.
 * - `includesHiddenLocation`: likewise a placeholder `false`, resolved against
 *   `TerminalMeta` in `applyFilters`.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.7
 */
export function buildCandidateRoutes(
  prices: ApiPriceRecord[],
  shipCargoScu: number,
  investment: number,
): TradeRoute[] {
  const routes: TradeRoute[] = [];

  // Group price records by commodity so buy/sell pairing stays within the
  // same commodity (Requirement 3.1).
  const byCommodity = new Map<number, ApiPriceRecord[]>();
  for (const record of prices) {
    const list = byCommodity.get(record.id_commodity);
    if (list) {
      list.push(record);
    } else {
      byCommodity.set(record.id_commodity, [record]);
    }
  }

  for (const records of byCommodity.values()) {
    const buyCandidates = records.filter((r) => r.price_buy > 0);
    const sellCandidates = records.filter((r) => r.price_sell > 0);

    for (const buy of buyCandidates) {
      for (const sell of sellCandidates) {
        // Same commodity, two *different* terminals (Requirement 3.1).
        if (sell.id_terminal === buy.id_terminal) continue;
        // Only profitable buy-low / sell-high pairs.
        if (sell.price_sell <= buy.price_buy) continue;

        // Quantity sizing: bounded by ship cargo, affordable amount,
        // supply at the buy terminal, and demand at the sell terminal
        // (Requirements 3.3, 3.4, 3.7).
        // NOTE: scu_sell is frequently 0 in the UEX API even when demand exists;
        // scu_sell_stock (or scu_sell_avg) is the correct demand figure.
        const affordable = investment / buy.price_buy;
        const sellDemand =
          sell.scu_sell_stock ?? sell.scu_sell_avg ?? sell.scu_sell;
        const qty = Math.floor(
          Math.min(shipCargoScu, affordable, buy.scu_buy, sellDemand > 0 ? sellDemand : shipCargoScu),
        );

        if (qty <= 0) continue;

        const buyValue = qty * buy.price_buy;
        const sellValue = qty * sell.price_sell;
        const profit = sellValue - buyValue;

        if (profit <= 0) continue;

        routes.push({
          commodityId: buy.id_commodity,
          commodityName: buy.commodity_name,
          commodityTypeId: null,
          buyTerminalId: buy.id_terminal,
          buyTerminalName: buy.terminal_name,
          buyTerminalLocation: buildTerminalLocation(buy),
          sellTerminalId: sell.id_terminal,
          sellTerminalName: sell.terminal_name,
          sellTerminalLocation: buildTerminalLocation(sell),
          factionId: buy.id_faction > 0 ? buy.id_faction : null,
          quantityScu: qty,
          buyValue,
          sellValue,
          profit,
          stops: 1,
          requiresWaitTimer: false,
          boxSizesScu: parseContainerSizes(
            buy.container_sizes ?? sell.container_sizes,
          ),
          securityLevel: 0,
          includesHiddenLocation: false,
        });
      }
    }
  }

  return routes;
}

/**
 * Applies the active filters to a list of candidate routes.
 *
 * Terminal-metadata resolution: `buildCandidateRoutes` cannot know each
 * terminal's security level or hidden status (those live in `TerminalMeta`,
 * not in the price record), so it leaves `securityLevel = 0` and
 * `includesHiddenLocation = false` as placeholders. This function resolves the
 * real values from `terminals` for every route, keyed by `buyTerminalId` and
 * `sellTerminalId`:
 * - effective `securityLevel` = min(security level of buy terminal, sell
 *   terminal). A terminal missing from `terminals` contributes no constraint
 *   (it is skipped when taking the min); if neither terminal is found the
 *   route keeps its placeholder `securityLevel` of 0.
 * - `includesHiddenLocation` = true when either resolved terminal `isHidden`.
 *
 * The resolved values are written onto the returned route objects (a shallow
 * copy of each surviving route — the input array and its elements are never
 * mutated) so downstream consumers and the 6.5/6.7 property tests observe the
 * real security/hidden values on the surviving routes. The min-security filter
 * (6.2) and avoid-hidden filter (6.6) use these resolved values.
 *
 * Filter semantics:
 * - maxStops (4.3): exclude routes with `stops > maxStops` when set.
 * - allowWaitTimers (4.6): when false, exclude routes that
 *   `requiresWaitTimer`.
 * - commodityTypes / commodities / factions multiselects (5.3/5.4/5.5): each
 *   `MultiselectFilter`. Empty `values` => no filtering. `"only"` keeps a route
 *   only when its attribute is in `values`; `"avoid"` excludes a route when its
 *   attribute is in `values`. A `null` attribute can never match an id, so it
 *   is excluded under `"only"` and kept under `"avoid"`.
 * - minSecurityLevel (6.2): exclude routes whose resolved security level is
 *   below the minimum when set.
 * - boxSizeScu (6.4): keep only routes whose `boxSizesScu` includes the size
 *   when set.
 * - avoidHiddenLocations (6.6): when true, exclude routes that include a
 *   hidden location.
 *
 * Validates: Requirements 4.3, 4.6, 5.3, 5.4, 5.5, 6.2, 6.4, 6.6
 */
export function applyFilters(
  routes: TradeRoute[],
  filters: RouteFilters,
  terminals: TerminalMeta[],
): TradeRoute[] {
  const terminalById = new Map<number, TerminalMeta>();
  for (const terminal of terminals) {
    terminalById.set(terminal.id, terminal);
  }

  const result: TradeRoute[] = [];

  for (const route of routes) {
    // Resolve real security level / hidden status from terminal metadata.
    const buyTerminal = terminalById.get(route.buyTerminalId);
    const sellTerminal = terminalById.get(route.sellTerminalId);

    const securityLevels: number[] = [];
    if (buyTerminal) securityLevels.push(buyTerminal.securityLevel);
    if (sellTerminal) securityLevels.push(sellTerminal.securityLevel);
    const resolvedSecurityLevel =
      securityLevels.length > 0
        ? Math.min(...securityLevels)
        : route.securityLevel;

    const resolvedIncludesHidden =
      (buyTerminal?.isHidden ?? false) || (sellTerminal?.isHidden ?? false);

    // Max-stops exclusion (Requirement 4.3).
    if (filters.maxStops !== null && route.stops > filters.maxStops) {
      continue;
    }

    // Wait-timer exclusion when disabled (Requirement 4.6).
    if (!filters.allowWaitTimers && route.requiresWaitTimer) {
      continue;
    }

    // Include/exclude multiselects (Requirements 5.3, 5.4, 5.5).
    if (
      !passesMultiselect(filters.commodityTypes, route.commodityTypeId) ||
      !passesMultiselect(filters.commodities, route.commodityId) ||
      !passesMultiselect(filters.factions, route.factionId)
    ) {
      continue;
    }

    // Minimum-security exclusion using the resolved value (Requirement 6.2).
    if (
      filters.minSecurityLevel !== null &&
      resolvedSecurityLevel < filters.minSecurityLevel
    ) {
      continue;
    }

    // Supported box-size inclusion (Requirement 6.4).
    if (
      filters.boxSizeScu !== null &&
      !route.boxSizesScu.includes(filters.boxSizeScu)
    ) {
      continue;
    }

    // Avoid-hidden exclusion using the resolved value (Requirement 6.6).
    if (filters.avoidHiddenLocations && resolvedIncludesHidden) {
      continue;
    }

    // Surviving route: return a copy with resolved terminal-derived fields,
    // never mutating the input.
    result.push({
      ...route,
      securityLevel: resolvedSecurityLevel,
      includesHiddenLocation: resolvedIncludesHidden,
    });
  }

  return result;
}

/**
 * Evaluates a single include/exclude multiselect against a route attribute.
 *
 * - Empty `values` => no filtering (the route always passes) (Req 5.5).
 * - `"only"` => the route passes only when `attribute` is one of `values`
 *   (Req 5.3). A `null` attribute cannot match an id, so it fails.
 * - `"avoid"` => the route passes unless `attribute` is one of `values`
 *   (Req 5.4). A `null` attribute cannot match an id, so it always passes.
 */
function passesMultiselect(
  filter: MultiselectFilter,
  attribute: number | null,
): boolean {
  if (filter.values.length === 0) {
    return true;
  }

  const matches = attribute !== null && filter.values.includes(attribute);

  return filter.mode === "only" ? matches : !matches;
}

/**
 * Base travel/wait time, in abstract time units, attributed to a single stop
 * on a route. A simple one-hop buy -> sell route (`stops = 1`) therefore costs
 * `STOP_TIME_UNITS` of travel time before any wait-timer penalty.
 */
const STOP_TIME_UNITS = 1;

/**
 * Additional time units added when a route requires a wait timer at a terminal.
 * Wait timers delay a trip, so a route that needs one is treated as taking
 * longer (and thus ranks lower for the same profit under "over_time").
 */
const WAIT_TIMER_TIME_UNITS = 1;

/**
 * Derives the travel/wait time proxy for a route, in abstract time units.
 *
 * The `TradeRoute` model carries no explicit duration, so time is approximated
 * from the fields that do exist: the number of `stops` (each stop costs
 * `STOP_TIME_UNITS`) plus a `WAIT_TIMER_TIME_UNITS` penalty when the route
 * `requiresWaitTimer`. The result is clamped to a minimum of 1 so the
 * profit-per-time metric is always well-defined and never divides by zero,
 * even for degenerate routes with `stops <= 0`.
 *
 * The proxy is deterministic and total for every route, which is what
 * Property 7 (profit-over-time ranking is non-increasing) relies on.
 */
function routeTimeProxy(route: TradeRoute): number {
  const time =
    route.stops * STOP_TIME_UNITS +
    (route.requiresWaitTimer ? WAIT_TIMER_TIME_UNITS : 0);
  return Math.max(1, time);
}

/**
 * Ranks routes according to the selected profit mode.
 *
 * - `"pure_profit"`: sorted in non-increasing order of total `profit`
 *   (Requirement 3.5).
 * - `"over_time"`: sorted in non-increasing order of profit per unit of
 *   travel/wait time, where time is the `routeTimeProxy` derived above
 *   (Requirement 3.6).
 *
 * Returns a new array; the input is never mutated.
 *
 * Validates: Requirements 3.5, 3.6
 */
export function rankRoutes(
  routes: TradeRoute[],
  mode: ProfitMode,
): TradeRoute[] {
  const sorted = [...routes];

  if (mode === "over_time") {
    sorted.sort(
      (a, b) => b.profit / routeTimeProxy(b) - a.profit / routeTimeProxy(a),
    );
  } else {
    // "pure_profit" (default): rank by total profit, descending.
    sorted.sort((a, b) => b.profit - a.profit);
  }

  return sorted;
}

/**
 * Main entry point: produces the ranked list of trade routes.
 *
 * Composes the three building blocks in order:
 *   1. `buildCandidateRoutes` pairs buy/sell terminals per commodity and sizes
 *      each load against the ship cargo, investment, supply, and demand.
 *   2. `applyFilters` resolves terminal metadata and drops routes excluded by
 *      the active filter set.
 *   3. `rankRoutes` orders the survivors by the selected profit mode.
 *
 * Total function: it never throws on degenerate input (empty prices, zero or
 * negative quantities, missing terminal metadata). The composed building
 * blocks already absorb such inputs — they simply yield fewer or zero routes —
 * so no additional guarding is required here.
 *
 * Validates: Requirements 3.1, 3.5, 3.6
 */
export function computeRoutes(input: EngineInput): TradeRoute[] {
  const candidates = buildCandidateRoutes(
    input.prices,
    input.shipCargoScu,
    input.investment,
  );

  // Enrich routes with data the price records alone don't carry so the
  // commodity-type and faction filters have real values to match against:
  //  - commodityTypeId  ← `id_parent` from the commodity catalogue.
  //  - factionId        ← the buy terminal's faction (when the price record
  //                        itself didn't already provide one).
  //  - terminal locations ← from terminal metadata (bulk prices endpoint
  //                          doesn't include location fields).
  const typeByCommodity = new Map<number, number | null>();
  for (const c of input.commodities ?? []) {
    typeByCommodity.set(c.id, c.id_parent ?? null);
  }
  const factionByTerminal = new Map<number, number | null>();
  const locationByTerminal = new Map<number, string>();
  for (const t of input.terminals) {
    factionByTerminal.set(t.id, t.factionId ?? null);
    locationByTerminal.set(t.id, t.location);
  }

  const enriched = candidates.map((route) => ({
    ...route,
    commodityTypeId:
      route.commodityTypeId ?? typeByCommodity.get(route.commodityId) ?? null,
    factionId:
      route.factionId ?? factionByTerminal.get(route.buyTerminalId) ?? null,
    buyTerminalLocation:
      route.buyTerminalLocation || locationByTerminal.get(route.buyTerminalId) || "",
    sellTerminalLocation:
      route.sellTerminalLocation || locationByTerminal.get(route.sellTerminalId) || "",
  }));

  const filtered = applyFilters(enriched, input.filters, input.terminals);
  return rankRoutes(filtered, input.filters.profitMode);
}
