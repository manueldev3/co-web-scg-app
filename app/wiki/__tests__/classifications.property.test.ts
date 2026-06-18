import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { activeClassifications } from "../utils";
import type { ApiVehicle } from "../types";

/**
 * Feature: wiki-detalle-completo, Property 6: Clasificaciones activas ampliadas y completas
 *
 * Validates: Requirements 2.5
 *
 * Para cualquier `ApiVehicle`, `activeClassifications` devuelve exactamente las
 * etiquetas correspondientes a los indicadores `is_*` cuyo valor es `1`
 * (incluyendo el conjunto ampliado y múltiples indicadores activos
 * simultáneamente), sin incluir etiqueta alguna de un indicador con valor `0`,
 * `null` o ausente.
 */

/**
 * Mapa estable indicador → etiqueta, en el MISMO orden que `utils.ts` produce
 * la salida. Incluye el conjunto ampliado completo.
 */
const FLAG_LABELS: ReadonlyArray<readonly [keyof ApiVehicle, string]> = [
  ["is_spaceship", "Nave espacial"],
  ["is_cargo", "Carga"],
  ["is_ground_vehicle", "Vehículo terrestre"],
  ["is_mining", "Minería"],
  ["is_salvage", "Salvamento"],
  ["is_refinery", "Refinería"],
  ["is_scanning", "Escaneo"],
  ["is_exploration", "Exploración"],
  ["is_military", "Militar"],
  ["is_civilian", "Civil"],
  ["is_medical", "Médico"],
  ["is_racing", "Carreras"],
  ["is_stealth", "Sigilo"],
];

/** Los tres flags requeridos (siempre presentes): 0 | 1. */
const requiredFlagArb = fc.constantFrom(0, 1);

/**
 * Los flags ampliados pueden ser 1, 0, `null` o ausentes. `undefined` modela
 * la ausencia del campo: `activeClassifications` lo trata igual que ausente
 * (sólo añade la etiqueta cuando el valor es exactamente `1`).
 */
const expandedFlagArb = fc.constantFrom<number | null | undefined>(
  1,
  0,
  null,
  undefined,
);

const vehicleArb: fc.Arbitrary<ApiVehicle> = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  name_full: fc.constant(null),
  scu: fc.constant(null),
  crew: fc.constant(null),
  container_sizes: fc.constant(null),
  pad_type: fc.constant(null),
  company_name: fc.constant(null),
  // Conjunto base (requerido).
  is_spaceship: requiredFlagArb,
  is_cargo: requiredFlagArb,
  is_ground_vehicle: requiredFlagArb,
  // Conjunto ampliado (opcional/anulable).
  is_mining: expandedFlagArb,
  is_salvage: expandedFlagArb,
  is_refinery: expandedFlagArb,
  is_scanning: expandedFlagArb,
  is_exploration: expandedFlagArb,
  is_military: expandedFlagArb,
  is_civilian: expandedFlagArb,
  is_medical: expandedFlagArb,
  is_racing: expandedFlagArb,
  is_stealth: expandedFlagArb,
});

describe("Feature: wiki-detalle-completo, Property 6: Clasificaciones activas ampliadas y completas", () => {
  it("returns exactly the labels of flags equal to 1, in stable order, across base and expanded sets", () => {
    fc.assert(
      fc.property(vehicleArb, (v) => {
        const result = activeClassifications(v);

        // Resultado esperado: etiquetas de los flags === 1, en orden del mapa.
        const expected = FLAG_LABELS.filter(([key]) => v[key] === 1).map(
          ([, label]) => label,
        );

        // Igualdad exacta incluye contenido, ausencia de extras y ORDEN.
        expect(result).toEqual(expected);

        // Ningún indicador con 0/null/ausente aporta etiqueta.
        for (const [key, label] of FLAG_LABELS) {
          if (v[key] !== 1) {
            expect(result).not.toContain(label);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it("returns an empty array when no classification flag is active", () => {
    const vehicle: ApiVehicle = {
      id: 1,
      name: "Test",
      name_full: null,
      scu: null,
      crew: null,
      is_spaceship: 0,
      is_cargo: 0,
      is_ground_vehicle: 0,
      container_sizes: null,
      pad_type: null,
      company_name: null,
    };
    expect(activeClassifications(vehicle)).toEqual([]);
  });

  it("includes expanded labels when multiple flags are simultaneously active", () => {
    const vehicle: ApiVehicle = {
      id: 2,
      name: "Multi",
      name_full: null,
      scu: null,
      crew: null,
      is_spaceship: 1,
      is_cargo: 1,
      is_ground_vehicle: 0,
      container_sizes: null,
      pad_type: null,
      company_name: null,
      is_mining: 1,
      is_military: 1,
      is_stealth: 1,
      is_salvage: 0,
      is_medical: null,
    };
    expect(activeClassifications(vehicle)).toEqual([
      "Nave espacial",
      "Carga",
      "Minería",
      "Militar",
      "Sigilo",
    ]);
  });
});
