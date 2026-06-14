import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { applyFilters, defaultFilters } from "../route-engine";
import type { TerminalMeta, TradeRoute } from "../types";

/**
 * Feature: mejor-ruta, Property 8: Max-stops filter excludes routes that exceed the limit
 *
 * Validates: Requirements 4.3
 *
 * For any set of routes and any maximum-number-of-stops value, no route
 * surviving applyFilters has a stops count greater than the maximum. When
 * maxStops is null, no stops filtering applies.
 */

/**
 * Self-contained TradeRoute arbitrary.
 *
 * `stops` is varied meaningfully across a small range (including 0 and values
 * well above the generated maxStops) so the filter boundary is exercised. All
 * other fields are populated with neutral, valid values; the test pairs this
 * arbitrary with default (neutral) filters so that only the max-stops rule can
 * exclude a route.
 */
const tradeRouteArb: fc.Arbitrary<TradeRoute> = fc.record({
  commodityId: fc.integer({ min: 1, max: 5 }),
  commodityName: fc.string({ minLength: 1, maxLength: 20 }),
  commodityTypeId: fc.option(fc.integer({ min: 1, max: 5 }), { nil: null }),
  buyTerminalId: fc.integer({ min: 10, max: 14 }),
  buyTerminalName: fc.string({ minLength: 1, maxLength: 20 }),
  sellTerminalId: fc.integer({ min: 20, max: 24 }),
  sellTerminalName: fc.string({ minLength: 1, maxLength: 20 }),
  factionId: fc.option(fc.integer({ min: 1, max: 5 }), { nil: null }),
  quantityScu: fc.integer({ min: 1, max: 1000 }),
  buyValue: fc.float({ min: Math.fround(1), max: 100000, noNaN: true }),
  sellValue: fc.float({ min: Math.fround(1), max: 200000, noNaN: true }),
  profit: fc.float({ min: Math.fround(1), max: 100000, noNaN: true }),
  // Vary stops meaningfully, including 0 and values beyond typical maxStops.
  stops: fc.integer({ min: 0, max: 10 }),
  requiresWaitTimer: fc.boolean(),
  boxSizesScu: fc.constant([1, 2, 4, 8, 16, 24, 32]),
  securityLevel: fc.integer({ min: 0, max: 5 }),
  includesHiddenLocation: fc.boolean(),
});

describe("Feature: mejor-ruta, Property 8: Max-stops filter excludes routes that exceed the limit", () => {
  it("no surviving route exceeds the max-stops limit when it is set", () => {
    fc.assert(
      fc.property(
        fc.array(tradeRouteArb, { maxLength: 50 }),
        // maxStops including null (no filtering) and integer limits.
        fc.option(fc.integer({ min: 0, max: 10 }), { nil: null }),
        (routes, maxStops) => {
          // Build filters from defaults so all other criteria are neutral and
          // cannot exclude routes; only the max-stops rule is exercised.
          const filters = { ...defaultFilters(), maxStops };
          // Empty terminals: routes keep placeholder security 0 and not hidden,
          // and the neutral filters do not exclude on security/hidden.
          const terminals: TerminalMeta[] = [];

          const survivors = applyFilters(routes, filters, terminals);

          if (maxStops !== null) {
            for (const route of survivors) {
              expect(route.stops).toBeLessThanOrEqual(maxStops);
            }
          } else {
            // maxStops null => no stops filtering; every route survives.
            expect(survivors.length).toBe(routes.length);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
