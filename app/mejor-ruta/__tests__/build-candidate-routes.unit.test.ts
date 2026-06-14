import { describe, it, expect } from "vitest";
import { buildCandidateRoutes } from "../route-engine";
import type { ApiPriceRecord } from "../types";

/**
 * Unit tests for `buildCandidateRoutes` (Route_Engine).
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.7
 *
 * Example-based tests (NOT property-based). They assert exact quantity, buy
 * value, sell value, and profit for hand-worked examples, plus degenerate
 * inputs that must produce no routes:
 *   - no profitable pair (sell price <= buy price)
 *   - zero supply at the buy terminal (scu_buy = 0)
 *   - zero demand at the sell terminal (scu_sell = 0)
 *   - the buy and sell terminal are the same terminal
 *   - the investment is too small to afford a single unit
 *
 * The sizing rule under test:
 *   qty = floor(min(shipCargoScu, investment / price_buy, scu_buy, scu_sell))
 *   buyValue  = qty * price_buy
 *   sellValue = qty * price_sell
 *   profit    = sellValue - buyValue
 */

/**
 * Builds a complete `ApiPriceRecord` from partial overrides. Defaults make a
 * record that is neither a buy nor a sell candidate (both prices 0) so each
 * test opts in to exactly the fields it cares about.
 */
function makeRecord(overrides: Partial<ApiPriceRecord>): ApiPriceRecord {
  return {
    id: 1,
    id_commodity: 100,
    id_terminal: 1,
    id_star_system: 0,
    id_planet: 0,
    id_orbit: 0,
    id_moon: 0,
    id_city: 0,
    id_outpost: 0,
    id_poi: 0,
    id_faction: 0,
    price_buy: 0,
    price_sell: 0,
    scu_buy: 0,
    scu_buy_max: 0,
    scu_sell: 0,
    scu_sell_max: 0,
    commodity_name: "Test Commodity",
    commodity_slug: "test-commodity",
    star_system_name: null,
    planet_name: null,
    orbit_name: null,
    moon_name: null,
    space_station_name: null,
    outpost_name: null,
    city_name: null,
    terminal_name: "Terminal",
    terminal_slug: "terminal",
    terminal_code: "TRM",
    game_version: "1.0",
    date_modified: 0,
    ...overrides,
  };
}

