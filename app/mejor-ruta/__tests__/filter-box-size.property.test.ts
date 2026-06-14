import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { applyFilters, defaultFilters } from "../route-engine";
import type { TerminalMeta, TradeRoute } from "../types";

/**
 * Feature: mejor-ruta, Property 12: Box-size filter keeps only tradable routes
 *
 * Validates: Requirements 6.4
 *
 * For any set of routes and any supported box size, every route surviving
 * applyFilters lists that box size among the sizes its commodity is tradable
 * in (route.boxSizesScu includes the chosen size). When boxSizeScu is null, no
 * box-size filtering applies and every route survives.
 */

// Small pool of box sizes (SCU). Drawing both the route's boxSizesScu and the
// chosen filter value from this pool guarantees overlaps happen often enough to
// exercise both the "kept" and "excluded" branches of the box-size filter.
const BOX_SIZE_POOL = [1, 2, 4, 8, 16] as const;

/**
 * Self-contained TradeRoute arbitrary. The only field that matters for the
 * box-size filter is `boxSizesScu`, which is drawn as a (possibly empty) subset
 * of the shared pool so overlaps with the chosen boxSizeScu occur. Every other
 * field is neutral and valid; the test pairs this with default filters (and an
 * empty terminals list) so only the box-size rule can exclude a route.
 */
const tradeRouteArb: fc.Arbitrary<TradeRoute> = fc.record({
  commodityId: fc.integer({ min: 1, max: 5 }),
  commodityName: fc.string({ minLength: 1, maxLength: 20 }),
  commodityTypeId: fc.option(fc.integer({ min: 1, max: 5 }), { nil: null }),
  buyTerminalId: fc.integer({ min: 1, max: 8 }),
  buyTerminalName: fc.string({ minLength: 1, maxLength: 20 }),
  sellTerminalId: fc.integer({ min: 1, max: 8 }),
  sellTerminalName: fc.string({ minLength: 1, maxLength: 20 }),
  factionId: fc.option(fc.integer({ min: 1, max: 5 }), { nil: null }),
  quantityScu: fc.integer({ min: 1, max: 1000 }),
  buyValue: fc.float({ min: Math.fround(1), max: 100000, noNaN: true }),
  sellValue: fc.float({ min: Math.fround(1), max: 200000, noNaN: true }),
  profit: fc.float({ min: Math.fround(1), max: 100000, noNaN: true }),
  stops: fc.integer({ min: 0, max: 3 }),
  requiresWaitTimer: fc.boolean(),
  // Possibly-empty subset of the pool so the filter is exercised on both sides.
  boxSizesScu: fc.uniqueArray(fc.constantFrom(...BOX_SIZE_POOL), {
    maxLength: BOX_SIZE_POOL.length,
  }),
  securityLevel: fc.integer({ min: 0, max: 5 }),
  includesHiddenLocation: fc.boolean(),
});

describe("Feature: mejor-ruta, Property 12: Box-size filter keeps only tradable routes", () => {
  it("every surviving route lists the chosen box size when it is set; all survive when null", () => {
    fc.assert(
      fc.property(
        fc.array(tradeRouteArb, { maxLength: 50 }),
        // boxSizeScu including null (no filtering) and a value from the pool.
        fc.option(fc.constantFrom(...BOX_SIZE_POOL), { nil: null }),
        (routes, boxSizeScu) => {
          // Build filters from defaults so all other criteria are neutral and
          // cannot exclude routes; only the box-size rule is exercised.
          const filters = { ...defaultFilters(), boxSizeScu };
          // Terminals are irrelevant to the box-size rule; keep them empty.
          const terminals: TerminalMeta[] = [];

          const survivors = applyFilters(routes, filters, terminals);

          if (boxSizeScu !== null) {
            for (const route of survivors) {
              expect(route.boxSizesScu).toContain(boxSizeScu);
            }
          } else {
            // null => no box-size filtering; every route survives.
            expect(survivors.length).toBe(routes.length);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
