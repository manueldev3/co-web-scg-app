import { describe, it, expect } from "vitest";
import { separateRecords } from "../utils";
import { ApiPriceRecord } from "../types";

/**
 * Unit tests for detail components data flow.
 *
 * Validates: Requirements 4.4, 5.4
 *
 * These tests verify the data transformation that drives the empty/non-empty
 * state of the sellers and buyers tables in DetalleMercancia.
 */

function makeRecord(overrides: Partial<ApiPriceRecord> = {}): ApiPriceRecord {
  return {
    id: 1,
    id_commodity: 100,
    id_terminal: 200,
    id_star_system: 1,
    id_planet: 2,
    id_orbit: 3,
    id_moon: 0,
    id_city: 4,
    id_outpost: 0,
    id_poi: 0,
    id_faction: 1,
    price_buy: 0,
    price_sell: 0,
    scu_buy: 0,
    scu_buy_max: 0,
    scu_sell: 0,
    scu_sell_max: 0,
    commodity_name: "Laranite",
    commodity_slug: "laranite",
    star_system_name: "Stanton",
    planet_name: "ArcCorp",
    orbit_name: null,
    moon_name: null,
    city_name: "Area18",
    space_station_name: null,
    outpost_name: null,
    terminal_name: "TDD",
    terminal_slug: "tdd",
    terminal_code: "TDD",
    game_version: "4.0",
    date_modified: 1700000000,
    ...overrides,
  };
}

describe("Detail components: separateRecords empty states", () => {
  /**
   * Validates: Requirement 4.4
   * WHEN no terminals have price_buy > 0, the sellers array is empty,
   * which causes the UI to show "No hay terminales que vendan esta mercancía"
   */
  it("commodity without sellers (all price_buy = 0) produces empty sellers array", () => {
    const records: ApiPriceRecord[] = [
      makeRecord({
        id: 1,
        price_buy: 0,
        price_sell: 10.5,
        scu_sell: 200,
        scu_sell_max: 1000,
      }),
      makeRecord({
        id: 2,
        price_buy: 0,
        price_sell: 8.75,
        scu_sell: 150,
        scu_sell_max: 800,
      }),
      makeRecord({
        id: 3,
        price_buy: 0,
        price_sell: 12.0,
        scu_sell: 300,
        scu_sell_max: 1500,
      }),
    ];

    const { sellers, buyers } = separateRecords(records);

    expect(sellers).toHaveLength(0);
    expect(buyers).toHaveLength(3);
  });

  /**
   * Validates: Requirement 5.4
   * WHEN no terminals have price_sell > 0, the buyers array is empty,
   * which causes the UI to show "No hay terminales que compren esta mercancía"
   */
  it("commodity without buyers (all price_sell = 0) produces empty buyers array", () => {
    const records: ApiPriceRecord[] = [
      makeRecord({
        id: 1,
        price_buy: 5.5,
        price_sell: 0,
        scu_buy: 100,
        scu_buy_max: 500,
      }),
      makeRecord({
        id: 2,
        price_buy: 3.25,
        price_sell: 0,
        scu_buy: 200,
        scu_buy_max: 1000,
      }),
      makeRecord({
        id: 3,
        price_buy: 7.0,
        price_sell: 0,
        scu_buy: 50,
        scu_buy_max: 250,
      }),
    ];

    const { sellers, buyers } = separateRecords(records);

    expect(buyers).toHaveLength(0);
    expect(sellers).toHaveLength(3);
  });
});

describe("Detail components: separateRecords with valid mixed data", () => {
  /**
   * Validates: Requirements 4.4, 5.4
   * Valid data with mixed sellers and buyers produces correct arrays
   * with proper field mapping for each type.
   */
  it("valid mixed data produces correct sellers and buyers with proper field mapping", () => {
    const records: ApiPriceRecord[] = [
      makeRecord({
        id: 1,
        terminal_name: "TDD ArcCorp",
        price_buy: 5.5,
        price_sell: 0,
        scu_buy: 100,
        scu_buy_max: 500,
        scu_sell: 0,
        scu_sell_max: 0,
        star_system_name: "Stanton",
        planet_name: "ArcCorp",
        city_name: "Area18",
        orbit_name: null,
        moon_name: null,
        space_station_name: null,
        outpost_name: null,
      }),
      makeRecord({
        id: 2,
        terminal_name: "Admin Office Lorville",
        price_buy: 0,
        price_sell: 12.75,
        scu_buy: 0,
        scu_buy_max: 0,
        scu_sell: 300,
        scu_sell_max: 1500,
        star_system_name: "Stanton",
        planet_name: "Hurston",
        city_name: "Lorville",
        orbit_name: null,
        moon_name: null,
        space_station_name: null,
        outpost_name: null,
      }),
      makeRecord({
        id: 3,
        terminal_name: "CRU-L1 Station",
        price_buy: 4.25,
        price_sell: 11.0,
        scu_buy: 200,
        scu_buy_max: 1000,
        scu_sell: 150,
        scu_sell_max: 800,
        star_system_name: "Stanton",
        planet_name: "Crusader",
        orbit_name: "CRU-L1",
        city_name: null,
        moon_name: null,
        space_station_name: null,
        outpost_name: null,
      }),
    ];

    const { sellers, buyers } = separateRecords(records);

    // Sellers: records with price_buy > 0 (ids 1 and 3)
    expect(sellers).toHaveLength(2);

    // Sellers sorted by price_buy ASC: id 3 (4.25) then id 1 (5.5)
    expect(sellers[0].id).toBe(3);
    expect(sellers[0].terminalName).toBe("CRU-L1 Station");
    expect(sellers[0].price).toBe(4.25);
    expect(sellers[0].stockAvailable).toBe(200);
    expect(sellers[0].stockMax).toBe(1000);
    expect(sellers[0].location).toBe("Stanton > Crusader > CRU-L1");

    expect(sellers[1].id).toBe(1);
    expect(sellers[1].terminalName).toBe("TDD ArcCorp");
    expect(sellers[1].price).toBe(5.5);
    expect(sellers[1].stockAvailable).toBe(100);
    expect(sellers[1].stockMax).toBe(500);
    expect(sellers[1].location).toBe("Stanton > ArcCorp > Area18");

    // Buyers: records with price_sell > 0 (ids 2 and 3)
    expect(buyers).toHaveLength(2);

    // Buyers sorted by price_sell DESC: id 2 (12.75) then id 3 (11.0)
    expect(buyers[0].id).toBe(2);
    expect(buyers[0].terminalName).toBe("Admin Office Lorville");
    expect(buyers[0].price).toBe(12.75);
    expect(buyers[0].stockAvailable).toBe(300);
    expect(buyers[0].stockMax).toBe(1500);
    expect(buyers[0].location).toBe("Stanton > Hurston > Lorville");

    expect(buyers[1].id).toBe(3);
    expect(buyers[1].terminalName).toBe("CRU-L1 Station");
    expect(buyers[1].price).toBe(11.0);
    expect(buyers[1].stockAvailable).toBe(150);
    expect(buyers[1].stockMax).toBe(800);
    expect(buyers[1].location).toBe("Stanton > Crusader > CRU-L1");
  });
});