describe("buildCandidateRoutes", () => {
  it("computes exact qty/values/profit for a worked example (ship is the binding constraint)", () => {
    // Buy terminal A: buys from player at 100 UEC/SCU, supply 50 SCU.
    const buyTerminal = makeRecord({
      id: 1,
      id_terminal: 1,
      id_commodity: 100,
      id_faction: 5,
      price_buy: 100,
      scu_buy: 50,
      terminal_name: "Terminal A",
    });
    // Sell terminal B: sells back to player at 150 UEC/SCU, demand 40 SCU.
    const sellTerminal = makeRecord({
      id: 2,
      id_terminal: 2,
      id_commodity: 100,
      price_sell: 150,
      scu_sell: 40,
      terminal_name: "Terminal B",
    });

    const shipCargoScu = 30;
    const investment = 10000;

    const routes = buildCandidateRoutes(
      [buyTerminal, sellTerminal],
      shipCargoScu,
      investment,
    );

    expect(routes).toHaveLength(1);
    const route = routes[0];

    // qty = floor(min(30, 10000/100=100, 50, 40)) = 30  -> ship cargo binds.
    expect(route.quantityScu).toBe(30);
    expect(route.buyValue).toBe(3000); // 30 * 100
    expect(route.sellValue).toBe(4500); // 30 * 150
    expect(route.profit).toBe(1500); // 4500 - 3000

    // Structure: same commodity, two different terminals (Requirement 3.1).
    expect(route.commodityId).toBe(100);
    expect(route.buyTerminalId).toBe(1);
    expect(route.sellTerminalId).toBe(2);
    expect(route.buyTerminalName).toBe("Terminal A");
    expect(route.sellTerminalName).toBe("Terminal B");
    expect(route.factionId).toBe(5); // taken from buy terminal id_faction
    expect(route.stops).toBe(1);
  });

  it("caps quantity by the investment when capital is the binding constraint", () => {
    const buyTerminal = makeRecord({
      id: 1,
      id_terminal: 1,
      price_buy: 100,
      scu_buy: 50,
    });
    const sellTerminal = makeRecord({
      id: 2,
      id_terminal: 2,
      price_sell: 150,
      scu_sell: 40,
    });

    // investment / price_buy = 500 / 100 = 5  -> investment binds.
    const routes = buildCandidateRoutes([buyTerminal, sellTerminal], 100, 500);

    expect(routes).toHaveLength(1);
    expect(routes[0].quantityScu).toBe(5);
    expect(routes[0].buyValue).toBe(500);
    expect(routes[0].sellValue).toBe(750);
    expect(routes[0].profit).toBe(250);
    // buyValue never exceeds the investment (Requirement 3.4).
    expect(routes[0].buyValue).toBeLessThanOrEqual(500);
  });

  it("caps quantity by available supply at the buy terminal (Requirement 3.7)", () => {
    const buyTerminal = makeRecord({
      id: 1,
      id_terminal: 1,
      price_buy: 100,
      scu_buy: 10, // supply binds
    });
    const sellTerminal = makeRecord({
      id: 2,
      id_terminal: 2,
      price_sell: 150,
      scu_sell: 40,
    });

    const routes = buildCandidateRoutes(
      [buyTerminal, sellTerminal],
      100,
      10000,
    );

    expect(routes).toHaveLength(1);
    expect(routes[0].quantityScu).toBe(10);
    expect(routes[0].profit).toBe(500); // 10 * (150 - 100)
  });

  it("caps quantity by available demand at the sell terminal (Requirement 3.7)", () => {
    const buyTerminal = makeRecord({
      id: 1,
      id_terminal: 1,
      price_buy: 100,
      scu_buy: 50,
    });
    const sellTerminal = makeRecord({
      id: 2,
      id_terminal: 2,
      price_sell: 150,
      scu_sell: 7, // demand binds
    });

    const routes = buildCandidateRoutes(
      [buyTerminal, sellTerminal],
      100,
      10000,
    );

    expect(routes).toHaveLength(1);
    expect(routes[0].quantityScu).toBe(7);
    expect(routes[0].profit).toBe(350); // 7 * (150 - 100)
  });

  it("floors fractional quantities down to whole SCU", () => {
    const buyTerminal = makeRecord({
      id: 1,
      id_terminal: 1,
      price_buy: 100,
      scu_buy: 50,
    });
    const sellTerminal = makeRecord({
      id: 2,
      id_terminal: 2,
      price_sell: 150,
      scu_sell: 40,
    });

    // investment / price_buy = 1250 / 100 = 12.5 -> floor to 12.
    const routes = buildCandidateRoutes([buyTerminal, sellTerminal], 100, 1250);

    expect(routes).toHaveLength(1);
    expect(routes[0].quantityScu).toBe(12);
    expect(routes[0].buyValue).toBe(1200);
    expect(routes[0].sellValue).toBe(1800);
    expect(routes[0].profit).toBe(600);
  });

  it("normalizes a zero buy-terminal faction id to null", () => {
    const buyTerminal = makeRecord({
      id: 1,
      id_terminal: 1,
      id_faction: 0,
      price_buy: 100,
      scu_buy: 50,
    });
    const sellTerminal = makeRecord({
      id: 2,
      id_terminal: 2,
      price_sell: 150,
      scu_sell: 40,
    });

    const routes = buildCandidateRoutes([buyTerminal, sellTerminal], 30, 10000);

    expect(routes).toHaveLength(1);
    expect(routes[0].factionId).toBeNull();
  });

  // --- Degenerate cases: each must yield no routes ---

  it("produces no route when the sell price does not exceed the buy price", () => {
    const buyTerminal = makeRecord({
      id: 1,
      id_terminal: 1,
      price_buy: 150,
      scu_buy: 50,
    });
    const sellTerminal = makeRecord({
      id: 2,
      id_terminal: 2,
      price_sell: 100, // lower than buy price -> not profitable
      scu_sell: 40,
    });

    expect(
      buildCandidateRoutes([buyTerminal, sellTerminal], 30, 10000),
    ).toEqual([]);
  });

  it("produces no route when sell price equals buy price (zero margin)", () => {
    const buyTerminal = makeRecord({
      id: 1,
      id_terminal: 1,
      price_buy: 100,
      scu_buy: 50,
    });
    const sellTerminal = makeRecord({
      id: 2,
      id_terminal: 2,
      price_sell: 100, // equal -> no profit
      scu_sell: 40,
    });

    expect(
      buildCandidateRoutes([buyTerminal, sellTerminal], 30, 10000),
    ).toEqual([]);
  });

  it("produces no route when there is zero supply at the buy terminal", () => {
    const buyTerminal = makeRecord({
      id: 1,
      id_terminal: 1,
      price_buy: 100,
      scu_buy: 0, // no supply -> qty 0
    });
    const sellTerminal = makeRecord({
      id: 2,
      id_terminal: 2,
      price_sell: 150,
      scu_sell: 40,
    });

    expect(
      buildCandidateRoutes([buyTerminal, sellTerminal], 30, 10000),
    ).toEqual([]);
  });

  it("produces no route when there is zero demand at the sell terminal", () => {
    const buyTerminal = makeRecord({
      id: 1,
      id_terminal: 1,
      price_buy: 100,
      scu_buy: 50,
    });
    const sellTerminal = makeRecord({
      id: 2,
      id_terminal: 2,
      price_sell: 150,
      scu_sell: 0, // no demand -> qty 0
    });

    expect(
      buildCandidateRoutes([buyTerminal, sellTerminal], 30, 10000),
    ).toEqual([]);
  });

  it("produces no route when buy and sell happen at the same terminal", () => {
    // A single terminal that both buys and sells the commodity.
    const sameTerminal = makeRecord({
      id: 1,
      id_terminal: 1,
      price_buy: 100,
      price_sell: 150,
      scu_buy: 50,
      scu_sell: 50,
    });

    expect(buildCandidateRoutes([sameTerminal], 30, 10000)).toEqual([]);
  });

  it("produces no route when the investment cannot afford a single unit", () => {
    const buyTerminal = makeRecord({
      id: 1,
      id_terminal: 1,
      price_buy: 100,
      scu_buy: 50,
    });
    const sellTerminal = makeRecord({
      id: 2,
      id_terminal: 2,
      price_sell: 150,
      scu_sell: 40,
    });

    // investment / price_buy = 50 / 100 = 0.5 -> floor 0 -> no route.
    expect(buildCandidateRoutes([buyTerminal, sellTerminal], 30, 50)).toEqual(
      [],
    );
  });

  it("returns no routes for an empty price list", () => {
    expect(buildCandidateRoutes([], 30, 10000)).toEqual([]);
  });

  it("does not pair terminals across different commodities", () => {
    // Buy commodity 100 at terminal 1; sell commodity 200 at terminal 2.
    const buyTerminal = makeRecord({
      id: 1,
      id_terminal: 1,
      id_commodity: 100,
      price_buy: 100,
      scu_buy: 50,
    });
    const sellTerminal = makeRecord({
      id: 2,
      id_terminal: 2,
      id_commodity: 200,
      price_sell: 150,
      scu_sell: 40,
    });

    expect(
      buildCandidateRoutes([buyTerminal, sellTerminal], 30, 10000),
    ).toEqual([]);
  });
});
