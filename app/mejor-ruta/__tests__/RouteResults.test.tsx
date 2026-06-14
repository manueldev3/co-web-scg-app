// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import RouteResults from "../RouteResults";
import { makeRoute } from "./fixtures";

// --- jsdom polyfills for Ant Design ---------------------------------------
// Ant Design components (Table, Spin, Empty) rely on browser APIs that jsdom
// does not implement. We polyfill the minimum surface so the components mount.
beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  }
  if (!("ResizeObserver" in globalThis)) {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
  }
});

afterEach(cleanup);

/**
 * Component/rendering tests for RouteResults (task 8.4).
 * Validates: Requirements 7.1, 7.2, 7.3, 4.5
 *
 * These are example-based rendering assertions, not property-based tests.
 */
describe("RouteResults — results presentation", () => {
  it("renders all six required fields for a route (Req 7.1)", () => {
    // buyValue=10000, sellValue=15000, profit=5000, quantityScu=100 — chosen so
    // the formatted values are all distinct and unambiguous.
    const route = makeRoute({
      buyTerminalName: "Port Olisar",
      sellTerminalName: "Area18 TDD",
      commodityName: "Quantanium",
      quantityScu: 100,
      buyValue: 10000,
      sellValue: 15000,
      profit: 5000,
    });

    render(
      <RouteResults routes={[route]} computing={false} expandedView={false} />,
    );

    // 1. Buy terminal, 2. Sell terminal, 3. Commodity (rendered as text).
    expect(screen.getByText("Port Olisar")).toBeTruthy();
    expect(screen.getByText("Area18 TDD")).toBeTruthy();
    expect(screen.getByText("Quantanium")).toBeTruthy();
    // 4. Quantity in SCU (formatStock), 5. Capital in UEC (formatPrice on
    // buyValue), 6. Profit in UEC (formatPrice on profit).
    expect(screen.getByText("100 SCU")).toBeTruthy();
    expect(screen.getByText("10,000.00 UEC")).toBeTruthy();
    expect(screen.getByText("5,000.00 UEC")).toBeTruthy();

    // The six required column headers are present. Ant Design's Table renders a
    // duplicate (measurement) header row when horizontal scroll is enabled, so
    // each header title can appear more than once — assert at least one.
    expect(screen.getAllByText("Comprar en").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Vender en").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Mercancía").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cantidad (SCU)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Capital (UEC)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ganancia (UEC)").length).toBeGreaterThan(0);
  });

  it("shows the no-results message for an empty route list (Req 7.2)", () => {
    render(<RouteResults routes={[]} computing={false} expandedView={false} />);

    expect(screen.getByText("No se encontraron rutas")).toBeTruthy();
  });

  it("shows the loading indicator while computing (Req 7.3)", () => {
    const { container } = render(
      <RouteResults routes={[]} computing={true} expandedView={false} />,
    );

    // The loading text is shown...
    expect(screen.getByText("Calculando rutas...")).toBeTruthy();
    // ...and the Ant Design Spin indicator is rendered.
    expect(container.querySelector(".ant-spin")).not.toBeNull();
    // While computing, the no-results message is NOT shown.
    expect(screen.queryByText("No se encontraron rutas")).toBeNull();
  });

  it("reveals extended details only when expanded view is enabled (Req 4.5)", () => {
    const route = makeRoute();

    // Collapsed view: extended columns are not present.
    const { rerender } = render(
      <RouteResults routes={[route]} computing={false} expandedView={false} />,
    );
    expect(screen.queryByText("Venta bruta (UEC)")).toBeNull();
    expect(screen.queryByText("Paradas")).toBeNull();

    // Expanded view: extended columns appear (assert at least one — Ant Design
    // renders a duplicate measurement header row under horizontal scroll).
    rerender(
      <RouteResults routes={[route]} computing={false} expandedView={true} />,
    );
    expect(screen.getAllByText("Venta bruta (UEC)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Paradas").length).toBeGreaterThan(0);
  });
});
