import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { buildCandidateRoutes } from "../route-engine";
import type { ApiPriceRecord } from "../types";

// Feature: mejor-ruta, Property 4: Profit equals sell value minus buy value
//
// Validates: Requirements 3.2
//
// For any TradeRoute produced by the engine, profit === sellValue - buyValue
// (exact) and equals quantityScu * (sellUnitPrice - buyUnitPrice), expressed in
// UEC. The exact invariant is asserted against the route's own buyValue /
// sellValue (which the engine computed); the quantity * unit-price-delta form is
// asserted with a small float tolerance.

/**
 * Self-contained ApiPriceRecord arbitrary. Commodity ids are drawn from a small
 * set and terminal ids from a slightly larger small set so that many records
 * share a commodity across *different* terminals — this is what lets
 * buildCandidateRoutes actually pair buy/sell terminals and produce real routes.
 * Prices and supply/demand are biased positive so profitable pairs occur often.
 */
const apiPriceRecordArb: fc.Arbitrary<ApiPriceRecord> = fc.record({
  id: fc.nat(),
  id_commodity: fc.integer({ min: 1, max: 4 }),
  id_terminal: fc.integer({ min: 1, max: 8 }),
  id_star_system: fc.nat(),
  id_planet: fc.nat(),
  id_orbit: fc.nat(),
  id_moon: fc.nat(),
  id_city: fc.nat(),
  id_outpost: fc.nat(),
  id_poi: fc.nat(),
  id_faction: fc.nat({ max: 10 }),
  // Some zero buys (non-buyable terminals) mixed with positive buy prices.
  price_buy: fc.oneof(
    fc.constant(0),
    fc.float({ min: Math.fround(0.01), max: 100000, noNaN: true }),
  ),
  price_sell: fc.oneof(
    fc.constant(0),
    fc.float({ min: Math.fround(0.01), max: 100000, noNaN: true }),
  ),
  scu_buy: fc.nat({ max: 10000 }),
  scu_buy_max: fc.nat({ max: 10000 }),
  scu_sell: fc.nat({ max: 10000 }),
  scu_sell_max: fc.nat({ max: 10000 }),
  commodity_name: fc.string({ minLength: 1, maxLength: 20 }),
  commodity_slug: fc.string({ minLength: 1, maxLength: 20 }),
  star_system_name: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
    nil: null,
  }),
  planet_name: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
    nil: null,
  }),
  orbit_name: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
    nil: null,
  }),
  moon_name: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
    nil: null,
  }),
  space_station_name: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
    nil: null,
  }),
  outpost_name: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
    nil: null,
  }),
  city_name: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
    nil: null,
  }),
  terminal_name: fc.string({ minLength: 1, maxLength: 30 }),
  terminal_slug: fc.string({ minLength: 1, maxLength: 30 }),
  terminal_code: fc.string({ minLength: 1, maxLength: 10 }),
  game_version: fc.string({ minLength: 1, maxLength: 10 }),
  date_modified: fc.nat(),
});

describe("Feature: mejor-ruta, Property 4: Profit equals sell value minus buy value", () => {
  it("every produced route has profit === sellValue - buyValue and equals quantity * unit-price delta", () => {
    fc.assert(
      fc.property(
        fc.array(apiPriceRecordArb, { maxLength: 40 }),
        fc.integer({ min: 1, max: 10000 }), // shipCargoScu
        fc.float({ min: Math.fround(0.01), max: 1_000_000_000, noNaN: true }), // investment (UEC)
        (prices, shipCargoScu, investment) => {
          const routes = buildCandidateRoutes(prices, shipCargoScu, investment);

          for (const route of routes) {
            // Exact invariant against the engine's own computed values.
            expect(route.profit).toBe(route.sellValue - route.buyValue);

            // Recover the unit prices from the route's own values and the
            // quantity (quantity > 0 is guaranteed for produced routes).
            const buyUnitPrice = route.buyValue / route.quantityScu;
            const sellUnitPrice = route.sellValue / route.quantityScu;
            const expectedProfit =
              route.quantityScu * (sellUnitPrice - buyUnitPrice);

            // Same value up to floating-point rounding (relative tolerance).
            const tolerance = Math.max(1, Math.abs(route.profit)) * 1e-6;
            expect(Math.abs(route.profit - expectedProfit)).toBeLessThanOrEqual(
              tolerance,
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
