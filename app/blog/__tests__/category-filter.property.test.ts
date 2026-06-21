import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { filterByCategory } from "../blog-engine";
import type { Post } from "../types";

/**
 * Feature: blog, Property 3: Filtrado por categoría devuelve solo publicadas de esa categoría
 *
 * Validates: Requirements 1.4, 1.10
 *
 * For any conjunto de entradas y cualquier identificador de categoría, todas
 * las entradas devueltas por `filterByCategory` están en estado `publicada` y
 * tienen ese identificador en sus categorías, y ninguna entrada publicada de
 * esa categoría queda omitida.
 */

/**
 * Pool pequeño de identificadores de categoría: tanto el `categoryIds` de cada
 * entrada como el término de filtrado se extraen de aquí para que los aciertos
 * y los descartes ocurran con frecuencia, ejercitando ambas ramas del filtro.
 */
const CATEGORY_POOL = ["c1", "c2", "c3", "c4"] as const;

const postArb: fc.Arbitrary<Post> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 8 }),
  slug: fc.string({ minLength: 1, maxLength: 12 }),
  title: fc.string({ minLength: 0, maxLength: 30 }),
  content: fc.string({ minLength: 0, maxLength: 50 }),
  status: fc.constantFrom("borrador" as const, "publicada" as const),
  publishedAt: fc.option(fc.integer({ min: 0, max: 2_000_000_000_000 }), {
    nil: null,
  }),
  createdAt: fc.integer({ min: 0, max: 2_000_000_000_000 }),
  updatedAt: fc.integer({ min: 0, max: 2_000_000_000_000 }),
  categoryIds: fc.uniqueArray(fc.constantFrom(...CATEGORY_POOL), {
    maxLength: CATEGORY_POOL.length,
  }),
  commentCount: fc.nat({ max: 1000 }),
  likeCount: fc.nat({ max: 1000 }),
});

describe("Feature: blog, Property 3: Filtrado por categoría devuelve solo publicadas de esa categoría", () => {
  it("solo publicadas de la categoría y ninguna publicada de esa categoría omitida", () => {
    fc.assert(
      fc.property(
        fc.array(postArb, { maxLength: 50 }),
        fc.constantFrom(...CATEGORY_POOL),
        (posts, categoryId) => {
          const result = filterByCategory(posts, categoryId);

          // Toda entrada devuelta es publicada y contiene la categoría.
          for (const post of result) {
            expect(post.status).toBe("publicada");
            expect(post.categoryIds).toContain(categoryId);
          }

          // Ninguna entrada publicada de esa categoría queda omitida: el conteo
          // coincide exactamente con las que cumplen ambas condiciones.
          const expectedCount = posts.filter(
            (p) =>
              p.status === "publicada" && p.categoryIds.includes(categoryId),
          ).length;
          expect(result.length).toBe(expectedCount);
        },
      ),
      { numRuns: 100 },
    );
  });
});
