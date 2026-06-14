import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchCommodities,
  fetchAllCommodityPrices,
  fetchTerminals,
  fetchVehicles,
  fetchMarketData,
} from "../uex-api";

/**
 * Integration / smoke tests for UEX_Client wiring.
 *
 * These verify that the data-access functions in `app/mejor-ruta/uex-api.ts`
 * send their requests to the correct UEX Corp endpoints under the
 * `https://api.uexcorp.uk/2.0` base URL and carry NO Authorization header
 * (these endpoints are public, no auth token).
 *
 * Behavior here does not vary with input, so these are example-based smoke
 * tests (NOT property-based), following the fetch-mocking conventions used
 * across the codebase.
 *
 * Validates: Requirements 8.1, 8.3
 */

const UEX_API_BASE = "https://api.uexcorp.uk/2.0";

/** Build a minimal `ok` Response-like object whose `.json()` yields `{ data }`. */
function makeOkResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ status: "ok", http_code: 200, data }),
  } as Response;
}

/**
 * Extract the request URL string from a captured `fetch` call, regardless of
 * whether it was invoked with a string, URL, or Request object.
 */
function urlOf(call: unknown[]): string {
  const input = call[0];
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  if (input instanceof Request) return input.url;
  return String(input);
}

/** Extract the headers passed in the `fetch` init object as a plain lookup. */
function headersOf(call: unknown[]): Record<string, string> {
  const init = call[1] as RequestInit | undefined;
  const headers = init?.headers;
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers as Record<string, string>;
}

/** Assert that no Authorization-style header (case-insensitive) is present. */
function expectNoAuthHeader(headers: Record<string, string>) {
  const authKeys = Object.keys(headers).filter((k) =>
    /^authorization$|token|api[-_]?key|bearer/i.test(k),
  );
  expect(authKeys).toEqual([]);
}

describe("Integration: UEX_Client wiring (endpoints + no auth)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async () => makeOkResponse([]));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fetchCommodities requests the /commodities endpoint with no auth header", async () => {
    await fetchCommodities();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    expect(urlOf(call)).toBe(`${UEX_API_BASE}/commodities`);
    expectNoAuthHeader(headersOf(call));
  });

  it("fetchAllCommodityPrices requests the /commodities_prices_all endpoint with no auth header", async () => {
    await fetchAllCommodityPrices();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    expect(urlOf(call)).toBe(`${UEX_API_BASE}/commodities_prices_all`);
    expectNoAuthHeader(headersOf(call));
  });

  it("fetchTerminals requests the /terminals endpoint with no auth header", async () => {
    await fetchTerminals();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    expect(urlOf(call)).toBe(`${UEX_API_BASE}/terminals`);
    expectNoAuthHeader(headersOf(call));
  });

  it("fetchVehicles requests the /vehicles endpoint with no auth header", async () => {
    await fetchVehicles();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    expect(urlOf(call)).toBe(`${UEX_API_BASE}/vehicles`);
    expectNoAuthHeader(headersOf(call));
  });

  it("requests use the https://api.uexcorp.uk/2.0 base URL and send an Accept: application/json header", async () => {
    await fetchCommodities();

    const headers = headersOf(fetchMock.mock.calls[0]);
    expect(urlOf(fetchMock.mock.calls[0])).toMatch(
      /^https:\/\/api\.uexcorp\.uk\/2\.0\//,
    );
    expect(headers["Accept"] ?? headers["accept"]).toBe("application/json");
  });

  it("fetchMarketData calls all four endpoints under the base URL, none carrying an auth header", async () => {
    await fetchMarketData();

    const requestedUrls = fetchMock.mock.calls.map(urlOf);
    expect(requestedUrls).toContain(`${UEX_API_BASE}/commodities`);
    expect(requestedUrls).toContain(`${UEX_API_BASE}/commodities_prices_all`);
    expect(requestedUrls).toContain(`${UEX_API_BASE}/terminals`);
    expect(requestedUrls).toContain(`${UEX_API_BASE}/vehicles`);

    // Every request must hit the correct base URL and omit auth.
    for (const call of fetchMock.mock.calls) {
      expect(urlOf(call)).toMatch(/^https:\/\/api\.uexcorp\.uk\/2\.0\//);
      expectNoAuthHeader(headersOf(call));
    }
  });
});
