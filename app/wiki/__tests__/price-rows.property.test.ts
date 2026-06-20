import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  buildPriceRows,
  type LocationNameResolver,
  type NormalizedPriceRow,
} from "../utils";

/**
 * Feature: wiki-detalle-completo, Property 4: Filtrado y completitud de las filas de precio
 *
 * Validates: Requirements 4.2, 4.3, 4.6
 *
 * Para cualquier `id_vehicle`, para cualquier lista de filas de precio y para
 * cualquier resolver de ubicaciones, `buildPriceRows` devuelve exactamente una
 * `PriceRow` por cada fila cuyo `id_vehicle` coincide con el indicado (ninguna
 * fila de otro vehículo aparece y ninguna fila coincidente se omite),
 * preservando el orden, con `price` igual al importe de la fila y
 * `locationName` igual al resultado del resolver para el `id_terminal` y el
 * `terminal_name` de esa fila.
 */

/** Resolver mock determinista que codifica sus argumentos en el resultado. */
const resolver: LocationNameResolver = (idTerminal, fallbackName) =>
  `loc#${idTerminal}|${fallbackName ?? "∅"}`;

const fallbackArb = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.constant(""),
  fc.string({ minLength: 1, maxLength: 10 }),
);

const priceRowArb: fc.Arbitrary<NormalizedPriceRow> = fc.record({
  // id_vehicle constreñido a un rango pequeño para mezclar coincidencias.
  id_vehicle: fc.integer({ min: 1, max: 5 }),
  id_terminal: fc.integer({ min: 1, max: 50 }),
  terminal_name: fallbackArb,
  price: fc.integer({ min: 0, max: 10_000_000 }),
});

describe("Feature: wiki-detalle-completo, Property 4: Filtrado y completitud de las filas de precio", () => {
  it("keeps exactly the matching vehicle rows in order, with resolved location and preserved price", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.array(priceRowArb, { maxLength: 30 }),
        (vehicleId, rows) => {
          const result = buildPriceRows(vehicleId, rows, resolver);

          const expected = rows
            .filter((row) => row.id_vehicle === vehicleId)
            .map((row) => ({
              locationName: resolver(row.id_terminal, row.terminal_name),
              price: row.price,
            }));

          // Igualdad exacta cubre: una fila por coincidencia, ninguna ajena,
          // orden preservado, price preservado y locationName resuelto.
          expect(result).toEqual(expected);

          // Ninguna fila de otro vehículo se cuela en el conteo.
          const matchCount = rows.filter(
            (row) => row.id_vehicle === vehicleId,
          ).length;
          expect(result).toHaveLength(matchCount);
        },
      ),
      { numRuns: 100 },
    );
  });
});
