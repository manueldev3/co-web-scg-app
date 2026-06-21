import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateCommentContent, COMMENT_MAX } from "../blog-engine";

// Feature: blog, Property 5: Validación de contenido de comentario por longitud efectiva
//
// Validates: Requirements 4.6, 4.7
//
// Para cualquier cadena de entrada, validateCommentContent la acepta si y solo
// si su longitud tras recortar espacios está entre 1 y COMMENT_MAX (2000);
// rechaza con error "vacio" las cadenas vacías o solo con espacios en blanco y
// con error "excede_limite" las que superan 2000 caracteres tras recorte.

/** Caracteres de espacio en blanco que `String.prototype.trim` elimina. */
const whitespaceArb: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(" ", "\t", "\n", "\r", "\f", "\v", "\u00a0"), {
    minLength: 0,
    maxLength: 10,
  })
  .map((chars) => chars.join(""));

describe("Feature: blog, Property 5: Validación de contenido de comentario por longitud efectiva", () => {
  it("acepta si y solo si la longitud efectiva (tras recorte) está entre 1 y COMMENT_MAX", () => {
    fc.assert(
      fc.property(
        // Cadenas arbitrarias, incluyendo posibles espacios alrededor y dentro.
        fc.string({ minLength: 0, maxLength: COMMENT_MAX + 50 }),
        (raw) => {
          const result = validateCommentContent(raw);
          const trimmed = raw.trim();
          const effective = trimmed.length;

          if (effective === 0) {
            expect(result.ok).toBe(false);
            if (!result.ok) {
              expect(result.error).toBe("vacio");
            }
          } else if (effective > COMMENT_MAX) {
            expect(result.ok).toBe(false);
            if (!result.ok) {
              expect(result.error).toBe("excede_limite");
            }
          } else {
            expect(result.ok).toBe(true);
            if (result.ok) {
              // El valor devuelto es exactamente el contenido recortado.
              expect(result.value).toBe(trimmed);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rechaza con "vacio" toda cadena compuesta solo por espacios en blanco', () => {
    fc.assert(
      fc.property(whitespaceArb, (blank) => {
        const result = validateCommentContent(blank);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBe("vacio");
        }
      }),
      { numRuns: 100 },
    );
  });

  it('rechaza con "excede_limite" todo contenido cuya longitud efectiva supera COMMENT_MAX', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: COMMENT_MAX + 1, max: COMMENT_MAX + 200 }),
        (len) => {
          // Contenido no blanco cuya longitud tras recorte excede el límite.
          const raw = "a".repeat(len);
          const result = validateCommentContent(raw);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toBe("excede_limite");
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
