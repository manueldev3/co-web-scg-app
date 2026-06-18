import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import {
  fetchVehiclePurchasePrices,
  fetchVehicleRentalPrices,
  fetchTerminals,
} from "../uex-api";

/**
 * Property-based test for the resilience and extraction of the NEW Cliente_UEX
 * sources added by this feature: purchase prices, rental prices and terminals.
 *
 * Feature: wiki-detalle-completo, Property 8: Resiliencia y extracción del
 * Cliente_UEX (nuevas fuentes)
 *
 * Validates: Requirements 6.4, 6.5
 *
 * For any simulated API_UEX response — objects with or without `data`, non-2xx
 * statuses, a fetch that throws, and a json() that throws — each of
 * `fetchVehiclePurchasePrices`, `fetchVehicleRentalPrices` and `fetchTerminals`
 * returns `json.data` when it is present (an array) and an empty list in any
 * other case, without ever propagating an exception.
 *
 * `global.fetch` is mocked per scenario (vi.fn) and restored after each run,
 * mirroring the existing `uex-client.property.test.ts` pattern.
 */

beforeEach(() => {
  // Silence the diagnostic logging the client emits on failures.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Arbitrary array of plausible price/terminal-like rows used as `json.data`. */
const dataArrayArb = fc.array(
  fc.record({
    id: fc.integer(),
    id_vehicle: fc.integer(),
    id_terminal: fc.integer(),
    name: fc.string(),
  }),
  { maxLength: 8 },
);

/**
 * "Without data" forms: `json.data` absent. Per the client contract
 * (`json.data ?? []`) and Requirement 6.4, an absent `data` means `null`,
 * `undefined`, or a missing key.
 */
const absentDataArb = fc.constantFrom<null | undefined>(null, undefined);

/**
 * A scenario describes how the mocked `fetch` behaves and what each client
 * function should return for it.
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

/**
 * Each of the three new sources must obey the identical resilience contract.
 * Parameterizing keeps the property statement shared while exercising every
 * function independently.
 */
const sources: ReadonlyArray<{
  name: string;
  fn: () => Promise<unknown[]>;
}> = [
  { name: "fetchVehiclePurchasePrices", fn: fetchVehiclePurchasePrices },
  { name: "fetchVehicleRentalPrices", fn: fetchVehicleRentalPrices },
  { name: "fetchTerminals", fn: fetchTerminals },
];

describe("Cliente_UEX new sources resilience (Property 8)", () => {
  for (const { name, fn } of sources) {
    it(`${name} returns json.data when present, [] otherwise, and never throws`, async () => {
      await fc.assert(
        fc.asyncProperty(scenarioArb, async (scenario) => {
          scenario.install();

          // Must never throw, regardless of the simulated response.
          const result = await fn();

          expect(Array.isArray(result)).toBe(true);
          expect(result).toEqual(scenario.expected);

          vi.unstubAllGlobals();
        }),
        { numRuns: 100 },
      );
    });
  }
});
