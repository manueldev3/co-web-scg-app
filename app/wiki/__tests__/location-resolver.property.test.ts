import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { buildLocationNameResolver, MISSING_DATA } from "../utils";
import type { ApiTerminal } from "../types";

/**
 * Feature: wiki-detalle-completo, Property 3: Resolución de nombre de ubicación con fallback
 *
 * Validates: Requirements 4.4, 4.5
 *
 * Para cualquier lista de `ApiTerminal` y para cualquier par
 * (`idTerminal`, `fallbackName`), el resolver de `buildLocationNameResolver`
 * devuelve el nombre del terminal cuyo `id` coincide con `idTerminal` cuando
 * tal terminal existe; cuando no existe ninguna coincidencia, devuelve
 * `fallbackName` si este no es un Dato_Faltante ni cadena vacía, y el marcador
 * de Dato_Faltante en caso contrario.
 */

const terminalArb: fc.Arbitrary<ApiTerminal> = fc.record({
  // ids constreñidos a un rango pequeño para forzar coincidencias y colisiones.
  id: fc.integer({ min: 1, max: 8 }),
  name: fc.string({ minLength: 1, maxLength: 20 }),
});

const fallbackArb = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.constant(""),
  fc.string({ minLength: 1, maxLength: 15 }),
);

describe("Feature: wiki-detalle-completo, Property 3: Resolución de nombre de ubicación con fallback", () => {
  it("resolves matching terminal name, else fallback, else the missing-data marker", () => {
    fc.assert(
      fc.property(
        fc.array(terminalArb, { maxLength: 12 }),
        // idTerminal cubre tanto ids dentro como fuera del conjunto.
        fc.integer({ min: 1, max: 12 }),
        fallbackArb,
        (terminals, idTerminal, fallbackName) => {
          const resolve = buildLocationNameResolver(terminals);
          const result = resolve(idTerminal, fallbackName);

          // El resolver usa un Map; ante ids duplicados gana el último.
          const matches = terminals.filter((t) => t.id === idTerminal);
          const expectedName =
            matches.length > 0 ? matches[matches.length - 1].name : undefined;

          if (expectedName !== undefined) {
            expect(result).toBe(expectedName);
          } else if (fallbackName != null && fallbackName !== "") {
            expect(result).toBe(fallbackName);
          } else {
            expect(result).toBe(MISSING_DATA);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
