import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import { fetchVehicles } from "../uex-api";

/**
 * Property-based test for the wiki Cliente_UEX resilience and extraction.
 *
 * Feature: wiki, Property 12: Resiliencia y extracción del Cliente_UEX
 *
 * Validates: Requirements 8.3, 8.4
 *
 * For any simulated API_UEX response — objects with or without `data`, non-2xx
 * statuses, a fetch that throws, and a json() that throws — `fetchVehicles`
 * returns `json.data` when it is an array and an empty list in any other case,
 * without ever propagating an exception.
 *
 * `global.fetch` is mocked per scenario (vi.fn) and restored after each run.
 */

beforeEach(() => {
  // Silence the diagnostic logging the client emits on failures.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Arbitrary array of plausible vehicle-like objects used as `json.data`. */
const dataArrayArb = fc.array(
  fc.record({
    id: fc.integer(),
    name: fc.string(),
    is_spaceship: fc.constantFrom(0, 1),
  }),
  { maxLength: 8 },
);

/**
 * "Without data" forms: `json.data` absent. Per the client contract
 * (`json.data ?? []`) and Requirement 8.3, an absent `data` means a `null`,
 * `undefined`, or missing key. The real `/vehicles` endpoint returns `data`
 * as an array or omits it, so non-array primitive payloads are out of scope.
 */
const absentDataArb = fc.constantFrom<null | undefined>(null, undefined);

/**
 * A scenario describes how the mocked `fetch` behaves and what the client
 * should return for it.
 */
type Scenario = {
  install: () => void;
  expected: unknown[];
};

const scenarioArb: fc.Arbitrary<Scenario> = fc.oneof(
  // 1. ok 2xx + json with a `data` array → returns that array.
  fc
    .tuple(dataArrayArb, fc.integer({ min: 200, max: 299 }))
    .map(([data, status]) => ({
      install: () =>
        vi.stubGlobal(
          "fetch",
          vi.fn().mockResolvedValue({
            ok: true,
            status,
            json: async () => ({ status: "ok", data }),
          } as Partial<Response>),
        ),
      expected: data,
    })),

  // 2. ok 2xx but `data` is absent (null/undefined) → returns [].
  fc
    .tuple(absentDataArb, fc.integer({ min: 200, max: 299 }))
    .map(([data, status]) => ({
      install: () =>
        vi.stubGlobal(
          "fetch",
          vi.fn().mockResolvedValue({
            ok: true,
            status,
            json: async () => ({ status: "ok", data }),
          } as Partial<Response>),
        ),
      expected: [] as unknown[],
    })),

  // 3. ok 2xx but json object has NO `data` key → returns [].
  fc.integer({ min: 200, max: 299 }).map((status) => ({
    install: () =>
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status,
          json: async () => ({ status: "ok" }),
        } as Partial<Response>),
      ),
    expected: [] as unknown[],
  })),

  // 4. non-2xx status → returns [] (data ignored).
  fc
    .tuple(
      fc.oneof(dataArrayArb, absentDataArb),
      fc.integer({ min: 300, max: 599 }),
    )
    .map(([data, status]) => ({
      install: () =>
        vi.stubGlobal(
          "fetch",
          vi.fn().mockResolvedValue({
            ok: false,
            status,
            json: async () => ({ status: "error", data }),
          } as Partial<Response>),
        ),
      expected: [] as unknown[],
    })),

  // 5. fetch throws (network error) → returns [].
  fc.string().map((msg) => ({
    install: () =>
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error(msg))),
    expected: [] as unknown[],
  })),

  // 6. json() throws (malformed body) → returns [].
  fc.integer({ min: 200, max: 299 }).map((status) => ({
    install: () =>
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status,
          json: async () => {
            throw new Error("invalid json");
          },
        } as Partial<Response>),
      ),
    expected: [] as unknown[],
  })),
);

describe("Cliente_UEX resilience (Property 12)", () => {
  it("returns json.data when it is an array, [] otherwise, and never throws", async () => {
    await fc.assert(
      fc.asyncProperty(scenarioArb, async (scenario) => {
        scenario.install();

        // Must never throw, regardless of the simulated response.
        const result = await fetchVehicles();

        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual(scenario.expected);

        vi.unstubAllGlobals();
      }),
      { numRuns: 100 },
    );
  });
});
