// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from "@testing-library/react";
import RouteFinder from "../RouteFinder";
import { makeMarket } from "./fixtures";

// --- jsdom polyfills for Ant Design ---------------------------------------
// Ant Design controls (Select, InputNumber, Table, Switch) rely on browser
// APIs jsdom lacks. Polyfill the minimum surface so the components mount.
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
 * Component/rendering tests for RouteFinder (task 8.4).
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.5, 7.2, 8.2
 *
 * These are example-based rendering assertions, not property-based tests.
 *
 * KNOWN LIMITATION (shared with task 10.3 in app/components/__tests__):
 * Ant Design `Select` dropdowns open in rc-trigger popups that require real
 * layout measurement and therefore do NOT open under jsdom. So we cannot
 * assert on the rendered ship/commodity/faction *options*. Instead we assert
 * on what is rendered in the DOM without opening a popup: the labels, the
 * placeholders, the input controls, the buttons, the field-level validation
 * spans, the market-data Alert, and the visible state changes triggered by the
 * Switch/InputNumber controls (which work under jsdom).
 */
describe("RouteFinder — inputs, validation, reset, expanded view", () => {
  it("renders the ship/investment controls and filters from market data (Req 2.1, 2.2, 2.3)", () => {
    render(<RouteFinder market={makeMarket()} />);

    // Ship selector + investment input labels and placeholders (Req 2.1, 2.2).
    expect(screen.getByText("Nave")).toBeTruthy();
    expect(screen.getByText("Selecciona una nave")).toBeTruthy();
    expect(screen.getByText("Inversión inicial (UEC)")).toBeTruthy();
    expect(
      screen.getByPlaceholderText("Ingresa tu capital en UEC"),
    ).toBeTruthy();

    // Submit + Reset controls (Req 2.3).
    expect(screen.getByText("Buscar rutas")).toBeTruthy();
    expect(screen.getByText("Reiniciar")).toBeTruthy();

    // The filters sidebar, populated from market data, renders its controls.
    expect(screen.getByText("Filtros")).toBeTruthy();
    expect(screen.getByText("Modo de ganancia")).toBeTruthy();
    expect(screen.getByText("Máximo de paradas")).toBeTruthy();
    expect(screen.getByText("Tipos de mercancía")).toBeTruthy();
    expect(screen.getByText("Mercancías")).toBeTruthy();
    expect(screen.getByText("Facciones")).toBeTruthy();
    expect(screen.getByText("Seguridad mínima")).toBeTruthy();
    expect(screen.getByText("Tamaño de caja (SCU)")).toBeTruthy();
  });

  it("blocks Submit and shows validation messages when ship/investment are missing (Req 2.5, 2.6)", () => {
    render(<RouteFinder market={makeMarket()} />);

    // No ship selected and no investment entered → click Submit.
    fireEvent.click(screen.getByText("Buscar rutas"));

    // Field-level validation messages appear (plain spans, render in jsdom).
    expect(screen.getByText("Selecciona una nave.")).toBeTruthy();
    expect(
      screen.getByText("Ingresa una inversión válida mayor que cero."),
    ).toBeTruthy();

    // No computation ran, so no route rows exist — the results area shows the
    // no-results message instead.
    expect(screen.getByText("No se encontraron rutas")).toBeTruthy();
  });

  it("restores defaults: Reset clears the investment input (Req 2.4)", () => {
    render(<RouteFinder market={makeMarket()} />);

    const investment = screen.getByPlaceholderText(
      "Ingresa tu capital en UEC",
    ) as HTMLInputElement;

    // Set a value via the InputNumber (works under jsdom).
    fireEvent.change(investment, { target: { value: "5000" } });
    expect(investment.value).not.toBe("");

    // Reset restores defaults and clears the investment.
    fireEvent.click(screen.getByText("Reiniciar"));
    expect(investment.value).toBe("");
  });

  it("reveals extended details when the Expanded view toggle is enabled (Req 4.5)", () => {
    render(<RouteFinder market={makeMarket()} />);

    // Default (expanded view off): extended column header absent.
    expect(screen.queryByText("Venta bruta (UEC)")).toBeNull();

    // Toggle "Vista expandida" on — locate the Switch within its row.
    const label = screen.getByText("Vista expandida");
    const row = label.parentElement as HTMLElement;
    const toggle = within(row).getByRole("switch");
    fireEvent.click(toggle);

    // The extended column header is now revealed in the results table. Ant
    // Design renders a duplicate measurement header under horizontal scroll, so
    // assert at least one occurrence.
    expect(screen.getAllByText("Venta bruta (UEC)").length).toBeGreaterThan(0);
  });

  it("shows the market-data error when critical datasets are empty (Req 8.2)", () => {
    render(<RouteFinder market={makeMarket({ prices: [], vehicles: [] })} />);

    expect(
      screen.getByText("No se pudieron cargar los datos de mercado."),
    ).toBeTruthy();
    // The input controls are not rendered in the error state.
    expect(screen.queryByText("Buscar rutas")).toBeNull();
  });
});
