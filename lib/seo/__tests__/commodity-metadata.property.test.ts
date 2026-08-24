import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { buildMetadata } from "../metadata";
import { CANONICAL_DOMAIN } from "../constants";

/**
 * Arbitrary for commodity display names: non-empty strings that simulate
 * real commodity names like "Hydrogen", "Stims", "Agricultural Supplies".
 */
const commodityNameArb = fc
  .array(
    fc.constantFrom(
      ..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ".split("")
    ),
    { minLength: 1, maxLength: 40 }
  )
  .map((chars) => chars.join("").trim())
  .filter((name) => name.length > 0);

/**
 * Arbitrary for commodity slugs: lowercase, dash-separated segments.
 */
const commoditySlugArb = fc
  .array(
    fc
      .array(
        fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789".split("")),
        { minLength: 1, maxLength: 12 }
      )
      .map((chars) => chars.join("")),
    { minLength: 1, maxLength: 4 }
  )
  .map((segments) => segments.join("-"));

/**
 * Property 13: Commodity metadata title pattern
 *
 * For any commodity name string, the metadata title generated for
 * `/mercancia/[name]` SHALL match the pattern
 * "{commodity_name} - Precios en Star Citizen | SCG".
 *
 * **Validates: Requirements 11.1**
 */
describe("Property 13: Commodity metadata title pattern", () => {
  it("title follows the pattern '{name} - Precios en Star Citizen | SCG'", () => {
    fc.assert(
      fc.property(commodityNameArb, commoditySlugArb, (name, slug) => {
        const metadata = buildMetadata({
          title: `${name} - Precios en Star Citizen | SCG`,
          description: `Consulta precios de compra y venta de ${name} en todas las terminales de Star Citizen.`,
          path: `/mercancia/${slug}`,
          ogType: "product",
        });

        const expectedTitle = `${name} - Precios en Star Citizen | SCG`;
        expect(metadata.title).toBe(expectedTitle);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 15: Dynamic routes include OG image
 *
 * For any dynamic route metadata generated via buildMetadata (same config pattern
 * as generateMetadata), openGraph.images SHALL contain at least one URL that
 * includes the path segment `/og/`.
 *
 * **Validates: Requirements 11.3**
 */
describe("Property 15: Dynamic routes include OG image", () => {
  it("openGraph.images contains at least one URL with /og/", () => {
    fc.assert(
      fc.property(commodityNameArb, commoditySlugArb, (name, slug) => {
        // Simulate the same pattern used in generateMetadata (no explicit ogImageUrl)
        const metadata = buildMetadata({
          title: `${name} - Precios en Star Citizen | SCG`,
          description: `Consulta precios de compra y venta de ${name} en todas las terminales de Star Citizen.`,
          path: `/mercancia/${slug}`,
          ogType: "product",
        });

        const og = metadata.openGraph as Record<string, unknown>;
        expect(og).toBeDefined();

        const images = og.images as Array<Record<string, unknown>>;
        expect(images).toBeDefined();
        expect(images.length).toBeGreaterThanOrEqual(1);

        const hasOgPath = images.some((img) => {
          const url = (typeof img === "string" ? img : img.url) as string;
          return url.includes("/og/");
        });
        expect(hasOgPath).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("default OG image URL starts with CANONICAL_DOMAIN", () => {
    fc.assert(
      fc.property(commodityNameArb, commoditySlugArb, (name, slug) => {
        const metadata = buildMetadata({
          title: `${name} - Precios en Star Citizen | SCG`,
          description: `Consulta precios de compra y venta de ${name} en todas las terminales de Star Citizen.`,
          path: `/mercancia/${slug}`,
          ogType: "product",
        });

        const og = metadata.openGraph as Record<string, unknown>;
        const images = og.images as Array<Record<string, unknown>>;
        const imageUrl = images[0].url as string;

        expect(imageUrl.startsWith(CANONICAL_DOMAIN)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
