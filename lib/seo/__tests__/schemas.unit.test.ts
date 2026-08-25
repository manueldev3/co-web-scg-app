import { describe, it, expect } from "vitest";
import {
  buildWebSiteSchema,
  buildBreadcrumbSchema,
  buildProductSchema,
  buildArticleSchema,
} from "../schemas";

describe("buildWebSiteSchema", () => {
  it("returns a valid WebSite schema with SearchAction", () => {
    const schema = buildWebSiteSchema() as Record<string, unknown>;

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("WebSite");
    expect(schema.name).toBe("SCG - Guía de Star Citizen");
    expect(schema.url).toBe("https://scg-app.com");

    const action = schema.potentialAction as Record<string, unknown>;
    expect(action["@type"]).toBe("SearchAction");
    expect(action.target).toBe(
      "https://scg-app.com/wiki?q={search_term_string}"
    );
    expect(action["query-input"]).toBe("required name=search_term_string");
  });
});

describe("buildBreadcrumbSchema", () => {
  it("returns BreadcrumbList with 1-indexed positions and full URLs", () => {
    const items = [
      { label: "Inicio", href: "/" },
      { label: "Wiki", href: "/wiki" },
      { label: "Naves", href: "/wiki/naves" },
    ];

    const schema = buildBreadcrumbSchema(items) as Record<string, unknown>;

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("BreadcrumbList");

    const elements = schema.itemListElement as Array<Record<string, unknown>>;
    expect(elements).toHaveLength(3);

    expect(elements[0].position).toBe(1);
    expect(elements[0].name).toBe("Inicio");
    expect(elements[0].item).toBe("https://scg-app.com/");

    expect(elements[1].position).toBe(2);
    expect(elements[1].name).toBe("Wiki");
    expect(elements[1].item).toBe("https://scg-app.com/wiki");

    expect(elements[2].position).toBe(3);
    expect(elements[2].name).toBe("Naves");
    expect(elements[2].item).toBe("https://scg-app.com/wiki/naves");
  });

  it("handles empty items array", () => {
    const schema = buildBreadcrumbSchema([]) as Record<string, unknown>;
    const elements = schema.itemListElement as Array<Record<string, unknown>>;
    expect(elements).toHaveLength(0);
  });
});

describe("buildProductSchema", () => {
  it("returns Product schema with basic fields", () => {
    const schema = buildProductSchema({
      name: "Hydrogen",
      description: "Combustible básico para naves",
      url: "https://scg-app.com/mercancia/hydrogen",
    }) as Record<string, unknown>;

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Product");
    expect(schema.name).toBe("Hydrogen");
    expect(schema.description).toBe("Combustible básico para naves");
    expect(schema.url).toBe("https://scg-app.com/mercancia/hydrogen");
    expect(schema).not.toHaveProperty("offers");
  });

  it("includes offers when provided", () => {
    const schema = buildProductSchema({
      name: "Laranite",
      description: "Mineral de alto valor",
      url: "https://scg-app.com/mercancia/laranite",
      offers: [
        { priceCurrency: "aUEC", price: 27.5, availability: "InStock" },
      ],
    }) as Record<string, unknown>;

    const offers = schema.offers as Array<Record<string, unknown>>;
    expect(offers).toHaveLength(1);
    expect(offers[0]["@type"]).toBe("Offer");
    expect(offers[0].priceCurrency).toBe("aUEC");
    expect(offers[0].price).toBe(27.5);
    expect(offers[0].availability).toBe("InStock");
  });

  it("omits offers when array is empty", () => {
    const schema = buildProductSchema({
      name: "Scrap",
      description: "Material reciclable",
      url: "https://scg-app.com/mercancia/scrap",
      offers: [],
    }) as Record<string, unknown>;

    expect(schema).not.toHaveProperty("offers");
  });
});

describe("buildArticleSchema", () => {
  it("returns Article schema with publisher", () => {
    const schema = buildArticleSchema({
      headline: "Cómo empezar en comercio",
      author: "SCG Team",
      datePublished: "2025-01-15",
    }) as Record<string, unknown>;

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Article");
    expect(schema.headline).toBe("Cómo empezar en comercio");
    expect(schema.author).toEqual({ "@type": "Person", name: "SCG Team" });
    expect(schema.datePublished).toBe("2025-01-15");

    const publisher = schema.publisher as Record<string, unknown>;
    expect(publisher["@type"]).toBe("Organization");
    expect(publisher.name).toBe("SCG - Guía de Star Citizen");
    expect(publisher.url).toBe("https://scg-app.com");

    expect(schema).not.toHaveProperty("description");
  });

  it("includes description when provided", () => {
    const schema = buildArticleSchema({
      headline: "Guía de minería",
      author: "Admin",
      datePublished: "2025-03-01",
      description: "Aprende a minar en Star Citizen",
    }) as Record<string, unknown>;

    expect(schema.description).toBe("Aprende a minar en Star Citizen");
  });
});
