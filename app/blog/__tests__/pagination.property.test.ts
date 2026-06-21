import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { paginate, POSTS_PER_PAGE } from "../blog-engine";

/**
 * Feature: blog, Property 4: La paginación particiona la lista ordenada sin huecos ni solapamientos
 *
 * Validates: Requirements 1.8, 1.9
 *
 * For any lista ordenada de entradas y cualquier tamaño de página, cada página
 * devuelta por `paginate` contiene como máximo `pageSize` elementos (y, con el
 * tamaño por defecto `POSTS_PER_PAGE`, como máximo 10) y la concatenación de
 * todas las páginas en orden reproduce exactamente la lista original, sin
 * duplicar ni omitir ningún elemento y preservando el orden.
 */

describe("Feature: blog, Property 4: La paginación particiona la lista ordenada sin huecos ni solapamientos", () => {
  it("cada página <= pageSize y la concatenación de páginas reproduce la lista original", () => {
    fc.assert(
      fc.property(
        // Elementos distintos (índices) para detectar duplicados/omisiones.
        fc.array(fc.integer({ min: 0, max: 10_000 }), { maxLength: 60 }),
        fc.integer({ min: 1, max: 15 }),
        (items, pageSize) => {
          const first = paginate(items, pageSize, 0);
          const totalPages = first.totalPages;

          // Con lista vacía no hay páginas.
          if (items.length === 0) {
            expect(totalPages).toBe(0);
            expect(first.items).toEqual([]);
            return;
          }

          // totalPages es el número de bloques de tamaño pageSize.
          expect(totalPages).toBe(Math.ceil(items.length / pageSize));

          const reconstructed: number[] = [];
          for (let i = 0; i < totalPages; i++) {
            const page = paginate(items, pageSize, i);
            // El índice de página devuelto coincide con el solicitado.
            expect(page.pageIndex).toBe(i);
            // Cada página tiene como máximo pageSize elementos.
            expect(page.items.length).toBeLessThanOrEqual(pageSize);
            // Toda página dentro del rango es no vacía.
            expect(page.items.length).toBeGreaterThan(0);
            reconstructed.push(...page.items);
          }

          // La concatenación reproduce exactamente la lista original (orden,
          // sin duplicados ni omisiones).
          expect(reconstructed).toEqual(items);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("con el tamaño por defecto POSTS_PER_PAGE cada página tiene como máximo 10 elementos", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 10_000 }), { maxLength: 60 }),
        (items) => {
          const first = paginate(items, POSTS_PER_PAGE, 0);
          for (let i = 0; i < first.totalPages; i++) {
            const page = paginate(items, POSTS_PER_PAGE, i);
            expect(page.items.length).toBeLessThanOrEqual(POSTS_PER_PAGE);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
