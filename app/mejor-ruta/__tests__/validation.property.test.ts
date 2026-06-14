import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateInputs } from "../route-engine";

// Feature: mejor-ruta, Property 1: Input validation rejects missing ship and non-positive investment
//
// Validates: Requirements 2.5, 2.6
//
// For any input state, validateInputs returns valid:true if and only if a ship
// is selected (non-null id) AND investment is a number > 0; otherwise valid:false
// with an error identifying each offending field (ship and/or investment).

/** Ship id: null (no ship) or a valid non-null integer id. */
const shipIdArb: fc.Arbitrary<number | null> = fc.oneof(
  fc.constant<number | null>(null),
  fc.integer({ min: 0, max: 100000 }),
);

/**
 * Investment: edge cases across the input space — null, zero, negative,
 * NaN, and positive values.
 */
const investmentArb: fc.Arbitrary<number | null> = fc.oneof(
  fc.constant<number | null>(null),
  fc.constant(0),
  fc.constant(Number.NaN),
  fc.float({ min: Math.fround(-100000), max: Math.fround(-0.01), noNaN: true }),
  fc.float({ min: Math.fround(0.01), max: 100000, noNaN: true }),
);

describe("Feature: mejor-ruta, Property 1: Input validation rejects missing ship and non-positive investment", () => {
  it("returns valid iff a ship is selected and investment is a number > 0, with field errors otherwise", () => {
    fc.assert(
      fc.property(shipIdArb, investmentArb, (shipId, investment) => {
        const result = validateInputs(shipId, investment);

        const shipOk = shipId !== null;
        const investmentOk =
          investment !== null &&
          typeof investment === "number" &&
          !Number.isNaN(investment) &&
          investment > 0;
        const expectedValid = shipOk && investmentOk;

        // valid is true iff both inputs are acceptable
        expect(result.valid).toBe(expectedValid);

        // Each offending field is identified, and only offending fields are.
        if (shipOk) {
          expect(result.errors.ship).toBeUndefined();
        } else {
          expect(typeof result.errors.ship).toBe("string");
          expect((result.errors.ship as string).length).toBeGreaterThan(0);
        }

        if (investmentOk) {
          expect(result.errors.investment).toBeUndefined();
        } else {
          expect(typeof result.errors.investment).toBe("string");
          expect((result.errors.investment as string).length).toBeGreaterThan(
            0,
          );
        }
      }),
      { numRuns: 100 },
    );
  });
});
