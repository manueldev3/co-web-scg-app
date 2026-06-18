import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { parseContainerSizes } from "../utils";

/**
 * Feature: wiki, Property 4: Round-trip de container_sizes
 *
 * Validates: Requirements 5.4
 *
 * For any list of non-negative integers, joining them with commas and then
 * applying `parseContainerSizes` reproduces the original list; an empty string
 * or `null` yields the empty list.
 */
describe("Feature: wiki, Property 4: Round-trip de container_sizes", () => {
  it("round-trips a comma-joined list of non-negative integers", () => {
    fc.assert(
      fc.property(fc.array(fc.nat()), (list) => {
        expect(parseContainerSizes(list.join(","))).toEqual(list);
      }),
      { numRuns: 100 },
    );
  });

  it("yields the empty list for an empty string", () => {
    expect(parseContainerSizes("")).toEqual([]);
  });

  it("yields the empty list for null", () => {
    expect(parseContainerSizes(null)).toEqual([]);
  });
});
