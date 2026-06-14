import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { applyFilters, defaultFilters } from "../route-engine";
import type { TerminalMeta, TradeRoute } from "../types";

/**
 * Feature: mejor-ruta, Property 11: Minimum-security filter excludes under-secured routes
 *
 * Validates: Requirements 6.2
 *
 * For any set of routes and any minimum security level, every route surviving
 * applyFilters has a route security level >= the minimum (no included terminal
 * is below the minimum). applyFilters resolves a route's effective security
 * level from the TerminalMeta argument as min(security of buyTerminal,
 * security of sellTerminal), looked up by buyTerminalId / sellTerminalId, and
 * writes that resolved value onto the surviving route's `securityLevel` field.
 * When minSecurityLevel is null, no security filtering applies.
 */

// Pool of terminal ids shared by the generated terminals and the routes that
// reference them, so every route's buy/sell terminal resolves to a real
// TerminalMeta with a known security level.
const TERMINAL_IDS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/**
 * Terminals arbitrary: assigns a varied securityLevel to every id in the pool
 * so that both the buy and the sell terminal of any generated route always
 * resolve. Security levels span 0..5 (including the boundary 0) so the filter
 * threshold is exercised on both sides.
 */
const terminalsArb: fc.Arbitrary<TerminalMeta[]> = fc
  .tuple(...TERMINAL_IDS.map(() => fc.integer({ min: 0, max: 5 })))
  .map((levels) =>
    TERMINAL_IDS.map((id, i) => ({
      id,
      name: `T${id}`,
      securityLevel: levels[i],
      isHidden: false,
      factionId: null,
      factionName: null,
    })),
  );

/**
 * Self-contained TradeRoute arbitrary whose buy/sell terminal ids are drawn
 * from the shared pool so security resolution from TerminalMeta is meaningful.
 * The route's own `securityLevel` is a placeholder (as buildCandidateRoutes
 * leaves it) — the resolved value comes from the terminals. All other fields
 * are neutral and valid; the test pairs this with default filters so only the
 * minimum-security rule can exclude a route.
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
  // Placeholder; the effective value is resolved from TerminalMeta.
  securityLevel: fc.integer({ min: 0, max: 5 }),
  includesHiddenLocation: fc.boolean(),
});

describe("Feature: mejor-ruta, Property 11: Minimum-security filter excludes under-secured routes", () => {
  it("every surviving route's resolved security level meets the minimum when it is set", () => {
    fc.assert(
      fc.property(
        fc.array(tradeRouteArb, { maxLength: 50 }),
        terminalsArb,
        // minSecurityLevel including null (no filtering) and integer thresholds.
        fc.option(fc.integer({ min: 0, max: 5 }), { nil: null }),
        (routes, terminals, minSecurityLevel) => {
          // Build filters from defaults so all other criteria are neutral and
          // cannot exclude routes; only the minimum-security rule is exercised.
          const filters = { ...defaultFilters(), minSecurityLevel };

          const survivors = applyFilters(routes, filters, terminals);

          if (minSecurityLevel !== null) {
            for (const route of survivors) {
              expect(route.securityLevel).toBeGreaterThanOrEqual(
                minSecurityLevel,
              );
            }
          } else {
            // null => no security filtering; every route survives.
            expect(survivors.length).toBe(routes.length);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
