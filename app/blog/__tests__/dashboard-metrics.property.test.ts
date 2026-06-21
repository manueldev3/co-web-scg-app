import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { computeDashboardMetrics } from "../blog-engine";
import type { Post, Comment, Like } from "../types";

// Feature: blog, Property 8: Las métricas del dashboard agregan correctamente los datos
//
// Validates: Requirements 7.1, 7.2, 7.3, 7.4
//
// Para cualquier conjunto de entradas, comentarios y «me gusta»,
// computeDashboardMetrics devuelve totalPosts igual al número de entradas,
// postsWithComments igual al número de entradas con al menos un comentario
// asociado, totalComments igual al número total de comentarios y totalLikes
// igual al número total de «me gusta», siendo las cuatro métricas enteros >= 0.

/** Pool pequeño de ids de entrada para forzar coincidencias post/comentario. */
const POST_ID_POOL = ["p1", "p2", "p3", "p4", "p5"] as const;

const postArb: fc.Arbitrary<Post> = fc.record({
  id: fc.constantFrom(...POST_ID_POOL),
  slug: fc.string({ minLength: 1, maxLength: 12 }),
  title: fc.string({ minLength: 1, maxLength: 30 }),
  content: fc.string({ minLength: 1, maxLength: 50 }),
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

/** Entradas con ids únicos (las colecciones reales no repiten id de entrada). */
const postsArb: fc.Arbitrary<Post[]> = fc
  .uniqueArray(postArb, { maxLength: 5, selector: (p) => p.id })
  .map((posts) => posts);

const commentArb: fc.Arbitrary<Comment> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 8 }),
  // Puede referenciar una entrada existente o una inexistente.
  postId: fc.oneof(
    fc.constantFrom(...POST_ID_POOL),
    fc.string({ minLength: 1, maxLength: 6 }).map((s) => `x_${s}`),
  ),
  authorId: fc.string({ minLength: 1, maxLength: 8 }),
  content: fc.string({ minLength: 1, maxLength: 50 }),
  createdAt: fc.integer({ min: 0, max: 2_000_000_000_000 }),
});

const likeArb: fc.Arbitrary<Like> = fc.record({
  postId: fc.oneof(
    fc.constantFrom(...POST_ID_POOL),
    fc.string({ minLength: 1, maxLength: 6 }).map((s) => `x_${s}`),
  ),
  userId: fc.string({ minLength: 1, maxLength: 8 }),
  createdAt: fc.integer({ min: 0, max: 2_000_000_000_000 }),
});

describe("Feature: blog, Property 8: Las métricas del dashboard agregan correctamente los datos", () => {
  it("agrega totales y entradas con comentarios como enteros >= 0", () => {
    fc.assert(
      fc.property(
        postsArb,
        fc.array(commentArb, { maxLength: 30 }),
        fc.array(likeArb, { maxLength: 30 }),
        (posts, comments, likes) => {
          const metrics = computeDashboardMetrics(posts, comments, likes);

          // totalPosts = número de entradas.
          expect(metrics.totalPosts).toBe(posts.length);
          // totalComments = número total de comentarios.
          expect(metrics.totalComments).toBe(comments.length);
          // totalLikes = número total de «me gusta».
          expect(metrics.totalLikes).toBe(likes.length);

          // postsWithComments = entradas existentes con >= 1 comentario asociado.
          const commentedPostIds = new Set(comments.map((c) => c.postId));
          const expectedWithComments = posts.filter((p) =>
            commentedPostIds.has(p.id),
          ).length;
          expect(metrics.postsWithComments).toBe(expectedWithComments);

          // postsWithComments nunca supera totalPosts.
          expect(metrics.postsWithComments).toBeLessThanOrEqual(
            metrics.totalPosts,
          );

          // Las cuatro métricas son enteros >= 0.
          for (const value of [
            metrics.totalPosts,
            metrics.postsWithComments,
            metrics.totalComments,
            metrics.totalLikes,
          ]) {
            expect(Number.isInteger(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
