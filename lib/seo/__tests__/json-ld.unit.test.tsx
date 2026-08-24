// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { JsonLd } from "../components/JsonLd";

describe("JsonLd", () => {
  it("renders a script tag with type application/ld+json", () => {
    const data = { "@type": "WebSite", name: "Test" };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
  });

  it("serializes data as JSON in the script content", () => {
    const data = { "@context": "https://schema.org", "@type": "WebSite", name: "SCG" };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = script?.innerHTML ?? "";
    // The content should be parseable back to the original object
    const parsed = JSON.parse(content);
    expect(parsed).toEqual(data);
  });

  it("escapes < > & characters with Unicode escapes to prevent XSS", () => {
    const data = { name: "<script>alert('xss')</script>", value: "a&b>c" };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = script?.innerHTML ?? "";

    // Should not contain literal < > &
    expect(content).not.toContain("<");
    expect(content).not.toContain(">");
    expect(content).not.toContain("&");

    // Should contain Unicode escapes instead
    expect(content).toContain("\\u003c");
    expect(content).toContain("\\u003e");
    expect(content).toContain("\\u0026");

    // The escaped content should still parse back correctly
    const parsed = JSON.parse(content);
    expect(parsed.name).toBe("<script>alert('xss')</script>");
    expect(parsed.value).toBe("a&b>c");
  });

  it("handles nested objects correctly", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Hydrogen",
      offers: { "@type": "Offer", price: 5.2 },
    };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script?.innerHTML ?? "");
    expect(parsed).toEqual(data);
  });
});
