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

// next/link renders a plain anchor in tests so we can assert on `href` and on
// the click target without pulling in the App Router runtime.
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

import CategoryList from "../[category]/CategoryList";
import type { WikiListItem } from "../types";

// --- jsdom polyfills for Ant Design ---------------------------------------
// Ant Design's Input/Empty rely on browser APIs jsdom lacks. Polyfill the
// minimum surface so the components mount.
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

const SHIPS: WikiListItem[] = [
  {
    id: 1,
    categoryId: "naves",
    name: "Aurora MR",
    slug: "aurora-mr",
    subtitle: "Roberts Space Industries",
  },
  {
    id: 2,
    categoryId: "naves",
    name: "Constellation Andromeda",
    slug: "constellation-andromeda",
    subtitle: "Roberts Space Industries",
  },
  {
    id: 3,
    categoryId: "naves",
    name: "Cutlass Black",
    slug: "cutlass-black",
    subtitle: "Drake Interplanetary",
  },
];

const filterInput = (): HTMLInputElement =>
  screen.getByLabelText("Filtrar por nombre") as HTMLInputElement;

/**
 * Component tests for CategoryList (task 8.3).
 * Validates: Requirements 4.4, 4.5, 4.6
 *
 * Example-based rendering assertions (not property-based). They cover the
 * client island's behaviour: each element links to its detail (Req 4.4), the
 * name filter reduces the visible elements (Req 4.5), and a filter that yields
 * no matches shows an empty state instead of an empty grid (Req 4.6).
 */
describe("CategoryList — navegación al detalle, filtro por nombre, estado vacío", () => {
  it("muestra cada nave con nombre y empresa, enlazando a su detalle (Req 4.3, 4.4)", () => {
    render(<CategoryList items={SHIPS} categoryId="naves" />);

    // Name + manufacturer subtitle are shown for each ship.
    expect(screen.getByText("Aurora MR")).toBeTruthy();
    expect(screen.getByText("Cutlass Black")).toBeTruthy();
    expect(screen.getByText("Drake Interplanetary")).toBeTruthy();

    // Each item is a link to /wiki/{categoryId}/{slug} (navigation to detail).
    const auroraLink = screen.getByText("Aurora MR").closest("a");
    expect(auroraLink).not.toBeNull();
    expect(auroraLink?.getAttribute("href")).toBe("/wiki/naves/aurora-mr");

    const cutlassLink = screen.getByText("Cutlass Black").closest("a");
    expect(cutlassLink?.getAttribute("href")).toBe("/wiki/naves/cutlass-black");

    // One link per element.
    expect(screen.getAllByRole("link")).toHaveLength(SHIPS.length);
  });

  it("usa item.categoryId al construir el href del detalle (Req 4.4)", () => {
    // Even if the route segment differs, the detail href follows item.categoryId.
    render(<CategoryList items={SHIPS} categoryId="otra-categoria" />);
    const auroraLink = screen.getByText("Aurora MR").closest("a");
    expect(auroraLink?.getAttribute("href")).toBe("/wiki/naves/aurora-mr");
  });

  it("filtra las naves mostradas por el texto introducido, sin distinguir mayúsculas (Req 4.5)", () => {
    render(<CategoryList items={SHIPS} categoryId="naves" />);

    // Typing "cut" (lowercase) matches only "Cutlass Black".
    fireEvent.change(filterInput(), { target: { value: "cut" } });

    expect(screen.getByText("Cutlass Black")).toBeTruthy();
    expect(screen.queryByText("Aurora MR")).toBeNull();
    expect(screen.queryByText("Constellation Andromeda")).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("conserva todos los elementos cuando el filtro está vacío (Req 4.5)", () => {
    render(<CategoryList items={SHIPS} categoryId="naves" />);

    fireEvent.change(filterInput(), { target: { value: "con" } });
    expect(screen.getAllByRole("link")).toHaveLength(1);

    // Clearing the filter restores the full list.
    fireEvent.change(filterInput(), { target: { value: "" } });
    expect(screen.getAllByRole("link")).toHaveLength(SHIPS.length);
  });

  it("muestra un estado vacío cuando el filtro no produce coincidencias (Req 4.6)", () => {
    render(<CategoryList items={SHIPS} categoryId="naves" />);

    fireEvent.change(filterInput(), { target: { value: "no-existe-zzz" } });

    expect(
      screen.getByText("No hay elementos que coincidan con el filtro"),
    ).toBeTruthy();
    // No item links remain in the empty state.
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("muestra el estado vacío cuando no hay elementos (Req 4.6)", () => {
    const { container } = render(
      <CategoryList items={[]} categoryId="naves" />,
    );

    expect(
      screen.getByText("No hay elementos que coincidan con el filtro"),
    ).toBeTruthy();
    // The grid list is not rendered at all.
    expect(within(container).queryByRole("list")).toBeNull();
  });
});
