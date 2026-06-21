import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { toggleLike } from "../blog-engine";

// Feature: blog, Property 7: Conmutar «me gusta» es una involución que mantiene un único like por usuario
//
// Validates: Requirements 5.4, 5.5, 5.6
//
// Para cualquier conjunto de usuarios que ya dieron «me gusta» y cualquier
// usuario, aplicar toggleLike una vez añade al usuario e incrementa el contador
// en 1 si estaba ausente, o lo elimina y decrementa en 1 si estaba presente;
// aplicar toggleLike dos veces sobre el mismo usuario restaura el conjunto y el
// contador originales, y la pertenencia nunca cuenta a un usuario más de una vez.

/** Conjunto de usuarios que ya dieron like (uids únicos). */
const likedByArb: fc.Arbitrary<Set<string>> = fc
  .uniqueArray(
    fc.string({ minLength: 1, maxLength: 6 }).map((s) => `u_${s}`),
    { maxLength: 20 },
  )
  .map((arr) => new Set(arr));

/** Un userId que puede estar presente o ausente en el conjunto. */
const userIdArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 6 })
  .map((s) => `u_${s}`);

describe("Feature: blog, Property 7: Conmutar «me gusta» es una involución que mantiene un único like por usuario", () => {
  it("añade/elimina según presencia, ajusta el contador en ±1 y no muta la entrada", () => {
    fc.assert(
      fc.property(likedByArb, userIdArb, (likedBy, userId) => {
        const before = new Set(likedBy);
        const wasPresent = likedBy.has(userId);
        const originalCount = likedBy.size;

        const result = toggleLike(likedBy, userId);

        // No muta el conjunto de entrada.
        expect(likedBy).toEqual(before);

        if (wasPresent) {
          // Estaba presente: se elimina, liked false, contador -1.
          expect(result.likedBy.has(userId)).toBe(false);
          expect(result.liked).toBe(false);
          expect(result.count).toBe(originalCount - 1);
        } else {
          // Estaba ausente: se añade, liked true, contador +1.
          expect(result.likedBy.has(userId)).toBe(true);
          expect(result.liked).toBe(true);
          expect(result.count).toBe(originalCount + 1);
        }

        // El contador siempre coincide con el tamaño del conjunto (un like por usuario).
        expect(result.count).toBe(result.likedBy.size);
      }),
      { numRuns: 100 },
    );
  });

  it("es una involución: aplicar toggleLike dos veces restaura conjunto y contador", () => {
    fc.assert(
      fc.property(likedByArb, userIdArb, (likedBy, userId) => {
        const originalCount = likedBy.size;

        const once = toggleLike(likedBy, userId);
        const twice = toggleLike(once.likedBy, userId);

        // El conjunto vuelve al original.
        expect(twice.likedBy).toEqual(likedBy);
        expect(twice.count).toBe(originalCount);
        // El estado liked refleja la pertenencia original.
        expect(twice.liked).toBe(likedBy.has(userId));
      }),
      { numRuns: 100 },
    );
  });

  it("aplicar toggleLike repetidamente nunca registra más de un like por usuario", () => {
    fc.assert(
      fc.property(
        likedByArb,
        userIdArb,
        fc.integer({ min: 1, max: 6 }),
        (likedBy, userId, times) => {
          let current = new Set(likedBy);
          for (let i = 0; i < times; i++) {
            current = toggleLike(current, userId).likedBy;
          }
          // Como mucho una aparición del usuario; un Set garantiza unicidad.
          const occurrences = [...current].filter((u) => u === userId).length;
          expect(occurrences).toBeLessThanOrEqual(1);
        },
      ),
      { numRuns: 100 },
    );
  });
});
