import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchAllCommodityPrices,
  fetchCommodities,
  fetchMarketData,
  fetchTerminals,
  fetchVehicles,
} from "../uex-api";

/**
 * Unit tests for the "Mejor Ruta" UEX_Client error handling.
 *
 * Validates: Requirements 8.2
 *
 * Each data-access function must return an empty array on any failure: a
 * non-2xx HTTP status or a thrown error (e.g. a network failure). It must
 * never throw. `fetchMarketData` aggregates the four datasets with
 * `Promise.allSettled`, so a single failing endpoint must yield `[]` for that
 * dataset while the others return their data (partial data).
 *
 * `fetch` is replaced with a `vi.fn()` via `vi.stubGlobal`, following the
 * mocking conventions used elsewhere in the suite.
 */

/** Build a minimal `Response`-like object with the fields the client reads. */
function makeResponse(
  ok: boolean,
  status: number,
  data: unknown,
): Partial<Response> {
  return {
    ok,
    status,
    json: async () => ({ status: ok ? "ok" : "error", data }),
  };
}

const okResponse = (data: unknown) => makeResponse(true, 200, data);
const errorResponse = (status = 500) => makeResponse(false, status, null);

beforeEach(() => {
  // Silence the diagnostic logging the client emits on failures.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("UEX_Client error handling — non-2xx responses (Req 8.2)", () => {
  const cases: Array<{
    name: string;
    fn: () => Promise<unknown[]>;
  }> = [
    { name: "fetchCommodities", fn: fetchCommodities },
    { name: "fetchAllCommodityPrices", fn: fetchAllCommodityPrices },
    { name: "fetchTerminals", fn: fetchTerminals },
    { name: "fetchVehicles", fn: fetchVehicles },
  ];

  for (const { name, fn } of cases) {
    it(`${name} returns [] on a non-2xx status`, async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(503)));

      const result = await fn();

      expect(result).toEqual([]);
    });

    it(`${name} returns [] on a 404 status`, async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(404)));

      const result = await fn();

      expect(result).toEqual([]);
    });
  }
});

describe("UEX_Client error handling — thrown errors (Req 8.2)", () => {
  const cases: Array<{
    name: string;
    fn: () => Promise<unknown[]>;
  }> = [
    { name: "fetchCommodities", fn: fetchCommodities },
    { name: "fetchAllCommodityPrices", fn: fetchAllCommodityPrices },
    { name: "fetchTerminals", fn: fetchTerminals },
    { name: "fetchVehicles", fn: fetchVehicles },
  ];

  for (const { name, fn } of cases) {
    it(`${name} returns [] when fetch rejects (network error)`, async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("network down")),
      );

      // Must resolve to [] rather than reject.
      await expect(fn()).resolves.toEqual([]);
    });

    it(`${name} returns [] when response.json() throws (malformed body)`, async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => {
            throw new Error("invalid json");
          },
        } as Partial<Response>),
      );

      await expect(fn()).resolves.toEqual([]);
    });
  }
});

describe("fetchMarketData — partial data on a single failing endpoint (Req 8.2)", () => {
  /**
   * Route fetch to a per-endpoint response based on its URL so we can fail one
   * endpoint while the other three succeed.
   */
  function stubFetchByEndpoint(
    handlers: Record<string, () => Partial<Response>>,
  ) {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        for (const [fragment, make] of Object.entries(handlers)) {
          if (url.includes(fragment)) {
            return Promise.resolve(make());
          }
        }
        return Promise.resolve(errorResponse(404));
      }),
    );
  }

  const commodities = [{ id: 1, name: "Laranite", slug: "laranite" }];
  const prices = [{ id: 10, id_commodity: 1, price_buy: 5, price_sell: 8 }];
  const rawTerminals = [
    { id: 100, name: "Area18 TDD", is_visible: 1, security_level: 3 },
  ];
  const vehicles = [
    { id: 1000, name: "Caterpillar", scu: 576, is_spaceship: 1 },
  ];

  it("returns [] for the failed dataset and real data for the others (vehicles fails)", async () => {
    // The longer fragment "commodities_prices" must be matched before the
    // shorter "commodities"; Object iteration preserves insertion order.
    stubFetchByEndpoint({
      commodities_prices: () => okResponse(prices),
      commodities: () => okResponse(commodities),
      terminals: () => okResponse(rawTerminals),
      vehicles: () => errorResponse(500),
    });

    const market = await fetchMarketData();

    expect(market.commodities).toEqual(commodities);
    expect(market.prices).toEqual(prices);
    // Terminals are normalized into TerminalMeta.
    expect(market.terminals).toEqual([
      { id: 100, name: "Area18 TDD", securityLevel: 3, isHidden: false, factionId: null, factionName: null },
    ]);
    // The failing endpoint yields an empty array, not a thrown error.
    expect(market.vehicles).toEqual([]);
  });

  it("returns [] for the failed dataset when the prices endpoint fails", async () => {
    stubFetchByEndpoint({
      commodities_prices: () => errorResponse(502),
      commodities: () => okResponse(commodities),
      terminals: () => okResponse(rawTerminals),
      vehicles: () => okResponse(vehicles),
    });

    const market = await fetchMarketData();

    expect(market.prices).toEqual([]);
    expect(market.commodities).toEqual(commodities);
    expect(market.vehicles).toEqual(vehicles);
    expect(market.terminals).toEqual([
      { id: 100, name: "Area18 TDD", securityLevel: 3, isHidden: false, factionId: null, factionName: null },
    ]);
  });

  it("returns [] for the failed dataset when fetch throws for one endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("terminals")) {
          return Promise.reject(new Error("network down"));
        }
        if (url.includes("commodities_prices")) {
          return Promise.resolve(okResponse(prices));
        }
        if (url.includes("commodities")) {
          return Promise.resolve(okResponse(commodities));
        }
        if (url.includes("vehicles")) {
          return Promise.resolve(okResponse(vehicles));
        }
        return Promise.resolve(errorResponse(404));
      }),
    );

    const market = await fetchMarketData();

    expect(market.terminals).toEqual([]);
    expect(market.commodities).toEqual(commodities);
    expect(market.prices).toEqual(prices);
    expect(market.vehicles).toEqual(vehicles);
  });
});
