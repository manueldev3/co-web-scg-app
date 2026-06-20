import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { searchWiki } from "../utils";
import type { WikiSearchResult } from "../types";

// Feature: wiki, Property 9: Texto vacío sin resultados
//
// Validates: Requirements 6.6
//
// For any set of searchable items and any text composed only of whitespace
// (including the empty string), searchWiki returns an empty list.

/**
 * Self-contained WikiSearchResult arbitrary. Names are allowed to be any
 * string (including ones that contain whitespace) so the property is exercised
 * against items that a naive `includes("")` check would otherwise match.
 */
const wikiSearchResultArb: fc.Arbitrary<WikiSearchResult> = fc
  .record({
    name: fc.string(),
    categoryId: fc.string({ minLength: 1, maxLength: 20 }),
    categoryLabel: fc.string({ minLength: 1, maxLength: 20 }),
    slug: fc.string({ minLength: 1, maxLength: 30 }),
  })
  .map((r) => ({
    ...r,
    href: `/wiki/${r.categoryId}/${r.slug}`,
  }));

/**
 * Whitespace-only query arbitrary: the empty string, or any combination of
 * whitespace characters (spaces, tabs, newlines, carriage returns, form feeds,
 * vertical tabs).
 */
const whitespaceQueryArb: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(" ", "\t", "\n", "\r", "\f", "\v"), { maxLength: 12 })
  .map((chars) => chars.join(""));

describe("Feature: wiki, Property 9: Texto vacío sin resultados", () => {
  it("returns an empty list for any whitespace-only (or empty) query", () => {
    fc.assert(
      fc.property(
        fc.array(wikiSearchResultArb, { maxLength: 30 }),
        whitespaceQueryArb,
        (items, query) => {
          expect(searchWiki(query, items)).toEqual([]);
        },
      ),
      { numRuns: 100 },
    );
  });
});
