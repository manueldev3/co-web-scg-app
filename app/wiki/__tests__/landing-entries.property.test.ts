import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { getLandingEntries, type WikiCategory } from "../registry";

/**
 * Feature: wiki, Property 10: Entradas de la landing derivadas del registro
 *
 * Validates: Requirements 2.1, 2.5, 3.2
 *
 * Para cualquier Registro_Categorias, `getLandingEntries` produce exactamente
 * una entrada por categoría definida, marca como navegables ÚNICAMENTE las
 * categorías activas y como no navegables las `coming_soon`, preservando la
 * identidad (`id`, `label`) y el `status` en el mismo orden.
 */

/**
 * Genera un objeto con forma de `WikiCategory` con estado mixto. Solo los campos
 * de presentación (`id`, `label`, `status`) influyen en `getLandingEntries`; el
 * resto se rellena con valores mínimos válidos (icono nulo, adaptadores stub).
 */
const categoryArb: fc.Arbitrary<WikiCategory> = fc
  .record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    label: fc.string({ minLength: 1, maxLength: 30 }),
    status: fc.constantFrom<"active" | "coming_soon">("active", "coming_soon"),
    description: fc.string({ maxLength: 40 }),
  })
  .map(({ id, label, status, description }) => ({
    id,
    label,
    status,
    description,
    icon: null,
    loadItems: async () => [],
    loadDetail: async () => null,
  }));

describe("Feature: wiki, Property 10: Entradas de la landing derivadas del registro", () => {
  it("produces one entry per category, preserves id/label/status and marks navigable iff active", () => {
    fc.assert(
      fc.property(fc.array(categoryArb, { maxLength: 30 }), (categories) => {
        const entries = getLandingEntries(categories);

        // Req 2.1: exactamente una entrada por categoría definida, en orden.
        expect(entries).toHaveLength(categories.length);

        categories.forEach((category, i) => {
          const entry = entries[i];
          // Req 3.2: preserva la identidad (id, label) y el estado.
          expect(entry.id).toBe(category.id);
          expect(entry.label).toBe(category.label);
          expect(entry.status).toBe(category.status);
          // Req 2.5: navegable solo si la categoría está activa.
          expect(entry.navigable).toBe(category.status === "active");
        });
      }),
      { numRuns: 100 },
    );
  });
});
