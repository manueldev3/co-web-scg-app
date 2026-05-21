import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { formatStock } from "../utils";

/**
 * Feature: commodity-detail-view, Property 4: Formato de stock y demanda
 *
 * Validates: Requirements 7.2, 7.3
 *
 * For any pair (available: non-negative integer, max: non-negative integer | null):
 * - When max is a number (not null): result follows format "{available} / {max} SCU" with thousands separators
 * - When max is null/undefined: result follows format "{available} SCU" with thousands separators
 * - Numbers in the result have correct thousands separators
 */

describe("Feature: commodity-detail-view, Property 4: Formato de stock y demanda", () => {
  it("when max is a number, result follows format '{available} / {max} SCU' with thousands separators", () => {
    fc.assert(
      fc.property(
        fc.nat(), // available: non-negative integer
        fc.nat(), // max: non-negative integer
        (available, max) => {
          const result = formatStock(available, max);

          // Must end with " SCU"
          expect(result).toMatch(/ SCU$/);

          // Must contain " / " separator
          expect(result).toContain(" / ");

          // Extract the two numeric parts
          const withoutSuffix = result.slice(0, -4); // Remove " SCU"
          const parts = withoutSuffix.split(" / ");
          expect(parts).toHaveLength(2);

          // Both parts should be valid formatted numbers (digits and commas only)
          expect(parts[0]).toMatch(/^[\d,]+$/);
          expect(parts[1]).toMatch(/^[\d,]+$/);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("when max is null or undefined, result follows format '{available} SCU' without separator", () => {
    fc.assert(
      fc.property(
        fc.nat(), // available: non-negative integer
        fc.constantFrom(null, undefined), // max is null or undefined
        (available, max) => {
          const result = formatStock(available, max);

          // Must end with " SCU"
          expect(result).toMatch(/ SCU$/);

          // Must NOT contain " / " separator
          expect(result).not.toContain(" / ");

          // Extract the numeric part
          const withoutSuffix = result.slice(0, -4); // Remove " SCU"

          // Should be a valid formatted number (digits and commas only)
          expect(withoutSuffix).toMatch(/^[\d,]+$/);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("numbers in the result have correct thousands separators", () => {
    fc.assert(
      fc.property(
        fc.nat(), // available: non-negative integer
        fc.option(fc.nat(), { nil: null }), // max: non-negative integer | null
        (available, max) => {
          const result = formatStock(available, max);

          // Remove " SCU" suffix
          const withoutSuffix = result.slice(0, -4);

          // Get all numeric parts (split by " / " if present)
          const numericParts = withoutSuffix.split(" / ");

          for (const part of numericParts) {
            // Remove commas and verify it's all digits
            const digitsOnly = part.replace(/,/g, "");
            expect(digitsOnly).toMatch(/^\d+$/);

            // Verify comma placement: split by comma, first group can be 1-3 digits,
            // subsequent groups must be exactly 3 digits
            const groups = part.split(",");
            if (groups.length > 1) {
              expect(groups[0].length).toBeGreaterThanOrEqual(1);
              expect(groups[0].length).toBeLessThanOrEqual(3);
              for (let i = 1; i < groups.length; i++) {
                expect(groups[i].length).toBe(3);
              }
            } else {
              // Single group (no commas) should be 1+ digits
              expect(groups[0].length).toBeGreaterThanOrEqual(1);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
