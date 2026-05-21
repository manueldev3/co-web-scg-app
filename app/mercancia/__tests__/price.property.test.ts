import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { formatPrice } from "../utils";

/**
 * Feature: commodity-detail-view, Property 3: Formato de precios
 *
 * Validates: Requirements 7.1
 *
 * For any non-negative number, formatPrice must produce a string that:
 * (a) ends with " UEC"
 * (b) has correct thousands separators (commas every 3 digits before decimal)
 * (c) parsing the numeric component back to a number produces a value equivalent
 *     to the original (round-trip, accounting for 2 decimal places rounding)
 */

describe("Feature: commodity-detail-view, Property 3: Formato de precios", () => {
  it("result ends with ' UEC'", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, noNaN: true, noDefaultInfinity: true }),
        (price) => {
          const result = formatPrice(price);
          expect(result).toMatch(/ UEC$/);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("numeric part has correct thousands separators (commas every 3 digits before decimal)", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, noNaN: true, noDefaultInfinity: true }),
        (price) => {
          const result = formatPrice(price);
          // Remove " UEC" suffix to get the numeric part
          const numericPart = result.slice(0, -4);

          // Split into integer and decimal parts
          const [integerPart, decimalPart] = numericPart.split(".");

          // Decimal part should always have exactly 2 digits
          expect(decimalPart).toMatch(/^\d{2}$/);

          // Integer part should have commas every 3 digits from the right
          // Remove commas and verify it's all digits
          const digitsOnly = integerPart.replace(/,/g, "");
          expect(digitsOnly).toMatch(/^\d+$/);

          // Verify comma placement: split by comma, first group can be 1-3 digits,
          // subsequent groups must be exactly 3 digits
          const groups = integerPart.split(",");
          if (groups.length > 1) {
            expect(groups[0].length).toBeGreaterThanOrEqual(1);
            expect(groups[0].length).toBeLessThanOrEqual(3);
            for (let i = 1; i < groups.length; i++) {
              expect(groups[i].length).toBe(3);
            }
          } else {
            // Single group (no commas) should be 1-3 digits
            expect(groups[0].length).toBeGreaterThanOrEqual(1);
            expect(groups[0].length).toBeLessThanOrEqual(3);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("parsing the numeric component back produces a value equivalent to the original (round-trip with 2 decimal rounding)", () => {
    fc.assert(
      fc.property(
        fc.double({
          min: 0,
          max: 1e12,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (price) => {
          const result = formatPrice(price);
          // Remove " UEC" suffix and commas to get a parseable number
          const numericStr = result.slice(0, -4).replace(/,/g, "");
          const parsed = parseFloat(numericStr);

          // The expected value is the original rounded to 2 decimal places
          const expected = Math.round(price * 100) / 100;

          expect(parsed).toBeCloseTo(expected, 2);
        },
      ),
      { numRuns: 100 },
    );
  });
});
