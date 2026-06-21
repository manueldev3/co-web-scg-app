import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { orderPublishedPosts } from "../blog-engine";
import type { Post } from "../types";

/**
 * Feature: blog, Property 1: Solo las entradas publicadas son visibles públicamente
 *
 * Validates: Requirements 1.1, 2.6, 2.7
 *
 * For any conjunto de entradas con estados mezclados, `orderPublishedPosts` no
 * devuelve ninguna entrada en estado `borrador`. (La parte de
 * `getPublishedPostBySlug` pertenece a la capa de datos y se valida con pruebas
 * de integración; aquí comprobamos la lógica pura de visibilidad.)
 */

/**
 * Arbitrario auto-contenido de `Post`. Mezcla deliberadamente estados
 * `borrador` y `publicada` (con `status` extraído de un pool pequeño) para que
 * casi todas las muestras contengan ambos, ejercitando así el filtrado de
 * visibilidad. `publishedAt` puede ser null (borrador) o un epoch ms.
 */
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
  categoryIds: fc.uniqueArray(fc.string({ minLength: 1, maxLength: 4 }), {
    maxLength: 5,
  }),
  commentCount: fc.nat({ max: 1000 }),
  likeCount: fc.nat({ max: 1000 }),
});

describe("Feature: blog, Property 1: Solo las entradas publicadas son visibles públicamente", () => {
  it("orderPublishedPosts nunca devuelve entradas en estado borrador", () => {
    fc.assert(
      fc.property(fc.array(postArb, { maxLength: 50 }), (posts) => {
        const result = orderPublishedPosts(posts);

        // Ninguna entrada devuelta está en borrador.
        for (const post of result) {
          expect(post.status).toBe("publicada");
        }

        // Se conservan exactamente todas las publicadas (ninguna omitida ni
        // duplicada): mismo número que las publicadas de entrada.
        const publishedCount = posts.filter(
          (p) => p.status === "publicada",
        ).length;
        expect(result.length).toBe(publishedCount);
      }),
      { numRuns: 100 },
    );
  });
});
