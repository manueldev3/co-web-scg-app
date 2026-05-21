import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { separateRecords } from "../utils";
import { ApiPriceRecord } from "../types";

/**
 * Feature: commodity-detail-view, Property 5: Ordenamiento correcto de registros
 *
 * Validates: Requirements 4.3, 5.3
 *
 * For any list of terminal records:
 * (a) sellers are sorted by price in ascending order (each element's price <= next element's price)
 * (b) buyers are sorted by price in descending order (each element's price >= next element's price)
 */

/** Arbitrary that generates valid ApiPriceRecord objects with random prices (some > 0 for meaningful data) */
const apiPriceRecordArb: fc.Arbitrary<ApiPriceRecord> = fc.record({
  id: fc.nat(),
  id_commodity: fc.nat(),
  id_terminal: fc.nat(),
  id_star_system: fc.nat(),
  id_planet: fc.nat(),
  id_orbit: fc.nat(),
  id_moon: fc.nat(),
  id_city: fc.nat(),
  id_outpost: fc.nat(),
  id_poi: fc.nat(),
  id_faction: fc.nat(),
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

describe("Feature: commodity-detail-view, Property 5: Ordenamiento correcto de registros", () => {
  it("sellers are sorted by price in ascending order (price_buy ASC)", () => {
    fc.assert(
      fc.property(fc.array(apiPriceRecordArb, { maxLength: 50 }), (records) => {
        const { sellers } = separateRecords(records);
        for (let i = 0; i < sellers.length - 1; i++) {
          expect(sellers[i].price).toBeLessThanOrEqual(sellers[i + 1].price);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("buyers are sorted by price in descending order (price_sell DESC)", () => {
    fc.assert(
      fc.property(fc.array(apiPriceRecordArb, { maxLength: 50 }), (records) => {
        const { buyers } = separateRecords(records);
        for (let i = 0; i < buyers.length - 1; i++) {
          expect(buyers[i].price).toBeGreaterThanOrEqual(buyers[i + 1].price);
        }
      }),
      { numRuns: 100 },
    );
  });
});
