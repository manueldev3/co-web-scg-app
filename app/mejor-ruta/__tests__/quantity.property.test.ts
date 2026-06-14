import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { buildCandidateRoutes } from "../route-engine";
import type { ApiPriceRecord } from "../types";

/**
 * Feature: mejor-ruta, Property 5: Quantity sizing invariant
 *
 * Validates: Requirements 3.3, 3.4, 3.7
 *
 * For any TradeRoute produced by the engine, the purchased `quantityScu` does
 * not exceed the selected ship cargo capacity, the available supply (`scu_buy`)
 * at the buy terminal, or the available demand (`scu_sell`) at the sell
 * terminal, and `buyValue` does not exceed the Initial_Investment.
 */

/**
 * Builds an ApiPriceRecord from a small set of meaningful fields, filling the
 * remaining required fields with deterministic placeholder values. Commodity
 * and terminal ids are drawn from small pools so that the same commodity is
 * shared across different terminals (the precondition for a route to exist).
 */
function makeRecord(parts: {
  id: number;
  id_commodity: number;
  id_terminal: number;
  id_faction: number;
  price_buy: number;
  price_sell: number;
  scu_buy: number;
  scu_sell: number;
}): ApiPriceRecord {
  return {
    id: parts.id,
    id_commodity: parts.id_commodity,
    id_terminal: parts.id_terminal,
    id_star_system: 0,
    id_planet: 0,
    id_orbit: 0,
    id_moon: 0,
    id_city: 0,
    id_outpost: 0,
    id_poi: 0,
    id_faction: parts.id_faction,
    price_buy: parts.price_buy,
    price_sell: parts.price_sell,
    scu_buy: parts.scu_buy,
    scu_buy_max: parts.scu_buy,
    scu_sell: parts.scu_sell,
    scu_sell_max: parts.scu_sell,
    commodity_name: `commodity-${parts.id_commodity}`,
    commodity_slug: `commodity-${parts.id_commodity}`,
    star_system_name: null,
    planet_name: null,
    orbit_name: null,
    moon_name: null,
    space_station_name: null,
    outpost_name: null,
    city_name: null,
    terminal_name: `terminal-${parts.id_terminal}`,
    terminal_slug: `terminal-${parts.id_terminal}`,
    terminal_code: `T${parts.id_terminal}`,
    game_version: "1.0",
    date_modified: 0,
  };
}

/**
 * Reusable ApiPriceRecord arbitrary.
 *
 * - `id_commodity` / `id_terminal` are drawn from small pools so commodities
 *   are shared across distinct terminals (enabling buy/sell pairing).
 * - `price_buy` / `price_sell` include 0 (no buy / no sell side) plus positive
 *   integer prices. Integer prices keep `buyValue = qty * price_buy` exact so
 *   the investment bound is checked without floating-point slack.
 * - `scu_buy` / `scu_sell` include 0 to exercise the zero-supply / zero-demand
 *   edge cases.
 */
const priceRecordArb: fc.Arbitrary<ApiPriceRecord> = fc
  .record({
    id: fc.nat(),
    id_commodity: fc.integer({ min: 0, max: 4 }),
    id_terminal: fc.integer({ min: 0, max: 5 }),
    id_faction: fc.nat({ max: 5 }),
    price_buy: fc.oneof(fc.constant(0), fc.integer({ min: 1, max: 1000 })),
    price_sell: fc.oneof(fc.constant(0), fc.integer({ min: 1, max: 1000 })),
    scu_buy: fc.integer({ min: 0, max: 500 }),
    scu_sell: fc.integer({ min: 0, max: 500 }),
  })
  .map(makeRecord);

/**
 * Generates a list of price records with a UNIQUE (id_commodity, id_terminal)
 * pair per record. Uniqueness lets the test deterministically recover the
 * single buy record and single sell record a route was built from, so the
 * supply/demand bounds can be checked against the exact source records.
 */
const uniquePriceListArb: fc.Arbitrary<ApiPriceRecord[]> = fc
  .array(priceRecordArb, { maxLength: 40 })
  .map((records) => {
    const seen = new Set<string>();
    const unique: ApiPriceRecord[] = [];
    for (const record of records) {
      const key = `${record.id_commodity}:${record.id_terminal}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(record);
    }
    return unique;
  });

describe("Feature: mejor-ruta, Property 5: Quantity sizing invariant", () => {
  it("quantityScu respects ship cargo, supply, demand; buyValue respects investment", () => {
    fc.assert(
      fc.property(
        uniquePriceListArb,
        fc.integer({ min: 0, max: 1000 }), // shipCargoScu (incl. 0)
        // investment: bias toward small values (incl. < one unit's buy price)
        fc.oneof(
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 1, max: 1_000_000 }),
        ),
        (prices, shipCargoScu, investment) => {
          const routes = buildCandidateRoutes(prices, shipCargoScu, investment);

          for (const route of routes) {
            // Identify the exact buy/sell records this route was built from
            // (unique by commodity + terminal in the generated input).
            const buyRecord = prices.find(
              (r) =>
                r.id_commodity === route.commodityId &&
                r.id_terminal === route.buyTerminalId,
            );
            const sellRecord = prices.find(
              (r) =>
                r.id_commodity === route.commodityId &&
                r.id_terminal === route.sellTerminalId,
            );

            expect(buyRecord).toBeDefined();
            expect(sellRecord).toBeDefined();

            // Requirement 3.3: quantity does not exceed ship cargo capacity.
            expect(route.quantityScu).toBeLessThanOrEqual(shipCargoScu);

            // Requirement 3.7: quantity does not exceed available supply at the
            // buy terminal nor available demand at the sell terminal.
            expect(route.quantityScu).toBeLessThanOrEqual(buyRecord!.scu_buy);
            expect(route.quantityScu).toBeLessThanOrEqual(sellRecord!.scu_sell);

            // Requirement 3.4: buy value does not exceed the investment.
            expect(route.buyValue).toBeLessThanOrEqual(investment);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
