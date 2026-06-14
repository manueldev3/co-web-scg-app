import { describe, it, expect } from "vitest";
import { validateInputs } from "../route-engine";

/**
 * Unit tests for `validateInputs` (Route_Engine).
 *
 * Validates: Requirements 2.5, 2.6
 *
 * Concrete example cases covering valid input, a missing (null) ship, and
 * empty/zero/negative/NaN investment values. These complement the
 * property-based coverage in `validation.property.test.ts` with explicit,
 * human-readable examples and exact error-field assertions.
 */
describe("validateInputs", () => {
  it("accepts a selected ship with a positive investment", () => {
    const result = validateInputs(42, 10000);

    expect(result.valid).toBe(true);
    expect(result.errors.ship).toBeUndefined();
    expect(result.errors.investment).toBeUndefined();
  });

  it("accepts a ship id of 0 (a valid, non-null id) with positive investment", () => {
    const result = validateInputs(0, 1);

    expect(result.valid).toBe(true);
    expect(result.errors.ship).toBeUndefined();
    expect(result.errors.investment).toBeUndefined();
  });

  it("rejects a null ship while keeping a valid investment error-free", () => {
    const result = validateInputs(null, 5000);

    expect(result.valid).toBe(false);
    expect(typeof result.errors.ship).toBe("string");
    expect((result.errors.ship as string).length).toBeGreaterThan(0);
    expect(result.errors.investment).toBeUndefined();
  });

  it("rejects an empty (null) investment while keeping a valid ship error-free", () => {
    const result = validateInputs(42, null);

    expect(result.valid).toBe(false);
    expect(result.errors.ship).toBeUndefined();
    expect(typeof result.errors.investment).toBe("string");
    expect((result.errors.investment as string).length).toBeGreaterThan(0);
  });

  it("rejects a zero investment", () => {
    const result = validateInputs(42, 0);

    expect(result.valid).toBe(false);
    expect(result.errors.investment).toBeDefined();
    expect(result.errors.ship).toBeUndefined();
  });

  it("rejects a negative investment", () => {
    const result = validateInputs(42, -100);

    expect(result.valid).toBe(false);
    expect(result.errors.investment).toBeDefined();
    expect(result.errors.ship).toBeUndefined();
  });

  it("rejects a NaN investment", () => {
    const result = validateInputs(42, Number.NaN);

    expect(result.valid).toBe(false);
    expect(result.errors.investment).toBeDefined();
    expect(result.errors.ship).toBeUndefined();
  });

  it("reports both errors when ship is null and investment is invalid", () => {
    const result = validateInputs(null, -1);

    expect(result.valid).toBe(false);
    expect(typeof result.errors.ship).toBe("string");
    expect((result.errors.ship as string).length).toBeGreaterThan(0);
    expect(typeof result.errors.investment).toBe("string");
    expect((result.errors.investment as string).length).toBeGreaterThan(0);
  });
});
