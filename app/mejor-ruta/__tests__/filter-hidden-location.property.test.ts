import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { applyFilters, defaultFilters } from "../route-engine";
import type { TerminalMeta, TradeRoute } from "../types";

/**
 * Feature: mejor-ruta, Property 13: Hidden-location filter excludes hidden routes when enabled
 *
 * Validates: Requirements 6.6
 *
 * For any set of routes, when the "Avoid hidden locations" toggle is enabled
 * (avoidHiddenLocations === true), no route surviving applyFilters includes a
 * Hidden_Location. applyFilters resolves a route's effective
 * `includesHiddenLocation` from the TerminalMeta argument: true when the buy
 * terminal OR the sell terminal isHidden (looked up by buyTerminalId /
 * sellTerminalId), and writes that resolved value onto the surviving route.
 * When the toggle is disabled, no hidden-based removal occurs.
 */

// Pool of terminal ids shared by the generated terminals and the routes that
// reference them, so every route's buy/sell terminal resolves to a real
// TerminalMeta with a known hidden flag.
const TERMINAL_IDS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/**
 * Terminals arbitrary: assigns a varied isHidden flag to every id in the pool
 * so that both the buy and the sell terminal of any generated route always
 * resolve. Mixing hidden / non-hidden terminals exercises the OR semantics on
 * both sides of a route.
 */
const terminalsArb: fc.Arbitrary<TerminalMeta[]> = fc
  .tuple(...TERMINAL_IDS.map(() => fc.boolean()))
  .map((hiddenFlags) =>
    TERMINAL_IDS.map((id, i) => ({
      id,
      name: `T${id}`,
      securityLevel: 0,
      isHidden: hiddenFlags[i],
      factionId: null,
      factionName: null,
    })),
  );

/**
 * Self-contained TradeRoute arbitrary whose buy/sell terminal ids are drawn
 * from the shared pool so hidden-location resolution from TerminalMeta is
 * meaningful. The route's own `includesHiddenLocation` is a placeholder (as
 * buildCandidateRoutes leaves it) — the resolved value comes from the
 * terminals. All other fields are neutral and valid; the test pairs this with
 * default filters so only the avoid-hidden rule can exclude a route.
 */
const tradeRouteArb: fc.Arbitrary<TradeRoute> = fc.record({
  commodityId: fc.integer({ min: 1, max: 5 }),
  commodityName: fc.string({ minLength: 1, maxLength: 20 }),
  commodityTypeId: fc.option(fc.integer({ min: 1, max: 5 }), { nil: null }),
  buyTerminalId: fc.constantFrom(...TERMINAL_IDS),
  buyTerminalName: fc.string({ minLength: 1, maxLength: 20 }),
  sellTerminalId: fc.constantFrom(...TERMINAL_IDS),
  sellTerminalName: fc.string({ minLength: 1, maxLength: 20 }),
  factionId: fc.option(fc.integer({ min: 1, max: 5 }), { nil: null }),
  quantityScu: fc.integer({ min: 1, max: 1000 }),
  buyValue: fc.float({ min: Math.fround(1), max: 100000, noNaN: true }),
  sellValue: fc.float({ min: Math.fround(1), max: 200000, noNaN: true }),
  profit: fc.float({ min: Math.fround(1), max: 100000, noNaN: true }),
  stops: fc.integer({ min: 0, max: 3 }),
  requiresWaitTimer: fc.boolean(),
  boxSizesScu: fc.constant([1, 2, 4, 8, 16, 24, 32]),
  securityLevel: fc.integer({ min: 0, max: 5 }),
  // Placeholder; the effective value is resolved from TerminalMeta.
  includesHiddenLocation: fc.boolean(),
});

describe("Feature: mejor-ruta, Property 13: Hidden-location filter excludes hidden routes when enabled", () => {
  it("excludes every route that includes a hidden location when the toggle is enabled, and removes none when disabled", () => {
    fc.assert(
      fc.property(
        fc.array(tradeRouteArb, { maxLength: 50 }),
        terminalsArb,
        fc.boolean(),
        (routes, terminals, avoidHiddenLocations) => {
          // Build filters from defaults so all other criteria are neutral and
          // cannot exclude routes; only the avoid-hidden rule is exercised.
          const filters = { ...defaultFilters(), avoidHiddenLocations };

          const survivors = applyFilters(routes, filters, terminals);

          if (avoidHiddenLocations) {
            // No surviving route may include a hidden location, and the
            // resolved value on each survivor must reflect that.
            for (const route of survivors) {
              expect(route.includesHiddenLocation).toBe(false);
            }
          } else {
            // Toggle disabled => no hidden-based removal occurs; every route
            // survives (all other filters are neutral defaults).
            expect(survivors.length).toBe(routes.length);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
