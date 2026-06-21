import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { isCategoryNameTaken } from "../blog-engine";
import type { Category } from "../types";

// Feature: blog, Property 13: Unicidad de nombre de categoría insensible a mayúsculas
//
// Validates: Requirements 10.6, 10.7
//
// Para cualquier conjunto de categorías existentes y cualquier nombre candidato,
// isCategoryNameTaken devuelve verdadero si y solo si existe una categoría cuyo
// nombre coincide con el candidato ignorando diferencias de mayúsculas y
// minúsculas.

/** Pool de nombres con variantes de may/min para ejercitar la insensibilidad. */
const NAME_POOL = [
  "Naves",
  "naves",
  "NAVES",
  "Comercio",
  "comercio",
  "Minería",
  "Eventos",
] as const;

const categoryArb: fc.Arbitrary<Category> = fc
  .constantFrom(...NAME_POOL)
  .chain((name) =>
    fc.record({
      id: fc.string({ minLength: 1, maxLength: 8 }),
      name: fc.constant(name),
      nameLower: fc.constant(name.toLowerCase()),
    }),
  );

const candidateArb: fc.Arbitrary<string> = fc.oneof(
  fc.constantFrom(...NAME_POOL),
  fc.constantFrom("nAvEs", "COMERCIO", "minería", "Desconocida", "naves "),
  fc.string({ minLength: 0, maxLength: 10 }),
);

describe("Feature: blog, Property 13: Unicidad de nombre de categoría insensible a mayúsculas", () => {
  it("devuelve true sii alguna categoría coincide ignorando may/min", () => {
    fc.assert(
      fc.property(
        fc.array(categoryArb, { maxLength: 20 }),
        candidateArb,
        (existing, candidate) => {
          const result = isCategoryNameTaken(existing, candidate);

          const expected = existing.some(
            (c) => c.name.toLowerCase() === candidate.toLowerCase(),
          );

          expect(result).toBe(expected);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("detecta coincidencias que solo difieren en mayúsculas/minúsculas", () => {
    fc.assert(
      fc.property(fc.constantFrom(...NAME_POOL), (name) => {
        const existing: Category[] = [
          { id: "c1", name, nameLower: name.toLowerCase() },
        ];
        // El mismo nombre en mayúsculas y en minúsculas debe considerarse tomado.
        expect(isCategoryNameTaken(existing, name.toUpperCase())).toBe(true);
        expect(isCategoryNameTaken(existing, name.toLowerCase())).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
