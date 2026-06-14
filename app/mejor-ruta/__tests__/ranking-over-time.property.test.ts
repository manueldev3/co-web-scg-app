import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { rankRoutes } from "../route-engine";
import type { TradeRoute } from "../types";

// Feature: mejor-ruta, Property 7: Profit-over-time ranking is non-increasing
//
// Validates: Requirements 3.6
//
// For any result list computed with Profit_Mode = "over_time", each route's
// profit per unit of travel/wait time is >= the next route's profit per unit
// time.
//
// The engine's time proxy is NOT exported. To assert the non-increasing
// property we replicate the exact same formula the engine uses internally
// (`route-engine.ts` -> routeTimeProxy):
//
//   time = max(1, stops * 1 + (requiresWaitTimer ? 1 : 0))
//
// The clamp to a minimum of 1 keeps profit-per-time well-defined for degenerate
// routes with stops <= 0, which is why the generator below deliberately emits
// zero and negative stop counts.

/**
 * Mirrors the engine's internal `routeTimeProxy` (see `route-engine.ts`).
 * Kept in sync manually because the engine does not export it.
 */
function timeProxy(route: TradeRoute): number {
  const time = route.stops * 1 + (route.requiresWaitTimer ? 1 : 0);
  return Math.max(1, time);
}

/**
 * Self-contained TradeRoute arbitrary.
 *
 * Only the fields that drive the over_time ranking are varied meaningfully:
 * - `profit`: spans negative, zero, and positive values so ordering is
 *   exercised across the full sign range.
 * - `stops`: includes 0 and negative values to exercise the engine's clamp.
 * - `requiresWaitTimer`: both boolean values to exercise the wait-timer
 *   penalty term in the time proxy.
 *
 * The remaining fields are filled with valid-but-fixed placeholder values
 * since they do not influence `rankRoutes` in over_time mode.
 */
const tradeRouteArb: fc.Arbitrary<TradeRoute> = fc
  .record({
    profit: fc.float({ min: -1_000_000, max: 1_000_000, noNaN: true }),
    stops: fc.integer({ min: -3, max: 10 }),
    requiresWaitTimer: fc.boolean(),
  })
  .map(({ profit, stops, requiresWaitTimer }) => ({
    commodityId: 1,
    commodityName: "c",
    commodityTypeId: null,
    buyTerminalId: 1,
    buyTerminalName: "b",
    sellTerminalId: 2,
    sellTerminalName: "s",
    factionId: null,
    quantityScu: 1,
    buyValue: 0,
    sellValue: profit,
    profit,
    stops,
    requiresWaitTimer,
    boxSizesScu: [1],
    securityLevel: 0,
    includesHiddenLocation: false,
  }));

describe("Feature: mejor-ruta, Property 7: Profit-over-time ranking is non-increasing", () => {
  it("ranks routes so profit-per-time is non-increasing across the result list", () => {
    fc.assert(
      fc.property(fc.array(tradeRouteArb, { maxLength: 50 }), (routes) => {
        const result = rankRoutes(routes, "over_time");

        // Same multiset of routes, just reordered.
        expect(result.length).toBe(routes.length);

        for (let i = 0; i + 1 < result.length; i++) {
          const current = result[i].profit / timeProxy(result[i]);
          const next = result[i + 1].profit / timeProxy(result[i + 1]);

          // current >= next within a small float tolerance to absorb
          // floating-point rounding in the division.
          const tolerance =
            Math.max(1, Math.abs(current), Math.abs(next)) * 1e-9;
          expect(current).toBeGreaterThanOrEqual(next - tolerance);
        }
      }),
      { numRuns: 100 },
    );
  });
});
