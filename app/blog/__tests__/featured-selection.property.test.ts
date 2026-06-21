import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { selectFeatured } from "../blog-engine";
import type { Post } from "../types";

/**
 * Feature: blog, Property 14: Selección de entradas destacadas
 *
 * Validates: Requirements 11.2, 11.3, 11.4, 11.5, 11.9
 *
 * For any conjunto de entradas publicadas y cualquier cantidad objetivo `count`,
 * `selectFeatured` devuelve una lista cuyo primer elemento es la entrada
 * publicada más reciente, cuyos elementos restantes son las entradas con mayor
 * número de comentarios (desempatando por fecha de publicación más reciente),
 * sin repetir ninguna entrada, y cuyo tamaño es el mínimo entre `count` y el
 * número de entradas publicadas disponibles.
 */

const STATUS_POOL = ["publicada", "borrador"] as const;

/**
 * Arbitrario de entrada con estado mixto. Las fechas y los recuentos de
 * comentarios se extraen de rangos pequeños para forzar empates frecuentes y
 * ejercitar el desempate. Los `id` se fuerzan únicos a nivel de array.
 */
const postArb: fc.Arbitrary<Post> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }),
  slug: fc.string({ minLength: 1, maxLength: 12 }),
  title: fc.constantFrom("alfa", "beta", "gamma", "delta"),
  content: fc.string({ minLength: 0, maxLength: 30 }),
  status: fc.constantFrom(...STATUS_POOL),
  publishedAt: fc.constantFrom(1000, 2000, 3000, 4000),
  createdAt: fc.integer({ min: 0, max: 2_000_000_000_000 }),
  updatedAt: fc.integer({ min: 0, max: 2_000_000_000_000 }),
  categoryIds: fc.uniqueArray(fc.string({ minLength: 1, maxLength: 4 }), {
    maxLength: 3,
  }),
  commentCount: fc.nat({ max: 5 }),
  likeCount: fc.nat({ max: 100 }),
});

// Entradas con `id` único (la selección usa el `id` para evitar repeticiones).
const postsArb = fc.uniqueArray(postArb, {
  maxLength: 30,
  selector: (post) => post.id,
});

describe("Feature: blog, Property 14: Selección de entradas destacadas", () => {
  it("primer elemento más reciente, resto top por comentarios, sin repetir y tamaño correcto", () => {
    fc.assert(
      fc.property(postsArb, fc.integer({ min: 0, max: 10 }), (posts, count) => {
        const published = posts.filter((p) => p.status === "publicada");
        const result = selectFeatured(posts, count);

        // Tamaño = min(count, #publicadas).
        const expectedSize = Math.min(count, published.length);
        expect(result.length).toBe(expectedSize);

        if (result.length === 0) {
          return;
        }

        // Todos los devueltos están publicados.
        for (const post of result) {
          expect(post.status).toBe("publicada");
        }

        // Sin repeticiones (por id).
        const ids = result.map((p) => p.id);
        expect(new Set(ids).size).toBe(ids.length);

        // Primer elemento: la fecha de publicación máxima entre las publicadas.
        const maxPublishedAt = Math.max(
          ...published.map((p) => p.publishedAt ?? 0),
        );
        expect(result[0].publishedAt ?? 0).toBe(maxPublishedAt);

        // Elementos restantes: top por número de comentarios respecto del
        // resto de publicadas (excluida la entrada ya seleccionada como
        // primera). Cualquier seleccionado tiene >= comentarios que cualquier
        // no seleccionado del mismo conjunto.
        const selected = new Set(result);
        const remainingSelected = result.slice(1);
        const unselectedPool = published.filter(
          (p) => p !== result[0] && !selected.has(p),
        );

        for (const sel of remainingSelected) {
          for (const unsel of unselectedPool) {
            expect(sel.commentCount).toBeGreaterThanOrEqual(unsel.commentCount);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
