import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { orderPublishedPosts } from "../blog-engine";
import type { Post } from "../types";

/**
 * Feature: blog, Property 2: Orden del listado por fecha descendente y título ascendente
 *
 * Validates: Requirements 1.2, 1.3
 *
 * For any conjunto de entradas publicadas, `orderPublishedPosts` produce una
 * secuencia en la que cada entrada tiene una fecha de publicación mayor o igual
 * que la siguiente y, cuando dos entradas comparten fecha de publicación,
 * aparecen ordenadas entre sí por título en orden alfabético ascendente.
 */

/**
 * Arbitrario de entradas YA publicadas. `publishedAt` se extrae de un pool
 * pequeño de fechas para forzar empates frecuentes y ejercitar el desempate por
 * título. Los títulos se toman de un pool pequeño para producir comparaciones
 * alfabéticas significativas (incluyendo títulos iguales).
 */
const DATE_POOL = [1000, 2000, 3000] as const;
const TITLE_POOL = ["alfa", "beta", "Alfa", "gamma", "beta"] as const;

const publishedPostArb: fc.Arbitrary<Post> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 8 }),
  slug: fc.string({ minLength: 1, maxLength: 12 }),
  title: fc.constantFrom(...TITLE_POOL),
  content: fc.string({ minLength: 0, maxLength: 50 }),
  status: fc.constant("publicada" as const),
  publishedAt: fc.constantFrom(...DATE_POOL),
  createdAt: fc.integer({ min: 0, max: 2_000_000_000_000 }),
  updatedAt: fc.integer({ min: 0, max: 2_000_000_000_000 }),
  categoryIds: fc.uniqueArray(fc.string({ minLength: 1, maxLength: 4 }), {
    maxLength: 5,
  }),
  commentCount: fc.nat({ max: 1000 }),
  likeCount: fc.nat({ max: 1000 }),
});

describe("Feature: blog, Property 2: Orden del listado por fecha descendente y título ascendente", () => {
  it("cada entrada precede a la siguiente por fecha desc y, en empate, por título asc", () => {
    fc.assert(
      fc.property(fc.array(publishedPostArb, { maxLength: 50 }), (posts) => {
        const result = orderPublishedPosts(posts);

        for (let i = 0; i + 1 < result.length; i++) {
          const current = result[i];
          const next = result[i + 1];
          const currentDate = current.publishedAt ?? 0;
          const nextDate = next.publishedAt ?? 0;

          // Fecha descendente: la actual es mayor o igual que la siguiente.
          expect(currentDate).toBeGreaterThanOrEqual(nextDate);

          // En empate de fecha, título alfabético ascendente.
          if (currentDate === nextDate) {
            expect(current.title.localeCompare(next.title)).toBeLessThanOrEqual(
              0,
            );
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
