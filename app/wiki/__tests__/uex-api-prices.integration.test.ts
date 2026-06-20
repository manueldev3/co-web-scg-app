import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchVehiclePurchasePrices,
  fetchVehicleRentalPrices,
  fetchTerminals,
} from "../uex-api";

/**
 * Integration / smoke tests for the NEW wiki Cliente_UEX sources added by this
 * feature: purchase prices, rental prices and terminals.
 *
 * These verify that each function in `app/wiki/uex-api.ts`:
 *   - sends an `Accept: application/json` header and NO `Authorization` header
 *     (the endpoints are public — Req 6.1),
 *   - issues exactly ONE bulk request to its `*_all` / bulk endpoint, with no
 *     per-vehicle fan-out (Req 6.2),
 *   - configures caching via `next.revalidate` within the [3300, 3900] second
 *     window required (~1h) (Req 6.3).
 *
 * Behavior here does not vary with input, so these are example-based smoke
 * tests (NOT property-based), following the fetch-mocking conventions used in
 * `app/wiki/__tests__/uex-api.integration.test.ts`.
 *
 * Validates: Requirements 6.1, 6.2, 6.3
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

/** Extract the `next.revalidate` value from the `fetch` init object. */
function revalidateOf(call: unknown[]): number | undefined {
  const init = call[1] as
    | (RequestInit & { next?: { revalidate?: number } })
    | undefined;
  return init?.next?.revalidate;
}

/** Assert that no Authorization-style header (case-insensitive) is present. */
function expectNoAuthHeader(headers: Record<string, string>) {
  const authKeys = Object.keys(headers).filter((k) =>
    /^authorization$|token|api[-_]?key|bearer/i.test(k),
  );
  expect(authKeys).toEqual([]);
}

/**
 * Each new source maps to a single bulk endpoint. The expected URL has no
 * query string and no per-vehicle path segment, proving there is no fan-out.
 */
const sources: ReadonlyArray<{
  name: string;
  fn: () => Promise<unknown[]>;
  endpoint: string;
}> = [
  {
    name: "fetchVehiclePurchasePrices",
    fn: fetchVehiclePurchasePrices,
    endpoint: `${UEX_API_BASE}/vehicles_purchases_prices_all`,
  },
  {
    name: "fetchVehicleRentalPrices",
    fn: fetchVehicleRentalPrices,
    endpoint: `${UEX_API_BASE}/vehicles_rentals_prices_all`,
  },
  {
    name: "fetchTerminals",
    fn: fetchTerminals,
    endpoint: `${UEX_API_BASE}/terminals`,
  },
];

describe("Integration: wiki Cliente_UEX new sources wiring", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async () => makeOkResponse([]));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  for (const { name, fn, endpoint } of sources) {
    describe(name, () => {
      it("sends Accept: application/json and no Authorization header (Req 6.1)", async () => {
        await fn();

        const headers = headersOf(fetchMock.mock.calls[0]);
        expect(headers["Accept"] ?? headers["accept"]).toBe("application/json");
        expectNoAuthHeader(headers);
      });

      it("issues exactly ONE bulk request, with no per-vehicle fan-out (Req 6.2)", async () => {
        await fn();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const url = urlOf(fetchMock.mock.calls[0]);
        expect(url).toBe(endpoint);
        // No query string ⇒ a single bulk request, not a parameterized fan-out.
        expect(url).not.toContain("?");
      });

      it("configures next.revalidate within the [3300, 3900] second window (Req 6.3)", async () => {
        await fn();

        const revalidate = revalidateOf(fetchMock.mock.calls[0]);
        expect(typeof revalidate).toBe("number");
        expect(revalidate).toBeGreaterThanOrEqual(3300);
        expect(revalidate).toBeLessThanOrEqual(3900);
      });
    });
  }
});
