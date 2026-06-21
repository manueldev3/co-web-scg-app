import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  validatePost,
  TITLE_MAX,
  CONTENT_MAX,
  CATEGORY_MIN,
  CATEGORY_MAX,
} from "../blog-engine";

// Feature: blog, Property 12: Validación de entrada de blog por longitud y número de categorías
//
// Validates: Requirements 10.2, 10.9, 10.12
//
// Para cualquier combinación de título, contenido y lista de categorías,
// validatePost la acepta si y solo si el título tiene entre 1 y TITLE_MAX (200)
// caracteres, el contenido entre 1 y CONTENT_MAX (50000) caracteres y el número
// de categorías entre CATEGORY_MIN (1) y CATEGORY_MAX (10); en caso contrario
// indica el primer campo inválido (titulo, contenido o categorias).

/** Longitudes que cubren por debajo, dentro y por encima de los límites. */
const titleLenArb: fc.Arbitrary<number> = fc.oneof(
  fc.constantFrom(0, 1, TITLE_MAX, TITLE_MAX + 1),
  fc.integer({ min: 0, max: TITLE_MAX + 20 }),
);
const contentLenArb: fc.Arbitrary<number> = fc.oneof(
  fc.constantFrom(0, 1, CONTENT_MAX, CONTENT_MAX + 1),
  // Rango acotado para mantener el test rápido, cubriendo los bordes.
  fc.integer({ min: 0, max: 60 }),
);
const categoryCountArb: fc.Arbitrary<number> = fc.oneof(
  fc.constantFrom(0, CATEGORY_MIN, CATEGORY_MAX, CATEGORY_MAX + 1),
  fc.integer({ min: 0, max: CATEGORY_MAX + 5 }),
);

function isTitleValid(len: number): boolean {
  return len >= 1 && len <= TITLE_MAX;
}
function isContentValid(len: number): boolean {
  return len >= 1 && len <= CONTENT_MAX;
}
function isCategoriesValid(count: number): boolean {
  return count >= CATEGORY_MIN && count <= CATEGORY_MAX;
}

describe("Feature: blog, Property 12: Validación de entrada de blog por longitud y número de categorías", () => {
  it("acepta sii todos los campos son válidos; si no, indica el primer campo inválido", () => {
    fc.assert(
      fc.property(
        titleLenArb,
        contentLenArb,
        categoryCountArb,
        (titleLen, contentLen, categoryCount) => {
          const title = "t".repeat(titleLen);
          const content = "c".repeat(contentLen);
          const categoryIds = Array.from(
            { length: categoryCount },
            (_, i) => `cat_${i}`,
          );

          const result = validatePost(title, content, categoryIds);

          const titleOk = isTitleValid(titleLen);
          const contentOk = isContentValid(contentLen);
          const categoriesOk = isCategoriesValid(categoryCount);

          if (titleOk && contentOk && categoriesOk) {
            expect(result.ok).toBe(true);
          } else {
            expect(result.ok).toBe(false);
            if (!result.ok) {
              // El primer campo inválido en orden: titulo, contenido, categorias.
              const expectedField = !titleOk
                ? "titulo"
                : !contentOk
                  ? "contenido"
                  : "categorias";
              expect(result.field).toBe(expectedField);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
