// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { render } from "@testing-library/react";
import { JsonLd } from "../components/JsonLd";

/**
 * Arbitrary for JSON-serializable objects (nested structures with strings, numbers, booleans, arrays, objects).
 */
const jsonObjectArb = fc
  .jsonValue()
  .filter(
    (v): v is Record<string, unknown> =>
      typeof v === "object" && v !== null && !Array.isArray(v)
  )
  .map((obj) => JSON.parse(JSON.stringify(obj)) as Record<string, unknown>);

/**
 * Arbitrary that generates objects with string values containing <, >, & characters.
 * Ensures at least one value contains dangerous HTML chars.
 */
const xssStringArb = fc.string({ minLength: 0, maxLength: 50 }).chain((base) =>
  fc.constantFrom("<", ">", "&", "</script>", "<img>", "a&b", "x>y<z").map(
    (dangerous) => `${base}${dangerous}`
  )
);

const objectWithXssCharsArb = fc
  .record({
    name: xssStringArb,
    value: xssStringArb,
    nested: fc.record({
      inner: xssStringArb,
    }),
  })
  .map((obj) => obj as Record<string, unknown>);

/**
 * Property 8: JSON-LD serialization round-trip
 *
 * For any valid JSON-serializable object passed to the JsonLd component,
 * the rendered <script> element's inner content SHALL be parseable back
 * to the original object via JSON.parse.
 *
 * **Validates: Requirements 6.1**
 */
describe("Property 8: JSON-LD serialization round-trip", () => {
  it("rendered content is parseable back to the original object", () => {
    fc.assert(
      fc.property(jsonObjectArb, (data) => {
        const { container } = render(<JsonLd data={data} />);
        const script = container.querySelector(
          'script[type="application/ld+json"]'
        );
        expect(script).not.toBeNull();

        const content = script!.innerHTML;
        const parsed = JSON.parse(content);
        expect(parsed).toEqual(data);
      }),
      { numRuns: 100 }
    );
  });

  it("preserves nested structures and diverse value types", () => {
    const nestedObjectArb = fc.record({
      "@context": fc.constant("https://schema.org"),
      "@type": fc.constantFrom("WebSite", "Product", "Article", "BreadcrumbList"),
      name: fc.string({ minLength: 1, maxLength: 60 }),
      count: fc.integer({ min: 0, max: 10000 }),
      active: fc.boolean(),
      tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
        minLength: 0,
        maxLength: 5,
      }),
      nested: fc.record({
        inner: fc.string({ minLength: 0, maxLength: 30 }),
        value: fc.double({ min: 0, max: 9999, noNaN: true }),
      }),
    });

    fc.assert(
      fc.property(nestedObjectArb, (data) => {
        const { container } = render(
          <JsonLd data={data as unknown as Record<string, unknown>} />
        );
        const script = container.querySelector(
          'script[type="application/ld+json"]'
        );
        const parsed = JSON.parse(script!.innerHTML);
        expect(parsed).toEqual(data);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 9: JSON-LD XSS escaping
 *
 * For any JSON-LD object whose string values contain <, >, or &,
 * the serialized output within the <script> tag SHALL NOT contain
 * literal <, >, or & characters — they SHALL be replaced with
 * Unicode escape equivalents (\u003c, \u003e, \u0026).
 *
 * **Validates: Requirements 6.2**
 */
describe("Property 9: JSON-LD XSS escaping", () => {
  it("never contains literal < > & in the rendered script innerHTML", () => {
    fc.assert(
      fc.property(objectWithXssCharsArb, (data) => {
        const { container } = render(<JsonLd data={data} />);
        const script = container.querySelector(
          'script[type="application/ld+json"]'
        );
        const content = script!.innerHTML;

        expect(content).not.toContain("<");
        expect(content).not.toContain(">");
        expect(content).not.toContain("&");
      }),
      { numRuns: 100 }
    );
  });

  it("replaces dangerous chars with Unicode escapes \\u003c, \\u003e, \\u0026", () => {
    fc.assert(
      fc.property(objectWithXssCharsArb, (data) => {
        const { container } = render(<JsonLd data={data} />);
        const script = container.querySelector(
          'script[type="application/ld+json"]'
        );
        const content = script!.innerHTML;

        // Since our arbitrary guarantees <, >, or & in values,
        // at least one Unicode escape must be present
        const hasEscape =
          content.includes("\\u003c") ||
          content.includes("\\u003e") ||
          content.includes("\\u0026");
        expect(hasEscape).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("escaped content still parses back to original values", () => {
    fc.assert(
      fc.property(objectWithXssCharsArb, (data) => {
        const { container } = render(<JsonLd data={data} />);
        const script = container.querySelector(
          'script[type="application/ld+json"]'
        );
        const parsed = JSON.parse(script!.innerHTML);
        expect(parsed).toEqual(data);
      }),
      { numRuns: 100 }
    );
  });
});
