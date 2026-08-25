import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { buildBreadcrumbSchema, buildProductSchema } from "../schemas";
import { CANONICAL_DOMAIN } from "../constants";

/**
 * Property 10: BreadcrumbList schema positions
 *
 * For any ordered list of BreadcrumbItem objects, buildBreadcrumbSchema SHALL return
 * an object with @type="BreadcrumbList" and itemListElement where each element has
 * position=1-based index, name=item's label, item URL prefixed with CANONICAL_DOMAIN.
 *
 * **Validates: Requirements 6.4, 7.5**
 */
describe("Property 10: BreadcrumbList schema positions", () => {
  const breadcrumbItemArb = fc.record({
    label: fc.string({ minLength: 1 }),
    href: fc.string({ minLength: 1 }).map((s) => `/${s.replace(/^\/+/, "")}`),
  });

  it("returns @type BreadcrumbList with 1-based positions matching input labels", () => {
    fc.assert(
      fc.property(
        fc.array(breadcrumbItemArb, { minLength: 1, maxLength: 20 }),
        (items) => {
          const schema = buildBreadcrumbSchema(items) as Record<string, unknown>;

          expect(schema["@type"]).toBe("BreadcrumbList");
          expect(schema["@context"]).toBe("https://schema.org");

          const elements = schema.itemListElement as Array<
            Record<string, unknown>
          >;
          expect(elements).toHaveLength(items.length);

          for (let i = 0; i < items.length; i++) {
            expect(elements[i].position).toBe(i + 1);
            expect(elements[i].name).toBe(items[i].label);
            expect(elements[i].item).toBe(
              `${CANONICAL_DOMAIN}${items[i].href}`
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("all item URLs are prefixed with CANONICAL_DOMAIN", () => {
    fc.assert(
      fc.property(
        fc.array(breadcrumbItemArb, { minLength: 1, maxLength: 20 }),
        (items) => {
          const schema = buildBreadcrumbSchema(items) as Record<string, unknown>;
          const elements = schema.itemListElement as Array<
            Record<string, unknown>
          >;

          for (const element of elements) {
            expect((element.item as string).startsWith(CANONICAL_DOMAIN)).toBe(
              true
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 16: Product schema structure
 *
 * For any valid ProductSchemaInput, buildProductSchema SHALL return an object with
 * @context="https://schema.org", @type="Product", and non-empty name and description
 * matching input values.
 *
 * **Validates: Requirements 6.5**
 */
describe("Property 16: Product schema structure", () => {
  const productInputArb = fc.record({
    name: fc.string({ minLength: 1 }),
    description: fc.string({ minLength: 1 }),
    url: fc.webUrl(),
    offers: fc.option(
      fc.array(
        fc.record({
          priceCurrency: fc.string({ minLength: 1 }),
          price: fc.double({ min: 0, noNaN: true, noDefaultInfinity: true }),
          availability: fc.constantFrom("InStock", "OutOfStock", "PreOrder"),
        }),
        { minLength: 1, maxLength: 5 }
      ),
      { nil: undefined }
    ),
  });

  it("returns @context, @type Product, and name/description matching input", () => {
    fc.assert(
      fc.property(productInputArb, (input) => {
        const schema = buildProductSchema(input) as Record<string, unknown>;

        expect(schema["@context"]).toBe("https://schema.org");
        expect(schema["@type"]).toBe("Product");
        expect(schema.name).toBe(input.name);
        expect(schema.description).toBe(input.description);
      }),
      { numRuns: 100 }
    );
  });

  it("name and description are non-empty strings", () => {
    fc.assert(
      fc.property(productInputArb, (input) => {
        const schema = buildProductSchema(input) as Record<string, unknown>;

        expect(typeof schema.name).toBe("string");
        expect(typeof schema.description).toBe("string");
        expect((schema.name as string).length).toBeGreaterThan(0);
        expect((schema.description as string).length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});
