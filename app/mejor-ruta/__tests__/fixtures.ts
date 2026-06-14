import type {
  ApiCommodity,
  ApiPriceRecord,
  ApiVehicle,
  MarketData,
  TerminalMeta,
  TradeRoute,
} from "../types";

/**
 * Shared example fixtures for the Mejor Ruta component/rendering tests
 * (task 8.4). These are example-based fixtures (NOT property generators):
 * each factory returns a fully-populated, valid object with sensible defaults
 * that individual tests override as needed.
 */

/** Build a complete {@link ApiPriceRecord} with overridable fields. */
export function makePriceRecord(
  overrides: Partial<ApiPriceRecord> = {},
): ApiPriceRecord {
  return {
    id: 1,
    id_commodity: 1,
    id_terminal: 10,
    id_star_system: 1,
    id_planet: 1,
    id_orbit: 1,
    id_moon: 0,
    id_city: 0,
    id_outpost: 0,
    id_poi: 0,
    id_faction: 0,
    price_buy: 100,
    price_sell: 0,
    scu_buy: 1000,
    scu_buy_max: 1000,
    scu_sell: 0,
    scu_sell_max: 0,
    commodity_name: "Quantanium",
    commodity_slug: "quantanium",
    star_system_name: "Stanton",
    planet_name: "Crusader",
    orbit_name: null,
    moon_name: null,
    space_station_name: "Port Olisar",
    outpost_name: null,
    city_name: null,
    terminal_name: "Port Olisar",
    terminal_slug: "port-olisar",
    terminal_code: "PO",
    game_version: "4.0",
    date_modified: 0,
    ...overrides,
  };
}

/** Build a complete {@link ApiCommodity} with overridable fields. */
export function makeCommodity(
  overrides: Partial<ApiCommodity> = {},
): ApiCommodity {
  return {
    id: 1,
    id_parent: null,
    name: "Quantanium",
    code: "QUAN",
    slug: "quantanium",
    kind: "Metal",
    weight_scu: 1,
    price_buy: 100,
    price_sell: 150,
    is_available: 1,
    is_available_live: 1,
    is_visible: 1,
    ...overrides,
  };
}

/** Build a complete {@link ApiVehicle} with overridable fields. */
export function makeVehicle(overrides: Partial<ApiVehicle> = {}): ApiVehicle {
  return {
    id: 1,
    name: "Caterpillar",
    scu: 576,
    is_spaceship: 1,
    ...overrides,
  };
}

/** Build a complete {@link TerminalMeta} with overridable fields. */
export function makeTerminal(
  overrides: Partial<TerminalMeta> = {},
): TerminalMeta {
  return {
    id: 10,
    name: "Port Olisar",
    securityLevel: 2,
    isHidden: false,
    factionId: null,
    factionName: null,
    ...overrides,
  };
}

/** Build a complete {@link TradeRoute} with overridable fields. */
export function makeRoute(overrides: Partial<TradeRoute> = {}): TradeRoute {
  return {
    commodityId: 1,
    commodityName: "Quantanium",
    commodityTypeId: null,
    buyTerminalId: 10,
    buyTerminalName: "Port Olisar",
    sellTerminalId: 20,
    sellTerminalName: "Area18 TDD",
    factionId: null,
    quantityScu: 100,
    buyValue: 10000,
    sellValue: 15000,
    profit: 5000,
    stops: 1,
    requiresWaitTimer: false,
    boxSizesScu: [1, 2, 4],
    securityLevel: 2,
    includesHiddenLocation: false,
    ...overrides,
  };
}

/**
 * Build a {@link MarketData} object whose critical datasets (prices, vehicles)
 * are non-empty by default, so RouteFinder renders the full UI rather than the
 * market-data error.
 */
export function makeMarket(overrides: Partial<MarketData> = {}): MarketData {
  return {
    commodities: [
      makeCommodity({ id: 1, name: "Quantanium" }),
      makeCommodity({ id: 2, name: "Laranite", id_parent: 1 }),
    ],
    prices: [
      makePriceRecord({
        id: 1,
        id_commodity: 1,
        id_terminal: 10,
        terminal_name: "Port Olisar",
        price_buy: 100,
        price_sell: 0,
        scu_buy: 1000,
        scu_sell: 0,
      }),
      makePriceRecord({
        id: 2,
        id_commodity: 1,
        id_terminal: 20,
        terminal_name: "Area18 TDD",
        price_buy: 0,
        price_sell: 150,
        scu_buy: 0,
        scu_sell: 1000,
      }),
    ],
    terminals: [
      makeTerminal({ id: 10, name: "Port Olisar", securityLevel: 2 }),
      makeTerminal({ id: 20, name: "Area18 TDD", securityLevel: 3 }),
    ],
    vehicles: [
      makeVehicle({ id: 1, name: "Caterpillar", scu: 576 }),
      makeVehicle({ id: 2, name: "Freelancer", scu: 66 }),
    ],
    ...overrides,
  };
}
