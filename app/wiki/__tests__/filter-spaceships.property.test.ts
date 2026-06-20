import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { filterSpaceships } from "../utils";
import type { ApiVehicle } from "../types";

/**
 * Feature: wiki, Property 1: Filtro de naves
 *
 * Validates: Requirements 4.2
 *
 * Para cualquier lista de ApiVehicle, filterSpaceships devuelve exactamente los
 * vehículos cuyo is_spaceship está activo, sin añadir, omitir ni reordenar el
 * resto del subconjunto.
 */

/**
 * Self-contained ApiVehicle arbitrary. The only field that drives the filter is
 * `is_spaceship`, drawn as 0 | 1 so both kept and excluded branches are
 * exercised. Every other field is a valid, neutral value matching the API shape
 * (nullable fields produce null often enough to stay representative).
 */
const apiVehicleArb: fc.Arbitrary<ApiVehicle> = fc.record({
  id: fc.integer({ min: 1, max: 100000 }),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  name_full: fc.option(fc.string({ minLength: 1, maxLength: 30 }), {
    nil: null,
  }),
  scu: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: null }),
  crew: fc.option(fc.string({ minLength: 1, maxLength: 5 }), { nil: null }),
  is_spaceship: fc.constantFrom(0, 1),
  is_cargo: fc.constantFrom(0, 1),
  is_ground_vehicle: fc.constantFrom(0, 1),
  container_sizes: fc.option(fc.string({ maxLength: 20 }), { nil: null }),
  pad_type: fc.option(fc.string({ minLength: 1, maxLength: 5 }), { nil: null }),
  company_name: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
    nil: null,
  }),
});

describe("Feature: wiki, Property 1: Filtro de naves", () => {
  it("returns exactly the is_spaceship===1 vehicles, preserving order", () => {
    fc.assert(
      fc.property(fc.array(apiVehicleArb, { maxLength: 100 }), (vehicles) => {
        const result = filterSpaceships(vehicles);

        // Reference: the input filtered to ships, in original order.
        const expected = vehicles.filter((v) => v.is_spaceship === 1);

        // Same length, same elements, same order (reference equality holds
        // because filter preserves the original object references).
        expect(result).toEqual(expected);
        expect(result.length).toBe(expected.length);
        result.forEach((v, i) => {
          expect(v).toBe(expected[i]);
          expect(v.is_spaceship).toBe(1);
        });

        // Nothing with is_spaceship !== 1 leaks through.
        for (const v of result) {
          expect(v.is_spaceship).toBe(1);
        }
      }),
      { numRuns: 100 },
    );
  });
});
