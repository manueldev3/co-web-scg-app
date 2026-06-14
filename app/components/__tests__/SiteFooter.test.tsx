// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";

// next/link renders a plain anchor in tests; avoid needing the App Router context.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string | { pathname?: string };
    children: React.ReactNode;
    [key: string]: unknown;
  }) =>
    React.createElement(
      "a",
      { href: typeof href === "string" ? href : "#", ...rest },
      children,
    ),
}));

import SiteFooter from "../SiteFooter";

afterEach(cleanup);

/**
 * Component tests for the Global_Footer (SiteFooter).
 * Validates: Requirements 9.1, 9.2, 9.3
 *
 * Requirement 9.1 (rendered on every page) is structurally guaranteed by the
 * root layout rendering <SiteFooter /> after {children}; here we render the
 * footer directly and assert its required content (disclaimer + links + contact).
 */
describe("SiteFooter", () => {
  it("renders a footer landmark", () => {
    const { container } = render(<SiteFooter />);
    const footer = container.querySelector("footer");
    expect(footer).not.toBeNull();
  });

  it("displays the unofficial / not-affiliated-with-CIG disclaimer (Req 9.2)", () => {
    render(<SiteFooter />);
    const aviso = screen.getByRole("region", { name: "Aviso legal" });
    const text = aviso.textContent ?? "";
    // Unofficial tool statement
    expect(text).toMatch(/no oficial/i);
    // Not affiliated with Cloud Imperium Games
    expect(text).toMatch(/Cloud Imperium Games/i);
    expect(text).toMatch(/no est[áa] afiliada/i);
  });

  it("renders a links section containing the site navigation links (Req 9.3)", () => {
    render(<SiteFooter />);
    const links = screen.getByRole("navigation", { name: "Enlaces" });
    expect(links).not.toBeNull();
    const scoped = within(links);
    expect(scoped.getByText("Inicio")).toBeTruthy();
    expect(scoped.getByText("Mercancía")).toBeTruthy();
    expect(scoped.getByText("Mejor Ruta")).toBeTruthy();
    // The "Mejor Ruta" link points at the feature route.
    const mejorRuta = scoped.getByText("Mejor Ruta").closest("a");
    expect(mejorRuta?.getAttribute("href")).toBe("/mejor-ruta");
  });

  it("renders a contact section with contact details (Req 9.3)", () => {
    render(<SiteFooter />);
    const contact = screen.getByRole("region", { name: "Contacto" });
    expect(contact).not.toBeNull();
    const scoped = within(contact);
    const email = scoped.getByText(/manueldev3@gmail\.com/i).closest("a");
    expect(email?.getAttribute("href")).toBe("mailto:manueldev3@gmail.com");
  });
});
