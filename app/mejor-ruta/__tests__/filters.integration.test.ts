import { describe, it, expect } from "vitest";
import { computeRoutes, defaultFilters } from "../route-engine";
import type { EngineInput } from "../route-engine";
import type { ApiCommodity, ApiPriceRecord, TerminalMeta } from "../types";

/**
 * Integration check that each Route_Finder filter actually narrows results
 * end-to-end through `computeRoutes` (build → enrich → filter → rank), using a
 * small but representative market that mirrors the shape of the real
 * `/commodities_prices_all` payload (per-terminal prices WITHOUT id_faction or
 * container metadata) plus the commodity catalogue and terminal metadata that
 * carry the enrichment data.
 *
 * This is the concrete "are the filters working?" verification: for every
 * filter we assert the unfiltered run yields routes and the filtered run is a
 * strict, correct subset.
 */

// Two commodities of two different types (id_parent).
const commodities: ApiCommodity[] = [
  {
    id: 1,
    id_parent: 100, // type A (Metal)
    name: "Agricium",
    code: "AGRI",
    slug: "agricium",
    kind: "Metal",
    weight_scu: 1,
    price_buy: 0,
    price_sell: 0,
    is_available: 1,
    is_available_live: 1,
    is_visible: 1,
  },
  {
    id: 2,
    id_parent: 200, // type B (Gas)
    name: "Hydrogen",
    code: "HYDR",
    slug: "hydrogen",
    kind: "Gas",
    weight_scu: 1,
    price_buy: 0,
    price_sell: 0,
    is_available: 1,
    is_available_live: 1,
    is_visible: 1,
  },
];

// Terminals carry faction + hidden flags (security has no source in UEX, so 0).
const terminals: TerminalMeta[] = [
  { id: 10, name: "Buy-A", securityLevel: 0, isHidden: false, factionId: 23, factionName: "UEE" },
  { id: 11, name: "Sell-A", securityLevel: 0, isHidden: false, factionId: 23, factionName: "UEE" },
  { id: 20, name: "Buy-B", securityLevel: 0, isHidden: false, factionId: 9, factionName: "Pyro" },
  { id: 21, name: "Sell-B-hidden", securityLevel: 0, isHidden: true, factionId: 9, factionName: "Pyro" },
];

/** Minimal price row shaped like /commodities_prices_all (no id_faction). */
function price(
  partial: Partial<ApiPriceRecord> & {
    id: number;
    id_commodity: number;
    id_terminal: number;
  },
): ApiPriceRecord {
  return {
    id_star_system: 0,
    id_planet: 0,
    id_orbit: 0,
    id_moon: 0,
    id_city: 0,
    id_outpost: 0,
    id_poi: 0,
    id_faction: 0, // bulk endpoint omits this in practice
    price_buy: 0,
    price_sell: 0,
    scu_buy: 0,
    scu_buy_max: 0,
    scu_sell: 0,
    scu_sell_max: 0,
    commodity_name: "",
    commodity_slug: "",
    star_system_name: null,
    planet_name: null,
    orbit_name: null,
    moon_name: null,
    space_station_name: null,
    outpost_name: null,
    city_name: null,
    terminal_name: "",
    terminal_slug: "",
    terminal_code: "",
    game_version: "1.0",
    date_modified: 0,
    ...partial,
  } as ApiPriceRecord;
}

