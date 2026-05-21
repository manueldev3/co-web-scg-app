import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { buildHierarchicalLocation } from "../utils";

/**
 * Feature: commodity-detail-view, Property 2: Construcción de ubicación jerárquica
 *
 * Validates: Requirements 6.2, 6.3
 *
 * For any API record with an arbitrary combination of location fields (some null, some with value),
 * buildHierarchicalLocation must produce a string that:
 * (a) contains exactly the non-null values
 * (b) separates them with " > "
 * (c) has no empty segments or leading/trailing separators
 * (d) preserves the hierarchical order (system > planet > orbit > moon > city > station > outpost)
 */

/** Arbitrary for a non-empty string (valid location name) or null */
const locationFieldArb = fc.option(
  fc.string({ minLength: 1, maxLength: 30 }).filter((s) => !s.includes(">")),
  { nil: null },
);

/** Arbitrary that generates a location record with 7 fields, each string | null */
const locationRecordArb = fc.record({
  star_system_name: locationFieldArb,
  planet_name: locationFieldArb,
  orbit_name: locationFieldArb,
  moon_name: locationFieldArb,
  city_name: locationFieldArb,
  space_station_name: locationFieldArb,
  outpost_name: locationFieldArb,
});

describe("Feature: commodity-detail-view, Property 2: Construcción de ubicación jerárquica", () => {
  it("result contains exactly the non-null values from the input", () => {
    fc.assert(
      fc.property(locationRecordArb, (record) => {
        const result = buildHierarchicalLocation(record);
        const nonNullValues = [
          record.star_system_name,
          record.planet_name,
          record.orbit_name,
          record.moon_name,
          record.city_name,
          record.space_station_name,
          record.outpost_name,
        ].filter((v): v is string => v !== null);

        if (nonNullValues.length === 0) {
          expect(result).toBe("");
        } else {
          const segments = result.split(" > ");
          expect(segments).toEqual(nonNullValues);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("values are separated by ' > '", () => {
    fc.assert(
      fc.property(locationRecordArb, (record) => {
        const result = buildHierarchicalLocation(record);
        const nonNullValues = [
          record.star_system_name,
          record.planet_name,
          record.orbit_name,
          record.moon_name,
          record.city_name,
          record.space_station_name,
          record.outpost_name,
        ].filter((v): v is string => v !== null);

        const expected = nonNullValues.join(" > ");
        expect(result).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });

  it("no empty segments exist in the result", () => {
    fc.assert(
      fc.property(locationRecordArb, (record) => {
        const result = buildHierarchicalLocation(record);

        if (result === "") return; // empty result is valid when all fields are null

        const segments = result.split(" > ");
        for (const segment of segments) {
          expect(segment.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("hierarchical order is preserved (system > planet > orbit > moon > city > station > outpost)", () => {
    fc.assert(
      fc.property(locationRecordArb, (record) => {
        const result = buildHierarchicalLocation(record);

        if (result === "") return;

        const segments = result.split(" > ");

        // Build the expected order from non-null fields
        const orderedFields = [
          record.star_system_name,
          record.planet_name,
          record.orbit_name,
          record.moon_name,
          record.city_name,
          record.space_station_name,
          record.outpost_name,
        ];

        const expectedOrder = orderedFields.filter(
          (v): v is string => v !== null,
        );

        // Verify the segments match the expected order exactly
        expect(segments).toEqual(expectedOrder);
      }),
      { numRuns: 100 },
    );
  });
});
