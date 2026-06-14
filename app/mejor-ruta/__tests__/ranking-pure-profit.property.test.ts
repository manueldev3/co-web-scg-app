import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { rankRoutes } from "../route-engine";
import type { TradeRoute } from "../types";

/**
 * Feature: mejor-ruta, Property 6: Pure-profit ranking is non-increasing
 *
 * Validates: Requirements 3.5
 *
 * For any result list computed with Profit_Mode = "pure_profit", the routes are
 * ordered so that each route's total profit is greater than or equal to the
 * next route's total profit (result[i].profit >= result[i + 1].profit for all i).
 */

/**
 * Reusable TradeRoute arbitrary. Only the fields relevant to ranking
 * (`profit`, `stops`, `requiresWaitTimer`) are generated meaningfully; the
 * remaining TradeRoute fields are filled with simple, valid values so the
 * object satisfies the type without influencing pure-profit ordering.
 */
const tradeRouteArb: fc.Arbitrary<TradeRoute> = fc
  .record({
    profit: fc.float({ min: Math.fround(0.01), max: 1_000_000, noNaN: true }),
    stops: fc.integer({ min: 1, max: 10 }),
    requiresWaitTimer: fc.boolean(),
  })
  .map(({ profit, stops, requiresWaitTimer }) => ({
    commodityId: 1,
    commodityName: "commodity",
    commodityTypeId: null,
    buyTerminalId: 1,
    buyTerminalName: "buy",
    sellTerminalId: 2,
    sellTerminalName: "sell",
    factionId: null,
    quantityScu: 1,
    buyValue: 1,
    sellValue: 1 + profit,
    profit,
    stops,
    requiresWaitTimer,
    boxSizesScu: [1],
    securityLevel: 0,
    includesHiddenLocation: false,
  }));

describe("Feature: mejor-ruta, Property 6: Pure-profit ranking is non-increasing", () => {
  it("orders routes so each profit >= the next route's profit", () => {
    fc.assert(
      fc.property(fc.array(tradeRouteArb, { maxLength: 50 }), (routes) => {
        const ranked = rankRoutes(routes, "pure_profit");

        // Ranking preserves the set of routes (no loss/duplication).
        expect(ranked).toHaveLength(routes.length);

        // The profit sequence is non-increasing.
        for (let i = 0; i < ranked.length - 1; i++) {
          expect(ranked[i].profit).toBeGreaterThanOrEqual(ranked[i + 1].profit);
        }
      }),
      { numRuns: 100 },
    );
  });
});
