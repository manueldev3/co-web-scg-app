import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { buildMetadata } from "../metadata";
import { CANONICAL_DOMAIN } from "../constants";

/**
 * Arbitrary for non-empty item names (trimmed, printable strings).
 */
const itemNameArb = fc
  .string({ minLength: 1, maxLength: 60 })
  .filter((s) => s.trim().length > 0)
  .map((s) => s.trim());

/**
 * Arbitrary for category labels (e.g. "Naves", "Armas", "Componentes").
 */
const categoryLabelArb = fc
  .string({ minLength: 1, maxLength: 30 })
  .filter((s) => s.trim().length > 0)
  .map((s) => s.trim());

/**
 * Arbitrary for wiki slug paths like "/wiki/naves/aurora-mr".
 */
const wikiPathArb = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9-]{0,19}$/),
    fc.stringMatching(/^[a-z][a-z0-9-]{0,29}$/)
  )
  .map(([category, slug]) => `/wiki/${category}/${slug}`);

/**
 * Property 14: Wiki item metadata title pattern
 *
 * For any item name and category label, the metadata title generated for
 * /wiki/[category]/[slug] SHALL match the pattern
 * "{item_name} - {category_label} Star Citizen | SCG".
 *
 * **Validates: Requirements 11.2**
 */
describe("Property 14: Wiki item metadata title pattern", () => {
  it("title follows the pattern '{item_name} - {category_label} Star Citizen | SCG'", () => {
    fc.assert(
      fc.property(itemNameArb, categoryLabelArb, wikiPathArb, (itemName, categoryLabel, path) => {
        const expectedTitle = `${itemName} - ${categoryLabel} Star Citizen | SCG`;

        const metadata = buildMetadata({
          title: expectedTitle,
          description: `Información detallada sobre ${itemName} en Star Citizen.`,
          path,
          ogType: "product",
        });

        expect(metadata.title).toBe(expectedTitle);
        expect(metadata.title).toContain(itemName);
        expect(metadata.title).toContain(`${categoryLabel} Star Citizen | SCG`);
        expect(metadata.title).toMatch(
          new RegExp(`^.+ - .+ Star Citizen \\| SCG$`)
        );
      }),
      { numRuns: 100 }
    );
  });

  it("openGraph title matches the page title", () => {
    fc.assert(
      fc.property(itemNameArb, categoryLabelArb, wikiPathArb, (itemName, categoryLabel, path) => {
        const title = `${itemName} - ${categoryLabel} Star Citizen | SCG`;

        const metadata = buildMetadata({
          title,
          description: `Información sobre ${itemName}.`,
          path,
          ogType: "product",
        });

        const og = metadata.openGraph as Record<string, unknown>;
        expect(og.title).toBe(title);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 15: Dynamic routes include OG image
 *
 * For any dynamic route metadata generated via generateMetadata,
 * the openGraph.images field SHALL contain at least one URL that includes
 * the path segment `/og/`.
 *
 * **Validates: Requirements 11.3**
 */
describe("Property 15: Dynamic routes include OG image", () => {
  it("openGraph.images contains at least one URL with /og/ segment", () => {
    fc.assert(
      fc.property(itemNameArb, categoryLabelArb, wikiPathArb, (itemName, categoryLabel, path) => {
        const title = `${itemName} - ${categoryLabel} Star Citizen | SCG`;

        // No ogImageUrl provided — the default OG generator should be used
        const metadata = buildMetadata({
          title,
          description: `Información sobre ${itemName}.`,
          path,
          ogType: "product",
        });

        const og = metadata.openGraph as Record<string, unknown>;
        const images = og.images as Array<Record<string, unknown>>;

        expect(images.length).toBeGreaterThanOrEqual(1);

        const hasOgUrl = images.some((img) => {
          const url = (typeof img === "string" ? img : img.url) as string;
          return url.includes("/og/");
        });
        expect(hasOgUrl).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("default OG image URL starts with CANONICAL_DOMAIN", () => {
    fc.assert(
      fc.property(itemNameArb, categoryLabelArb, wikiPathArb, (itemName, categoryLabel, path) => {
        const title = `${itemName} - ${categoryLabel} Star Citizen | SCG`;

        const metadata = buildMetadata({
          title,
          description: `Información sobre ${itemName}.`,
          path,
          ogType: "product",
        });

        const og = metadata.openGraph as Record<string, unknown>;
        const images = og.images as Array<Record<string, unknown>>;
        const firstImageUrl = images[0].url as string;

        expect(firstImageUrl.startsWith(CANONICAL_DOMAIN)).toBe(true);
        expect(firstImageUrl).toContain("/og/");
      }),
      { numRuns: 100 }
    );
  });
});
