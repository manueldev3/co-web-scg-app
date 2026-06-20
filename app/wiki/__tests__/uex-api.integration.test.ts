import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchVehicles } from "../uex-api";

/**
 * Integration / smoke tests for the wiki Cliente_UEX wiring.
 *
 * These verify that `fetchVehicles` in `app/wiki/uex-api.ts`:
 *   - sends an `Accept: application/json` header and NO `Authorization` header
 *     (the /vehicles endpoint is public — Req 8.1),
 *   - configures caching via `next.revalidate` within the [3300, 3900] second
 *     window required for list endpoints (~1h) (Req 8.2),
 *   - issues exactly ONE bulk request to the `/vehicles` endpoint, with no
 *     per-item fan-out (Req 8.6).
 *
 * Behavior here does not vary with input, so these are example-based smoke
 * tests (NOT property-based), following the fetch-mocking conventions used
 * across the codebase (see app/mejor-ruta/__tests__/uex-api.integration.test.ts).
 *
 * Validates: Requirements 8.1, 8.2, 8.6
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

describe("Integration: wiki Cliente_UEX wiring (fetchVehicles)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async () => makeOkResponse([]));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends Accept: application/json and no Authorization header (Req 8.1)", async () => {
    await fetchVehicles();

    const headers = headersOf(fetchMock.mock.calls[0]);
    expect(headers["Accept"] ?? headers["accept"]).toBe("application/json");
    expectNoAuthHeader(headers);
  });

  it("configures next.revalidate within the [3300, 3900] second window (Req 8.2)", async () => {
    await fetchVehicles();

    const revalidate = revalidateOf(fetchMock.mock.calls[0]);
    expect(typeof revalidate).toBe("number");
    expect(revalidate).toBeGreaterThanOrEqual(3300);
    expect(revalidate).toBeLessThanOrEqual(3900);
  });

  it("issues exactly ONE bulk request to /vehicles, with no per-item fan-out (Req 8.6)", async () => {
    await fetchVehicles();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = urlOf(fetchMock.mock.calls[0]);
    expect(url).toBe(`${UEX_API_BASE}/vehicles`);
    expect(url).toContain("/vehicles");
  });
});
