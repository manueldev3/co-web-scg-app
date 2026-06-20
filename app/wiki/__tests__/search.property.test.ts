import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { searchWiki } from "../utils";
import type { WikiSearchResult } from "../types";

/**
 * Feature: wiki, Property 8: Búsqueda integral en categorías activas
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 3.3
 *
 * Para cualquier conjunto de elementos buscables derivado de las categorías
 * activas y para cualquier texto de búsqueda no vacío, todos los resultados de
 * `searchWiki` pertenecen a categorías activas, coinciden con el texto de forma
 * insensible a mayúsculas/minúsculas, e incluyen nombre, etiqueta de categoría
 * y un `href` con la forma `/wiki/{categoryId}/{slug}`.
 */

/**
 * Pool of "active" categories. Searchable items are derived only from these,
 * so every result must belong to one of them (Req 3.3, 6.1).
 */
const activeCategoryArb: fc.Arbitrary<{
  categoryId: string;
  categoryLabel: string;
}> = fc.constantFrom(
  { categoryId: "naves", categoryLabel: "Naves" },
  { categoryId: "vehiculos", categoryLabel: "Vehículos terrestres" },
  { categoryId: "armas", categoryLabel: "Armas" },
);

/**
 * Randomly cases each character of a string so generated queries exercise
 * case-insensitive matching (Req 6.2).
 */
function mixCasing(s: string, toggles: boolean[]): string {
  return s
    .split("")
    .map((ch, i) =>
      toggles[i % Math.max(toggles.length, 1)]
        ? ch.toUpperCase()
        : ch.toLowerCase(),
    )
    .join("");
}

/**
 * Builds a WikiSearchResult from an active category plus a name/slug, ensuring
 * the href has the canonical `/wiki/{categoryId}/{slug}` shape.
 */
const searchResultArb: fc.Arbitrary<WikiSearchResult> = fc
  .record({
    category: activeCategoryArb,
    name: fc.string({ minLength: 1, maxLength: 20 }),
    slug: fc.string({ minLength: 1, maxLength: 20 }).map(
      (s) =>
        s
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "x",
    ),
  })
  .map(({ category, name, slug }) => ({
    name,
    categoryId: category.categoryId,
    categoryLabel: category.categoryLabel,
    slug,
    href: `/wiki/${category.categoryId}/${slug}`,
  }));

const activeCategoryIds = new Set(["naves", "vehiculos", "armas"]);

describe("Feature: wiki, Property 8: Búsqueda integral en categorías activas", () => {
  it("results belong to active categories, match case-insensitively, and carry name/label/href", () => {
    fc.assert(
      fc.property(
        fc.array(searchResultArb, { maxLength: 30 }),
        // A non-empty query: either an arbitrary non-blank string or a
        // mixed-casing substring of one of the item names (to produce hits).
        fc.oneof(
          fc
            .string({ minLength: 1, maxLength: 10 })
            .filter((s) => s.trim() !== ""),
          fc.tuple(
            fc.nat(),
            fc.nat(),
            fc.nat(),
            fc.array(fc.boolean(), { minLength: 1, maxLength: 8 }),
          ),
        ),
        (items, querySeed) => {
          let query: string;
          if (typeof querySeed === "string") {
            query = querySeed;
          } else if (items.length === 0) {
            query = "abc"; // no items to derive from; any non-empty query
          } else {
            const [itemIdx, start, len, toggles] = querySeed;
            const source = items[itemIdx % items.length].name;
            const startIdx = source.length === 0 ? 0 : start % source.length;
            const sub =
              source.slice(
                startIdx,
                startIdx + (len % source.length || source.length),
              ) || source;
            query = mixCasing(sub, toggles);
            if (query.trim() === "") query = "abc";
          }

          const results = searchWiki(query, items);
          const needle = query.trim().toLowerCase();
          const itemSet = new Set(items);

          for (const result of results) {
            // Req 3.3 / 6.1: result belongs to an active category.
            expect(activeCategoryIds.has(result.categoryId)).toBe(true);
            // Result is one of the input items (no fabricated entries).
            expect(itemSet.has(result)).toBe(true);
            // Req 6.2: name matches the query case-insensitively.
            expect(result.name.toLowerCase().includes(needle)).toBe(true);
            // Req 6.3: result carries name and category label.
            expect(typeof result.name).toBe("string");
            expect(result.categoryLabel.length).toBeGreaterThan(0);
            // href has the canonical /wiki/{categoryId}/{slug} shape.
            expect(result.href).toBe(
              `/wiki/${result.categoryId}/${result.slug}`,
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
