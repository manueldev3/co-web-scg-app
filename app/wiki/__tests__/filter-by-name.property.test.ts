import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { filterByName } from "../utils";
import type { WikiListItem } from "../types";

/**
 * Feature: wiki, Property 3: Filtro por nombre del listado
 *
 * Validates: Requirements 4.5
 *
 * Para cualquier lista de WikiListItem y para cualquier texto de filtro,
 * `filterByName` devuelve exactamente el subconjunto de elementos cuyo nombre
 * contiene el texto de forma insensible a mayúsculas/minúsculas: todo elemento
 * coincidente está incluido y ningún elemento no coincidente aparece,
 * preservando el orden original y sin añadir elementos.
 */

/**
 * WikiListItem arbitrary. The `name` is drawn so that it mixes casing and can
 * share fragments with the generated queries (the query arbitrary below pulls
 * from overlapping token pools), guaranteeing both matching and non-matching
 * items are exercised across runs.
 */
const wikiListItemArb: fc.Arbitrary<WikiListItem> = fc.record({
  id: fc.oneof(fc.integer(), fc.string({ minLength: 1, maxLength: 8 })),
  categoryId: fc.constant("naves"),
  name: fc.string({ minLength: 0, maxLength: 30 }),
  slug: fc.string({ minLength: 1, maxLength: 30 }),
  subtitle: fc.string({ minLength: 0, maxLength: 30 }),
});

// Queries include mixed-case fragments and substrings likely to appear in names
// (the empty string is included to exercise the "matches everything" case).
const queryArb: fc.Arbitrary<string> = fc.oneof(
  fc.string({ minLength: 0, maxLength: 10 }),
  fc.constantFrom("", "a", "A", "e", "Aurora", "MR", "mr", "ship", "X", "-"),
);

describe("Feature: wiki, Property 3: Filtro por nombre del listado", () => {
  it("devuelve exactamente los elementos cuyo nombre contiene el texto (case-insensitive), preservando el orden", () => {
    fc.assert(
      fc.property(
        fc.array(wikiListItemArb, { maxLength: 50 }),
        queryArb,
        (items, q) => {
          const result = filterByName(items, q);

          // Expected subset computed independently, preserving order.
          const needle = q.toLowerCase();
          const expected = items.filter((item) =>
            item.name.toLowerCase().includes(needle),
          );

          // Exact subset, same order, no additions or omissions.
          expect(result).toEqual(expected);

          // Every returned item is a true match.
          for (const item of result) {
            expect(item.name.toLowerCase().includes(needle)).toBe(true);
          }

          // No non-matching item is present.
          for (const item of items) {
            if (!item.name.toLowerCase().includes(needle)) {
              expect(result).not.toContain(item);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
