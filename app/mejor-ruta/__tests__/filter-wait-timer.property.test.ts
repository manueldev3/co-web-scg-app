import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { applyFilters, defaultFilters } from "../route-engine";
import type { TradeRoute } from "../types";

/**
 * Feature: mejor-ruta, Property 9: Wait-timer filter excludes wait-timer routes when disabled
 *
 * Validates: Requirements 4.6
 *
 * For any set of routes, when the "Allow wait timers" toggle is disabled
 * (allowWaitTimers === false), no route surviving applyFilters has
 * requiresWaitTimer === true. The wait-timer rule is the only rule exercised:
 * every other filter is kept neutral via defaultFilters() (empty multiselects,
 * null max-stops / min-security / box-size, avoid-hidden off) and terminals is
 * empty so security/hidden resolution imposes no extra constraint.
 */

/**
 * Self-contained TradeRoute arbitrary.
 *
 * `requiresWaitTimer` is varied across true/false (the field under test). All
 * other fields stay in neutral ranges so that, paired with defaultFilters(),
 * only the wait-timer rule can ever remove a route:
 * - `stops` is 1 (defaultFilters maxStops is null anyway, so it never filters).
 * - multiselect attributes (commodityTypeId, commodityId, factionId) are
 *   irrelevant because defaultFilters multiselects have empty values.
 * - `boxSizesScu` is non-empty (boxSizeScu filter is null anyway).
 * - `securityLevel` / `includesHiddenLocation` are irrelevant with empty
 *   terminals and neutral filters.
 */
const tradeRouteArb: fc.Arbitrary<TradeRoute> = fc.record({
  commodityId: fc.integer({ min: 1, max: 100 }),
  commodityName: fc.string({ minLength: 1, maxLength: 20 }),
  commodityTypeId: fc.option(fc.integer({ min: 1, max: 50 }), { nil: null }),
  buyTerminalId: fc.integer({ min: 1, max: 100 }),
  buyTerminalName: fc.string({ minLength: 1, maxLength: 20 }),
  sellTerminalId: fc.integer({ min: 101, max: 200 }),
  sellTerminalName: fc.string({ minLength: 1, maxLength: 20 }),
  factionId: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }),
  quantityScu: fc.integer({ min: 1, max: 2000 }),
  buyValue: fc.float({ min: Math.fround(1), max: 1_000_000, noNaN: true }),
  sellValue: fc.float({ min: Math.fround(1), max: 1_000_000, noNaN: true }),
  profit: fc.float({ min: Math.fround(1), max: 1_000_000, noNaN: true }),
  stops: fc.constant(1),
  // The field under test: vary across both wait-timer states.
  requiresWaitTimer: fc.boolean(),
  boxSizesScu: fc.constant([1, 2, 4, 8, 16, 24, 32]),
  securityLevel: fc.integer({ min: 0, max: 5 }),
  includesHiddenLocation: fc.boolean(),
});

describe("Feature: mejor-ruta, Property 9: Wait-timer filter excludes wait-timer routes when disabled", () => {
  it("excludes every wait-timer route when allowWaitTimers is false", () => {
    fc.assert(
      fc.property(fc.array(tradeRouteArb, { maxLength: 50 }), (routes) => {
        const filters = { ...defaultFilters(), allowWaitTimers: false };

        const survivors = applyFilters(routes, filters, []);

        for (const route of survivors) {
          expect(route.requiresWaitTimer).toBe(false);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("does not remove routes for the wait-timer rule when allowWaitTimers is true", () => {
    fc.assert(
      fc.property(fc.array(tradeRouteArb, { maxLength: 50 }), (routes) => {
        const filters = { ...defaultFilters(), allowWaitTimers: true };

        const survivors = applyFilters(routes, filters, []);

        // With every other filter neutral and terminals empty, no route is
        // removed when wait timers are allowed.
        expect(survivors.length).toBe(routes.length);
      }),
      { numRuns: 100 },
    );
  });
});
