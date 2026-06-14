import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { applyFilters, defaultFilters } from "../route-engine";
import type {
  MultiselectFilter,
  RouteFilters,
  TerminalMeta,
  TradeRoute,
} from "../types";

/**
 * Feature: mejor-ruta, Property 10: Include/exclude multiselect filtering
 *
 * Validates: Requirements 5.3, 5.4, 5.5
 *
 * For any set of routes and any one of the three multiselects (commodity type,
 * commodity, faction):
 * - "only" mode with >=1 values: every surviving route's corresponding
 *   attribute is non-null AND one of the selected values.
 * - "avoid" mode with >=1 values: no surviving route's corresponding attribute
 *   is one of the selected values (null attributes are kept).
 * - no values selected: that multiselect does no filtering, so the surviving
 *   set equals the input set.
 *
 * Engine null-attribute semantics: under "only" a null attribute is excluded;
 * under "avoid" a null attribute is kept.
 */

/**
 * Self-contained TradeRoute arbitrary.
 *
 * The three filterable attributes are varied across a small shared id range so
 * the generated multiselect values overlap with them often, exercising the
 * include/exclude boundaries. `commodityTypeId` and `factionId` are nullable
 * (so the null semantics are hit); `commodityId` is always a number, matching
 * the type. All other fields are neutral, valid values so that, paired with
 * default filters, only the multiselect under test can exclude a route.
 */
const tradeRouteArb: fc.Arbitrary<TradeRoute> = fc.record({
  commodityId: fc.integer({ min: 1, max: 6 }),
  commodityName: fc.string({ minLength: 1, maxLength: 20 }),
  commodityTypeId: fc.option(fc.integer({ min: 1, max: 6 }), { nil: null }),
  buyTerminalId: fc.integer({ min: 10, max: 14 }),
  buyTerminalName: fc.string({ minLength: 1, maxLength: 20 }),
  sellTerminalId: fc.integer({ min: 20, max: 24 }),
  sellTerminalName: fc.string({ minLength: 1, maxLength: 20 }),
  factionId: fc.option(fc.integer({ min: 1, max: 6 }), { nil: null }),
  quantityScu: fc.integer({ min: 1, max: 1000 }),
  buyValue: fc.float({ min: Math.fround(1), max: 100000, noNaN: true }),
  sellValue: fc.float({ min: Math.fround(1), max: 200000, noNaN: true }),
  profit: fc.float({ min: Math.fround(1), max: 100000, noNaN: true }),
  stops: fc.integer({ min: 0, max: 5 }),
  requiresWaitTimer: fc.boolean(),
  boxSizesScu: fc.constant([1, 2, 4, 8, 16, 24, 32]),
  securityLevel: fc.integer({ min: 0, max: 5 }),
  includesHiddenLocation: fc.boolean(),
});

/**
 * A MultiselectFilter arbitrary: mode is avoid/only and values may be empty.
 * Values are drawn from the same small id range as the route attributes so
 * overlaps (and thus real inclusion/exclusion) happen frequently.
 */
const multiselectArb: fc.Arbitrary<MultiselectFilter> = fc.record({
  mode: fc.constantFrom("avoid", "only") as fc.Arbitrary<"avoid" | "only">,
  values: fc.uniqueArray(fc.integer({ min: 1, max: 6 }), { maxLength: 6 }),
});

/** The three attributes under test, each mapping a filter key to its route attribute. */
const attributeArb = fc.constantFrom(
  "commodityTypes",
  "commodities",
  "factions",
) as fc.Arbitrary<"commodityTypes" | "commodities" | "factions">;

function attributeOf(
  route: TradeRoute,
  which: "commodityTypes" | "commodities" | "factions",
): number | null {
  switch (which) {
    case "commodityTypes":
      return route.commodityTypeId;
    case "commodities":
      return route.commodityId;
    case "factions":
      return route.factionId;
  }
}

describe("Feature: mejor-ruta, Property 10: Include/exclude multiselect filtering", () => {
  it("only/avoid/empty semantics hold for each of the three multiselects", () => {
    fc.assert(
      fc.property(
        fc.array(tradeRouteArb, { maxLength: 50 }),
        multiselectArb,
        attributeArb,
        (routes, multiselect, which) => {
          // Base = neutral defaults; set ONLY the multiselect under test, keep
          // the other two empty (neutral). Empty terminals so no
          // security/hidden filtering interferes.
          const filters: RouteFilters = {
            ...defaultFilters(),
            [which]: multiselect,
          };
          const terminals: TerminalMeta[] = [];

          const survivors = applyFilters(routes, filters, terminals);

          if (multiselect.values.length === 0) {
            // No filtering for this multiselect: surviving set equals input.
            expect(survivors.length).toBe(routes.length);
            return;
          }

          if (multiselect.mode === "only") {
            for (const route of survivors) {
              const attr = attributeOf(route, which);
              expect(attr).not.toBeNull();
              expect(multiselect.values).toContain(attr as number);
            }
          } else {
            // "avoid": no survivor's attribute is one of the selected values;
            // a null attribute is kept.
            for (const route of survivors) {
              const attr = attributeOf(route, which);
              if (attr !== null) {
                expect(multiselect.values).not.toContain(attr);
              }
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
