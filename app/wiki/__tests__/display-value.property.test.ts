import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { displayValue, MISSING_DATA } from "../utils";

// Feature: wiki, Property 5: Marcador de dato faltante
//
// Validates: Requirements 5.5
//
// For any value, `displayValue` returns the marker "Dato no disponible" when the
// value is `null` or `undefined`, and returns the textual representation of the
// value (without the marker) when it is an empty string or the number zero. In
// particular, `""` renders as `""` (not the marker) and `0` renders as `"0"`.

/**
 * Generator covering the relevant input space for `displayValue`:
 * - the two missing sentinels (`null`, `undefined`)
 * - the two "present-but-falsy" edge cases that must NOT be treated as missing
 *   (the empty string and the number zero)
 * - arbitrary non-empty strings and arbitrary numbers (the general case)
 */
const valueArb = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.constant(""),
  fc.constant(0),
  fc.string(),
  fc.double({ noNaN: true }),
  fc.integer(),
);

describe("Feature: wiki, Property 5: Marcador de dato faltante", () => {
  it("returns the marker only for null/undefined; empty string and zero render as themselves", () => {
    fc.assert(
      fc.property(valueArb, (value) => {
        const result = displayValue(value);

        if (value === null || value === undefined) {
          // Missing data → exactly the marker.
          expect(result).toBe(MISSING_DATA);
        } else {
          // Present value → its textual representation.
          expect(result).toBe(String(value));
          // The empty string and zero are present values, so they must never
          // collapse into the missing-data marker.
          if (value === "" || value === 0) {
            expect(result).not.toBe(MISSING_DATA);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('renders the empty string as "" and zero as "0" without the marker', () => {
    expect(displayValue("")).toBe("");
    expect(displayValue("")).not.toBe(MISSING_DATA);
    expect(displayValue(0)).toBe("0");
    expect(displayValue(0)).not.toBe(MISSING_DATA);
  });
});
