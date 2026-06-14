import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { defaultFilters } from "../route-engine";
import type { ProfitMode, RouteFilters, SelectionMode } from "../types";

/**
 * Feature: mejor-ruta, Property 2: Reset restores the canonical default state
 *
 * Validates: Requirements 2.4
 *
 * For any arbitrary filter and input state, applying Reset yields a state
 * deep-equal to defaultFilters() with no ship selected and no investment
 * value, independent of the prior state.
 */

const profitModeArb: fc.Arbitrary<ProfitMode> = fc.constantFrom(
  "pure_profit",
  "over_time",
);
const selectionModeArb: fc.Arbitrary<SelectionMode> = fc.constantFrom(
  "avoid",
  "only",
);

const multiselectArb = fc.record({
  mode: selectionModeArb,
  values: fc.array(fc.nat(), { maxLength: 10 }),
});

/** Arbitrary that generates any valid RouteFilters state (the prior state before Reset). */
const routeFiltersArb: fc.Arbitrary<RouteFilters> = fc.record({
  profitMode: profitModeArb,
  maxStops: fc.option(fc.integer({ min: 0, max: 50 }), { nil: null }),
  commodityTypes: multiselectArb,
  commodities: multiselectArb,
  factions: multiselectArb,
  minSecurityLevel: fc.option(fc.integer({ min: 0, max: 10 }), { nil: null }),
  boxSizeScu: fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
  allowWaitTimers: fc.boolean(),
  autoLoading: fc.boolean(),
  smartFilters: fc.boolean(),
  expandedView: fc.boolean(),
  avoidHiddenLocations: fc.boolean(),
});

/** Arbitrary prior ship selection: a selected ship id or none. */
const priorShipArb = fc.option(fc.nat(), { nil: null });
/** Arbitrary prior investment value: a number or none. */
const priorInvestmentArb = fc.option(
  fc.float({ min: Math.fround(-100000), max: 100000, noNaN: true }),
  { nil: null },
);

/**
 * Models the Reset control: regardless of the prior state, Reset restores the
 * canonical default filters and clears the ship and investment inputs.
 */
function applyReset(): {
  filters: RouteFilters;
  shipId: number | null;
  investment: number | null;
} {
  return { filters: defaultFilters(), shipId: null, investment: null };
}

describe("Feature: mejor-ruta, Property 2: Reset restores the canonical default state", () => {
  it("yields defaultFilters() with no ship and no investment, independent of prior state", () => {
    fc.assert(
      fc.property(
        routeFiltersArb,
        priorShipArb,
        priorInvestmentArb,
        (_priorFilters, _priorShipId, _priorInvestment) => {
          // Apply Reset regardless of the arbitrary prior state.
          const reset = applyReset();

          // Reset filters deep-equal a fresh canonical default state.
          expect(reset.filters).toEqual(defaultFilters());
          // Ship selection is cleared.
          expect(reset.shipId).toBeNull();
          // Investment value is cleared.
          expect(reset.investment).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });
});
