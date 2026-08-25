// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { render } from "@testing-library/react";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { CANONICAL_DOMAIN } from "../constants";
import type { BreadcrumbItem } from "../schemas";

/**
 * Arbitrary for BreadcrumbItem arrays: non-empty lists with
 * random labels (non-empty strings) and hrefs (paths starting with /).
 */
const breadcrumbItemArb: fc.Arbitrary<BreadcrumbItem> = fc.record({
  label: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
  href: fc
    .array(
      fc.string({ minLength: 1, maxLength: 15 }).map((s) => s.replace(/[^a-z0-9-]/gi, "a")),
      { minLength: 1, maxLength: 3 }
    )
    .map((segments) => `/${segments.join("/")}`),
});

const breadcrumbItemsArb: fc.Arbitrary<BreadcrumbItem[]> = fc.array(breadcrumbItemArb, {
  minLength: 1,
  maxLength: 6,
});

/**
 * Property 11: Breadcrumbs accessibility structure
 *
 * For any non-empty list of breadcrumb items, the Breadcrumbs component SHALL render
 * (a) a nav element with aria-label="Breadcrumb",
 * (b) the last item with aria-current="page" and without an <a> tag,
 * (c) all non-last items as <a> links.
 *
 * **Validates: Requirements 7.2, 7.3**
 */
describe("Property 11: Breadcrumbs accessibility structure", () => {
  it("renders a nav element with aria-label='Breadcrumb'", () => {
    fc.assert(
      fc.property(breadcrumbItemsArb, (items) => {
        const { container } = render(<Breadcrumbs items={items} />);
        const nav = container.querySelector('nav[aria-label="Breadcrumb"]');
        expect(nav).not.toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it("last item has aria-current='page' and is not an <a> link", () => {
    fc.assert(
      fc.property(breadcrumbItemsArb, (items) => {
        const { container } = render(<Breadcrumbs items={items} />);
        const listItems = container.querySelectorAll("li");
        const lastLi = listItems[listItems.length - 1];

        // Last item should have aria-current="page"
        const currentPage = lastLi.querySelector('[aria-current="page"]');
        expect(currentPage).not.toBeNull();
        expect(currentPage!.tagName.toLowerCase()).not.toBe("a");

        // Last item should NOT contain an <a> tag
        const lastLink = lastLi.querySelector("a");
        expect(lastLink).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it("all non-last items are rendered as <a> links", () => {
    fc.assert(
      fc.property(breadcrumbItemsArb, (items) => {
        const { container } = render(<Breadcrumbs items={items} />);
        const listItems = container.querySelectorAll("li");

        for (let i = 0; i < listItems.length - 1; i++) {
          const link = listItems[i].querySelector("a");
          expect(link).not.toBeNull();
          expect(link!.getAttribute("href")).toBe(items[i].href);
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 12: Breadcrumbs JSON-LD emission
 *
 * For any non-empty list of breadcrumb items, the Breadcrumbs component SHALL emit
 * a <script type="application/ld+json"> element containing a valid BreadcrumbList
 * schema where every `item` URL starts with "https://scg-app.com".
 *
 * **Validates: Requirements 7.4, 7.5**
 */
describe("Property 12: Breadcrumbs JSON-LD emission", () => {
  it("emits a script tag with type application/ld+json containing BreadcrumbList", () => {
    fc.assert(
      fc.property(breadcrumbItemsArb, (items) => {
        const { container } = render(<Breadcrumbs items={items} />);
        const script = container.querySelector('script[type="application/ld+json"]');
        expect(script).not.toBeNull();

        const parsed = JSON.parse(script!.innerHTML);
        expect(parsed["@type"]).toBe("BreadcrumbList");
        expect(parsed["@context"]).toBe("https://schema.org");
      }),
      { numRuns: 100 }
    );
  });

  it("every item URL in the JSON-LD starts with CANONICAL_DOMAIN", () => {
    fc.assert(
      fc.property(breadcrumbItemsArb, (items) => {
        const { container } = render(<Breadcrumbs items={items} />);
        const script = container.querySelector('script[type="application/ld+json"]');
        const parsed = JSON.parse(script!.innerHTML);

        const elements = parsed.itemListElement as Array<{
          "@type": string;
          position: number;
          name: string;
          item: string;
        }>;

        expect(elements.length).toBe(items.length);

        for (const element of elements) {
          expect(element.item.startsWith(CANONICAL_DOMAIN)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("JSON-LD positions are 1-based and names match labels", () => {
    fc.assert(
      fc.property(breadcrumbItemsArb, (items) => {
        const { container } = render(<Breadcrumbs items={items} />);
        const script = container.querySelector('script[type="application/ld+json"]');
        const parsed = JSON.parse(script!.innerHTML);

        const elements = parsed.itemListElement as Array<{
          "@type": string;
          position: number;
          name: string;
          item: string;
        }>;

        for (let i = 0; i < elements.length; i++) {
          expect(elements[i].position).toBe(i + 1);
          expect(elements[i].name).toBe(items[i].label);
          expect(elements[i].item).toBe(`${CANONICAL_DOMAIN}${items[i].href}`);
        }
      }),
      { numRuns: 100 }
    );
  });
});