// Commodity A: buy at terminal 10 (UEE), sell higher at terminal 11 (UEE).
//   container_sizes "1,2,4" only.
// Commodity B: buy at terminal 20 (Pyro), sell higher at terminal 21 (Pyro, hidden).
//   container_sizes "8,16".
const prices: ApiPriceRecord[] = [
  price({ id: 1, id_commodity: 1, id_terminal: 10, price_buy: 100, scu_buy: 1000, commodity_name: "Agricium", terminal_name: "Buy-A", container_sizes: "1,2,4" }),
  price({ id: 2, id_commodity: 1, id_terminal: 11, price_sell: 150, scu_sell: 1000, commodity_name: "Agricium", terminal_name: "Sell-A", container_sizes: "1,2,4" }),
  price({ id: 3, id_commodity: 2, id_terminal: 20, price_buy: 50, scu_buy: 1000, commodity_name: "Hydrogen", terminal_name: "Buy-B", container_sizes: "8,16" }),
  price({ id: 4, id_commodity: 2, id_terminal: 21, price_sell: 90, scu_sell: 1000, commodity_name: "Hydrogen", terminal_name: "Sell-B-hidden", container_sizes: "8,16" }),
];

const baseInput: EngineInput = {
  prices,
  terminals,
  commodities,
  shipCargoScu: 100,
  investment: 1_000_000,
  filters: defaultFilters(),
};

describe("Route_Finder filters — end-to-end verification", () => {
  it("produces both candidate routes with no filtering", () => {
    const routes = computeRoutes(baseInput);
    expect(routes.length).toBe(2);
    const commodityIds = routes.map((r) => r.commodityId).sort();
    expect(commodityIds).toEqual([1, 2]);
  });

  it("enriches commodityTypeId and factionId from the catalogue/terminals", () => {
    const routes = computeRoutes(baseInput);
    const a = routes.find((r) => r.commodityId === 1)!;
    const b = routes.find((r) => r.commodityId === 2)!;
    expect(a.commodityTypeId).toBe(100);
    expect(b.commodityTypeId).toBe(200);
    expect(a.factionId).toBe(23);
    expect(b.factionId).toBe(9);
    // Real container sizes parsed from the price rows.
    expect(a.boxSizesScu).toEqual([1, 2, 4]);
    expect(b.boxSizesScu).toEqual([8, 16]);
  });

  it("commodity filter (only) keeps just the selected commodity", () => {
    const routes = computeRoutes({
      ...baseInput,
      filters: {
        ...defaultFilters(),
        commodities: { mode: "only", values: [1] },
      },
    });
    expect(routes.map((r) => r.commodityId)).toEqual([1]);
  });

  it("commodity-type filter (avoid) excludes the selected type", () => {
    const routes = computeRoutes({
      ...baseInput,
      filters: {
        ...defaultFilters(),
        commodityTypes: { mode: "avoid", values: [200] },
      },
    });
    expect(routes.map((r) => r.commodityTypeId)).toEqual([100]);
  });

  it("faction filter (only) keeps just routes of the selected faction", () => {
    const routes = computeRoutes({
      ...baseInput,
      filters: {
        ...defaultFilters(),
        factions: { mode: "only", values: [9] },
      },
    });
    expect(routes.map((r) => r.factionId)).toEqual([9]);
  });

  it("box-size filter keeps only routes tradable in that size", () => {
    const routes = computeRoutes({
      ...baseInput,
      filters: { ...defaultFilters(), boxSizeScu: 16 },
    });
    // Only commodity B supports 16 SCU boxes.
    expect(routes.map((r) => r.commodityId)).toEqual([2]);
  });

  it("avoid-hidden filter drops routes touching a hidden terminal", () => {
    const routes = computeRoutes({
      ...baseInput,
      filters: { ...defaultFilters(), avoidHiddenLocations: true },
    });
    // Commodity B sells at a hidden terminal -> excluded.
    expect(routes.map((r) => r.commodityId)).toEqual([1]);
  });

  it("max-stops filter keeps single-hop routes and drops when limit is 0", () => {
    expect(
      computeRoutes({
        ...baseInput,
        filters: { ...defaultFilters(), maxStops: 1 },
      }).length,
    ).toBe(2);
    expect(
      computeRoutes({
        ...baseInput,
        filters: { ...defaultFilters(), maxStops: 0 },
      }).length,
    ).toBe(0);
  });
});
