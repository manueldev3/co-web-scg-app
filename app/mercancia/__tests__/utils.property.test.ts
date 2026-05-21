import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { separateRecords } from "../utils";
import { ApiPriceRecord } from "../types";

/**
 * Feature: commodity-detail-view, Property 1: Separación correcta de registros
 *
 * Validates: Requirements 2.2, 4.1, 5.1
 *
 * For any list of API price records, separateRecords must produce two lists where:
 * (a) all records in sellers have price_buy > 0
 * (b) all records in buyers have price_sell > 0
 * (c) no record with price_buy > 0 is missing from sellers
 * (d) no record with price_sell > 0 is missing from buyers
 */

/** Arbitrary that generates valid ApiPriceRecord objects with random price_buy and price_sell (including 0) */
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

describe("Feature: commodity-detail-view, Property 1: Separación correcta de registros", () => {
  it("all records in sellers have price > 0 (price_buy > 0 in original)", () => {
    fc.assert(
      fc.property(fc.array(apiPriceRecordArb, { maxLength: 50 }), (records) => {
        const { sellers } = separateRecords(records);
        for (const seller of sellers) {
          expect(seller.price).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("all records in buyers have price > 0 (price_sell > 0 in original)", () => {
    fc.assert(
      fc.property(fc.array(apiPriceRecordArb, { maxLength: 50 }), (records) => {
        const { buyers } = separateRecords(records);
        for (const buyer of buyers) {
          expect(buyer.price).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("no record with price_buy > 0 is missing from sellers", () => {
    fc.assert(
      fc.property(fc.array(apiPriceRecordArb, { maxLength: 50 }), (records) => {
        const { sellers } = separateRecords(records);
        const sellerIds = new Set(sellers.map((s) => s.id));
        const expectedSellerIds = records
          .filter((r) => r.price_buy > 0)
          .map((r) => r.id);
        for (const id of expectedSellerIds) {
          expect(sellerIds.has(id)).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("no record with price_sell > 0 is missing from buyers", () => {
    fc.assert(
      fc.property(fc.array(apiPriceRecordArb, { maxLength: 50 }), (records) => {
        const { buyers } = separateRecords(records);
        const buyerIds = new Set(buyers.map((b) => b.id));
        const expectedBuyerIds = records
          .filter((r) => r.price_sell > 0)
          .map((r) => r.id);
        for (const id of expectedBuyerIds) {
          expect(buyerIds.has(id)).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });
});
