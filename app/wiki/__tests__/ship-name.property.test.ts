import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { resolveShipName, displayValue, MISSING_DATA } from "../utils";
import type { ApiVehicle } from "../types";

/**
 * Feature: wiki, Property 2: Resolución de nombre y empresa
 *
 * Validates: Requirements 4.3, 5.1
 *
 * Para cualquier ApiVehicle, el nombre mostrado es `name_full` cuando este no
 * es un Dato_Faltante ni cadena vacía, y `name` en caso contrario; el subtítulo
 * es `company_name` formateado con el marcador de dato faltante cuando falta.
 */

/**
 * `name_full` arbitrary: covers the missing-data cases (`null`) and the empty
 * string alongside meaningful non-empty names, so the resolution rule is
 * exercised on both branches (use `name_full` vs fall back to `name`).
 */
const nameFullArb: fc.Arbitrary<string | null> = fc.oneof(
  fc.constant<string | null>(null),
  fc.constant<string | null>(""),
  fc.string({ minLength: 1, maxLength: 40 }),
);

/**
 * `name` arbitrary: a non-empty fallback name (the API always provides `name`),
 * so when `name_full` is missing/empty there is a deterministic value to fall
 * back to.
 */
const nameArb: fc.Arbitrary<string> = fc.string({
  minLength: 1,
  maxLength: 40,
});

/**
 * `company_name` arbitrary: covers the missing-data cases (`null`/`undefined`)
 * plus the empty string and meaningful values, since `displayValue` treats
 * only `null`/`undefined` as missing.
 */
const companyNameArb: fc.Arbitrary<string | null> = fc.oneof(
  fc.constant<string | null>(null),
  fc.constant<string | null>(""),
  fc.string({ maxLength: 40 }),
);

/**
 * Builds an ApiVehicle from the fields relevant to this property, filling the
 * remaining required fields with deterministic placeholder values.
 */
const vehicleArb: fc.Arbitrary<ApiVehicle> = fc
  .record({
    name_full: nameFullArb,
    name: nameArb,
    company_name: companyNameArb,
  })
  .map(({ name_full, name, company_name }) => ({
    id: 0,
    name,
    name_full,
    scu: null,
    crew: null,
    is_spaceship: 1,
    is_cargo: 0,
    is_ground_vehicle: 0,
    container_sizes: null,
    pad_type: null,
    company_name,
  }));

describe("Feature: wiki, Property 2: Resolución de nombre y empresa", () => {
  it("resolveShipName usa name_full salvo que falte/sea vacío; el subtítulo usa el marcador cuando company_name falta", () => {
    fc.assert(
      fc.property(vehicleArb, (vehicle) => {
        // Requirement 4.3 / 5.1: name resolution.
        const resolved = resolveShipName(vehicle);
        if (vehicle.name_full != null && vehicle.name_full !== "") {
          expect(resolved).toBe(vehicle.name_full);
        } else {
          expect(resolved).toBe(vehicle.name);
        }

        // Requirement 5.1: company subtitle formatted with the missing marker.
        const subtitle = displayValue(vehicle.company_name);
        if (vehicle.company_name == null) {
          expect(subtitle).toBe(MISSING_DATA);
        } else {
          expect(subtitle).toBe(String(vehicle.company_name));
        }
      }),
      { numRuns: 100 },
    );
  });
});
