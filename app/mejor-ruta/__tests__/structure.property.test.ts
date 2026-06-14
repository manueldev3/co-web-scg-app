import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { buildCandidateRoutes } from "../route-engine";
import type { ApiPriceRecord } from "../types";

/**
 * Feature: mejor-ruta, Property 3: Every route buys and sells the same commodity at two different terminals
 *
 * Validates: Requirements 3.1
 *
 * For any price data, ship cargo capacity, and investment, every TradeRoute
 * produced by buildCandidateRoutes has the same commodityId on its buy and
 * sell sides and a buyTerminalId different from its sellTerminalId.
 */

/**
 * Self-contained ApiPriceRecord arbitrary.
 *
 * Generators deliberately produce edge inputs (zero scu_buy/scu_sell,
 * sellPrice <= buyPrice) and constrain id_commodity / id_terminal to small
 * pools so that many records share commodity ids across *different* terminals.
 * Because buildCandidateRoutes pairs buy/sell terminals per commodity, this
 * makes real routes likely to be generated rather than always returning [].
 */
const apiPriceRecordArb: fc.Arbitrary<ApiPriceRecord> = fc.record({
  id: fc.nat(),
  // Small commodity pool so many records share a commodity id.
  id_commodity: fc.integer({ min: 1, max: 3 }),
  // Small terminal pool so the same commodity appears at different terminals.
  id_terminal: fc.integer({ min: 10, max: 14 }),
  id_star_system: fc.nat(),
  id_planet: fc.nat(),
  id_orbit: fc.nat(),
  id_moon: fc.nat(),
  id_city: fc.nat(),
  id_outpost: fc.nat(),
  id_poi: fc.nat(),
  id_faction: fc.nat({ max: 5 }),
  // Edge prices: zero (no buy/sell) plus a positive range so some pairs are
  // profitable (sellPrice > buyPrice) and some are not (sellPrice <= buyPrice).
  price_buy: fc.oneof(
    fc.constant(0),
    fc.float({ min: Math.fround(0.01), max: 1000, noNaN: true }),
  ),
  price_sell: fc.oneof(
    fc.constant(0),
    fc.float({ min: Math.fround(0.01), max: 1000, noNaN: true }),
  ),
  // Include zero scu to exercise the supply/demand edge cases.
  scu_buy: fc.nat({ max: 5000 }),
  scu_buy_max: fc.nat({ max: 5000 }),
  scu_sell: fc.nat({ max: 5000 }),
  scu_sell_max: fc.nat({ max: 5000 }),
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

describe("Feature: mejor-ruta, Property 3: Every route buys and sells the same commodity at two different terminals", () => {
  it("every produced route shares one commodity across two different terminals", () => {
    fc.assert(
      fc.property(
        fc.array(apiPriceRecordArb, { maxLength: 40 }),
        fc.integer({ min: 1, max: 2000 }), // shipCargoScu
        fc.float({ min: Math.fround(1), max: 1_000_000, noNaN: true }), // investment
        (prices, shipCargoScu, investment) => {
          const routes = buildCandidateRoutes(prices, shipCargoScu, investment);

          for (const route of routes) {
            // Buy and sell occur at two different terminals.
            expect(route.buyTerminalId).not.toBe(route.sellTerminalId);

            // The buy terminal serves this commodity.
            const buyRecordExists = prices.some(
              (p) =>
                p.id_commodity === route.commodityId &&
                p.id_terminal === route.buyTerminalId,
            );
            expect(buyRecordExists).toBe(true);

            // The sell terminal serves the *same* commodity.
            const sellRecordExists = prices.some(
              (p) =>
                p.id_commodity === route.commodityId &&
                p.id_terminal === route.sellTerminalId,
            );
            expect(sellRecordExists).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
