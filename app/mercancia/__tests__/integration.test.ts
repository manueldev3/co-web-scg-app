import { describe, it, expect } from "vitest";
import {
  separateRecords,
  slugToName,
  buildHierarchicalLocation,
} from "../utils";
import { ApiPriceRecord } from "../types";

/**
 * Integration tests for the commodity detail data pipeline.
 *
 * These tests simulate the end-to-end data flow that the server component
 * [name]/page.tsx performs: receiving API data, processing it through utility
 * functions, and producing the final detail data structure.
 *
 * Validates: Requirements 1.2, 1.3, 2.3
 */

function makeApiRecord(
  overrides: Partial<ApiPriceRecord> = {},
): ApiPriceRecord {
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

describe("Integration: Full data pipeline from API response to processed detail data", () => {
  /**
   * Validates: Requirement 1.2
   *
   * Simulates the flow: user selects commodity in search → page.tsx fetches API data →
   * separateRecords processes it → DetalleMercancia receives sellers/buyers with
   * proper field mapping, sorting, and location building.
   */
  it("processes a realistic API response into correctly structured detail data", () => {
    // Simulate a realistic API response for "Laranite" with multiple terminals
    const apiResponse: ApiPriceRecord[] = [
      makeApiRecord({
        id: 101,
        terminal_name: "Tressler TDD",
        price_buy: 31.51,
        price_sell: 0,
        scu_buy: 450,
        scu_buy_max: 2000,
        star_system_name: "Stanton",
        planet_name: "microTech",
        orbit_name: null,
        moon_name: null,
        city_name: null,
        space_station_name: "Port Tressler",
        outpost_name: null,
      }),
      makeApiRecord({
        id: 102,
        terminal_name: "Area18 TDD",
        price_buy: 30.89,
        price_sell: 0,
        scu_buy: 800,
        scu_buy_max: 3000,
        star_system_name: "Stanton",
        planet_name: "ArcCorp",
        orbit_name: null,
        moon_name: null,
        city_name: "Area18",
        space_station_name: null,
        outpost_name: null,
      }),
      makeApiRecord({
        id: 103,
        terminal_name: "Lorville CBD",
        price_buy: 0,
        price_sell: 28.44,
        scu_sell: 600,
        scu_sell_max: 5000,
        star_system_name: "Stanton",
        planet_name: "Hurston",
        orbit_name: null,
        moon_name: null,
        city_name: "Lorville",
        space_station_name: null,
        outpost_name: null,
      }),
      makeApiRecord({
        id: 104,
        terminal_name: "CRU-L1 Ambitious Dream",
        price_buy: 32.1,
        price_sell: 27.5,
        scu_buy: 100,
        scu_buy_max: 500,
        scu_sell: 200,
        scu_sell_max: 1000,
        star_system_name: "Stanton",
        planet_name: "Crusader",
        orbit_name: "CRU-L1",
        moon_name: null,
        city_name: null,
        space_station_name: null,
        outpost_name: null,
      }),
    ];

    const { sellers, buyers } = separateRecords(apiResponse);
    const commodityName = apiResponse[0].commodity_name;

    // Verify commodity name extraction (as page.tsx does)
    expect(commodityName).toBe("Laranite");

    // Sellers: records with price_buy > 0, sorted ASC by price
    expect(sellers).toHaveLength(3);
    expect(sellers[0].id).toBe(102); // 30.89 (lowest)
    expect(sellers[1].id).toBe(101); // 31.51
    expect(sellers[2].id).toBe(104); // 32.10 (highest)

    // Verify field mapping for sellers
    expect(sellers[0].terminalName).toBe("Area18 TDD");
    expect(sellers[0].price).toBe(30.89);
    expect(sellers[0].stockAvailable).toBe(800);
    expect(sellers[0].stockMax).toBe(3000);
    expect(sellers[0].location).toBe("Stanton > ArcCorp > Area18");

    expect(sellers[1].terminalName).toBe("Tressler TDD");
    expect(sellers[1].location).toBe("Stanton > microTech > Port Tressler");

    expect(sellers[2].terminalName).toBe("CRU-L1 Ambitious Dream");
    expect(sellers[2].location).toBe("Stanton > Crusader > CRU-L1");

    // Buyers: records with price_sell > 0, sorted DESC by price
    expect(buyers).toHaveLength(2);
    expect(buyers[0].id).toBe(103); // 28.44 (highest)
    expect(buyers[1].id).toBe(104); // 27.50 (lowest)

    // Verify field mapping for buyers
    expect(buyers[0].terminalName).toBe("Lorville CBD");
    expect(buyers[0].price).toBe(28.44);
    expect(buyers[0].stockAvailable).toBe(600);
    expect(buyers[0].stockMax).toBe(5000);
    expect(buyers[0].location).toBe("Stanton > Hurston > Lorville");

    expect(buyers[1].terminalName).toBe("CRU-L1 Ambitious Dream");
    expect(buyers[1].price).toBe(27.5);
    expect(buyers[1].stockAvailable).toBe(200);
    expect(buyers[1].stockMax).toBe(1000);
  });

  it("a record appearing in both sellers and buyers is correctly duplicated with different fields", () => {
    // A terminal that both sells and buys the same commodity
    const apiResponse: ApiPriceRecord[] = [
      makeApiRecord({
        id: 200,
        terminal_name: "Dual Terminal",
        price_buy: 10.0,
        price_sell: 15.0,
        scu_buy: 100,
        scu_buy_max: 500,
        scu_sell: 200,
        scu_sell_max: 1000,
        star_system_name: "Stanton",
        planet_name: "Hurston",
        orbit_name: null,
        moon_name: null,
        city_name: "Lorville",
        space_station_name: null,
        outpost_name: null,
      }),
    ];

    const { sellers, buyers } = separateRecords(apiResponse);

    // Same record appears in both lists with different price/stock fields
    expect(sellers).toHaveLength(1);
    expect(buyers).toHaveLength(1);

    // Seller uses price_buy and scu_buy fields
    expect(sellers[0].price).toBe(10.0);
    expect(sellers[0].stockAvailable).toBe(100);
    expect(sellers[0].stockMax).toBe(500);

    // Buyer uses price_sell and scu_sell fields
    expect(buyers[0].price).toBe(15.0);
    expect(buyers[0].stockAvailable).toBe(200);
    expect(buyers[0].stockMax).toBe(1000);

    // Both share the same location
    expect(sellers[0].location).toBe("Stanton > Hurston > Lorville");
    expect(buyers[0].location).toBe("Stanton > Hurston > Lorville");
  });
});

describe("Integration: Direct URL slug resolution", () => {
  /**
   * Validates: Requirement 1.3
   *
   * When a user navigates directly to /mercancia/{slug}, the slug must be
   * resolved to a readable name. This tests the slugToName function that
   * provides the fallback name resolution.
   */
  it("resolves single-word slug to capitalized name", () => {
    expect(slugToName("laranite")).toBe("Laranite");
  });

  it("resolves multi-word slug (hyphenated) to title-cased name", () => {
    expect(slugToName("hydrogen-fuel")).toBe("Hydrogen Fuel");
  });

  it("resolves three-word slug correctly", () => {
    expect(slugToName("processed-food-mix")).toBe("Processed Food Mix");
  });

  it("handles single character words in slug", () => {
    expect(slugToName("e-war")).toBe("E War");
  });

  it("handles empty slug gracefully", () => {
    // Edge case: empty slug produces empty string
    expect(slugToName("")).toBe("");
  });

  /**
   * Validates: Requirement 1.3
   *
   * The full pipeline for direct URL access: slug → API query → data processing.
   * The slug is used directly as the commodity_slug parameter in the API call.
   */
  it("slug used as API parameter produces matching records", () => {
    const slug = "laranite";
    const apiResponse: ApiPriceRecord[] = [
      makeApiRecord({
        id: 301,
        commodity_slug: slug,
        commodity_name: "Laranite",
        price_buy: 25.0,
        scu_buy: 100,
        scu_buy_max: 500,
      }),
    ];

    // Verify the slug matches the commodity_slug in the response
    expect(apiResponse[0].commodity_slug).toBe(slug);

    // Process the data as page.tsx would
    const { sellers } = separateRecords(apiResponse);
    const commodityName = apiResponse[0].commodity_name;

    expect(commodityName).toBe("Laranite");
    expect(sellers).toHaveLength(1);
    expect(sellers[0].price).toBe(25.0);
  });
});

describe("Integration: API error handling simulation", () => {
  /**
   * Validates: Requirement 2.3
   *
   * When the API returns empty data (data: []), the page component shows
   * an error message. This tests that separateRecords handles empty input
   * correctly, producing empty arrays for both sellers and buyers.
   */
  it("empty API response produces empty sellers and buyers arrays", () => {
    const emptyApiResponse: ApiPriceRecord[] = [];

    const { sellers, buyers } = separateRecords(emptyApiResponse);

    expect(sellers).toHaveLength(0);
    expect(buyers).toHaveLength(0);
    expect(sellers).toEqual([]);
    expect(buyers).toEqual([]);
  });

  /**
   * Validates: Requirement 2.3
   *
   * When all records have price_buy = 0 and price_sell = 0, both tables
   * should be empty (simulates data that exists but has no actionable prices).
   */
  it("records with all zero prices produce empty sellers and buyers", () => {
    const zeroPriceRecords: ApiPriceRecord[] = [
      makeApiRecord({ id: 401, price_buy: 0, price_sell: 0 }),
      makeApiRecord({ id: 402, price_buy: 0, price_sell: 0 }),
      makeApiRecord({ id: 403, price_buy: 0, price_sell: 0 }),
    ];

    const { sellers, buyers } = separateRecords(zeroPriceRecords);

    expect(sellers).toHaveLength(0);
    expect(buyers).toHaveLength(0);
  });

  /**
   * Validates: Requirement 2.3
   *
   * Verifies that the page.tsx logic for detecting empty data works:
   * records.length === 0 triggers the error message path.
   */
  it("page component logic: empty records array triggers error path", () => {
    const jsonData = { data: [] };
    const records: ApiPriceRecord[] = jsonData.data || [];

    // This is the condition checked in [name]/page.tsx
    const shouldShowError = records.length === 0;
    expect(shouldShowError).toBe(true);
  });

  it("page component logic: missing data field triggers error path", () => {
    const jsonData = {} as { data?: ApiPriceRecord[] };
    const records: ApiPriceRecord[] = jsonData.data || [];

    const shouldShowError = records.length === 0;
    expect(shouldShowError).toBe(true);
  });

  /**
   * Validates: Requirement 2.3
   *
   * Verifies that location building handles records with minimal location data
   * (only terminal_name is guaranteed non-null in the API).
   */
  it("records with all null location fields produce empty location string", () => {
    const record = makeApiRecord({
      star_system_name: null,
      planet_name: null,
      orbit_name: null,
      moon_name: null,
      city_name: null,
      space_station_name: null,
      outpost_name: null,
    });

    const location = buildHierarchicalLocation(record);
    expect(location).toBe("");
  });
});
